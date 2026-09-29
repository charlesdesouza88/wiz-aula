-- Push alerts: VAPID keys, the send trigger and the T-10 reminder job.
--
-- Sending happens in the Edge Function supabase/functions/send-push, which
-- the database calls through pg_net:
--   * when a lightning class starts (insert) or the teacher taps
--     "Avisar de novo" (ping_at changes), from a trigger;
--   * at T-10 for scheduled classes, from a pg_cron job every minute.
-- Per project, after applying this migration, set private.settings:
--   vapid_public_key, vapid_private_key (npx web-push generate-vapid-keys),
--   functions_url (https://<ref>.supabase.co/functions/v1). Until then no
--   alert is sent and the app hides "Ativar avisos".

-- pg_net and pg_cron exist on Supabase; the plain-Postgres test harness stubs them.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
end;
$$;

alter table private.settings
  add column vapid_public_key text,
  add column vapid_private_key text,
  add column vapid_subject text not null default 'mailto:contato@misterwiz.fun',
  add column functions_url text,
  -- Shared secret the Edge Function checks, so only this database can trigger sends.
  add column push_secret text not null default encode(extensions.gen_random_bytes(32), 'hex');

-- ---------------------------------------------------------------------------
-- Config for the app and for the Edge Function
-- ---------------------------------------------------------------------------

-- The browser needs the public key to subscribe; null while push is not set up.
create function public.vapid_public_key() returns text
language sql stable security definer set search_path = ''
as $$
  select case when s.functions_url is not null then s.vapid_public_key end from private.settings s
$$;

revoke all on function public.vapid_public_key() from public, anon;
grant execute on function public.vapid_public_key() to authenticated;

-- Everything the Edge Function needs; only the service role may call it.
create function public.push_config()
returns table (vapid_public_key text, vapid_private_key text, vapid_subject text, push_secret text)
language sql stable security definer set search_path = ''
as $$
  select s.vapid_public_key, s.vapid_private_key, s.vapid_subject, s.push_secret from private.settings s
$$;

revoke all on function public.push_config() from public, anon, authenticated;
grant execute on function public.push_config() to service_role;

-- ---------------------------------------------------------------------------
-- Calling the Edge Function
-- ---------------------------------------------------------------------------

-- kind: 'live' (lightning started or re-sent) or 'reminder' (T-10).
create function private.request_push(aula uuid, kind text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  s private.settings;
begin
  select * into s from private.settings;
  if s.functions_url is null or s.vapid_private_key is null then
    return;
  end if;
  perform net.http_post(
    url := s.functions_url || '/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', s.push_secret),
    body := jsonb_build_object('aula_id', aula, 'kind', kind)
  );
end;
$$;

revoke all on function private.request_push(uuid, text) from public, authenticated;

create function private.push_on_aula_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'lightning' and new.status = 'live' then
      perform private.request_push(new.id, 'live');
    end if;
  elsif new.ping_at is distinct from old.ping_at and new.ping_at is not null and new.status <> 'ended' then
    perform private.request_push(new.id, 'live');
  end if;
  return null;
end;
$$;

revoke all on function private.push_on_aula_change() from public, authenticated;

create trigger aulas_push
  after insert or update of ping_at on public.aulas
  for each row execute function private.push_on_aula_change();

-- ---------------------------------------------------------------------------
-- T-10 reminders
-- ---------------------------------------------------------------------------

-- Marks scheduled classes that start within the next 10 minutes as reminded
-- and asks for their alert. Returns how many were sent. Run every minute.
create function private.send_due_reminders() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  due uuid;
  n integer := 0;
begin
  for due in
    update public.aulas
       set reminder_sent_at = now()
     where type = 'scheduled'
       and status = 'scheduled'
       and reminder_sent_at is null
       and start_at > now()
       and start_at <= now() + interval '10 minutes'
    returning id
  loop
    perform private.request_push(due, 'reminder');
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function private.send_due_reminders() from public, authenticated;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('wiz-aula-reminders', '* * * * *', 'select private.send_due_reminders()');
  end if;
end;
$$;
