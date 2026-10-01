-- Security hardening after the first audit.
--
-- * Login rate limit per IP: use the address the Supabase edge sees, not the
--   first X-Forwarded-For entry, which the client can set to anything.
-- * Push subscriptions: only real push services as endpoints (the send-push
--   function posts to them, so an arbitrary URL would let a client make our
--   server call any host), sane key sizes, and at most 10 devices per person.
-- * aulas.created_by is always the signed-in person, never what the client sends.
-- * Daily cleanup of old login attempts and of anonymous devices that never
--   signed in to anyone.
-- * Indexes for foreign keys used by deletes and joins.

-- ---------------------------------------------------------------------------
-- Login rate limit by the real client address
-- ---------------------------------------------------------------------------

-- Cloudflare (in front of Supabase) sets cf-connecting-ip and rejects requests
-- that try to forge it; sb-forwarded-for is set by the Supabase gateway.
-- Without either we skip the per-IP limit (the per-device limit still holds)
-- rather than trust a header the client controls.
create function private.client_ip() returns text
language sql stable set search_path = ''
as $$
  select coalesce(
    nullif(trim(h ->> 'cf-connecting-ip'), ''),
    nullif(trim(split_part(h ->> 'sb-forwarded-for', ',', 1)), ''),
    ''
  )
  from (select nullif(current_setting('request.headers', true), '')::json as h) r
$$;

revoke all on function private.client_ip() from public, authenticated;

create or replace function public.redeem_access_code(code text)
returns table (person_id uuid, name text, role public.person_role)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  client_ip text := private.client_ip();
  found_person uuid;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;

  if (select count(*) from private.login_attempts a
       where a.auth_user_id = uid and not a.ok and a.attempted_at > now() - interval '10 minutes') >= 5
     or (client_ip <> '' and (select count(*) from private.login_attempts a
       where a.ip = client_ip and not a.ok and a.attempted_at > now() - interval '10 minutes') >= 20)
  then
    raise exception 'too_many_attempts' using errcode = 'P0001';
  end if;

  select c.person_id into found_person
    from public.access_codes c
   where c.code_hash = private.hash_access_code(code);

  insert into private.login_attempts (auth_user_id, ip, ok) values (uid, client_ip, found_person is not null);

  if found_person is null then
    return;
  end if;

  insert into public.person_logins (auth_user_id, person_id)
  values (uid, found_person)
  on conflict (auth_user_id) do update set person_id = excluded.person_id, created_at = now();

  return query select p.id, p.name, p.role from public.people p where p.id = found_person;
end;
$$;

-- ---------------------------------------------------------------------------
-- Push subscriptions
-- ---------------------------------------------------------------------------

alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_check check (
    length(endpoint) <= 1024
    and endpoint ~ '^https://(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/'
  ),
  add constraint push_subscriptions_keys_check check (
    p256dh ~ '^[A-Za-z0-9_-]{80,100}=*$' and auth ~ '^[A-Za-z0-9_-]{16,32}=*$'
  ),
  add constraint push_subscriptions_platform_check check (length(platform) <= 200);

create function private.limit_push_subscriptions() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.push_subscriptions s where s.person_id = new.person_id) >= 10 then
    raise exception 'too_many_devices' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_push_subscriptions() from public, authenticated;

create trigger push_subscriptions_limit
  before insert on public.push_subscriptions
  for each row execute function private.limit_push_subscriptions();

-- ---------------------------------------------------------------------------
-- aulas.created_by comes from the session
-- ---------------------------------------------------------------------------

create function private.set_created_by() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
  elsif auth.uid() is not null then
    -- Rows written by the service role or the seed keep what they set.
    new.created_by := private.current_person_id();
  end if;
  return new;
end;
$$;

revoke all on function private.set_created_by() from public, authenticated;

create trigger aulas_created_by
  before insert or update of created_by on public.aulas
  for each row execute function private.set_created_by();

-- ---------------------------------------------------------------------------
-- Daily cleanup
-- ---------------------------------------------------------------------------

-- Login attempts only matter for 10 minutes; keep a day for troubleshooting.
-- A device that signed in anonymously but is not linked to anyone (code never
-- accepted, or signed out) is removed after 7 days; it signs in again on its
-- next code. Returns how many devices were removed.
create function private.cleanup() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  delete from private.login_attempts where attempted_at < now() - interval '1 day';
  delete from auth.users u
   where u.is_anonymous
     and u.created_at < now() - interval '7 days'
     and not exists (select 1 from public.person_logins l where l.auth_user_id = u.id);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function private.cleanup() from public, authenticated;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('wiz-aula-cleanup', '17 6 * * *', 'select private.cleanup()');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Foreign-key indexes
-- ---------------------------------------------------------------------------

create index aulas_created_by_idx on public.aulas (created_by);
create index join_events_person_idx on public.join_events (person_id);
-- Covers the (teacher_id, school_id) foreign key and lookups by teacher.
create index turmas_teacher_school_idx on public.turmas (teacher_id, school_id);
drop index public.turmas_teacher_idx;
