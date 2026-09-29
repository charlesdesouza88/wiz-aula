-- Access-code login, read access for the app, and realtime.
--
-- Login flow: the browser signs in anonymously with Supabase Auth (one auth
-- user per device, no email or phone), then calls redeem_access_code(code).
-- The function checks the code and links the device's auth user to the person
-- in person_logins, which is what every RLS policy keys on.

-- ---------------------------------------------------------------------------
-- Settings: the pepper for access-code hashes, random per database
-- ---------------------------------------------------------------------------

create table private.settings (
  id boolean primary key default true check (id),
  access_code_pepper text not null
);

insert into private.settings (access_code_pepper)
values (encode(extensions.gen_random_bytes(32), 'hex'));

-- Hex HMAC-SHA256 of a normalised access code (upper case, spaces and hyphens removed).
create function private.hash_access_code(code text) returns text
language sql stable security definer set search_path = ''
as $$
  select encode(
    extensions.hmac(upper(regexp_replace(code, '[[:space:]-]', '', 'g')), s.access_code_pepper, 'sha256'),
    'hex'
  )
  from private.settings s
$$;

revoke all on function private.hash_access_code(text) from public, authenticated;

-- ---------------------------------------------------------------------------
-- Login attempts, for rate limiting
-- ---------------------------------------------------------------------------

create table private.login_attempts (
  id bigint generated always as identity primary key,
  auth_user_id uuid not null,
  ip text not null default '',
  ok boolean not null,
  attempted_at timestamptz not null default now()
);

create index login_attempts_user_idx on private.login_attempts (auth_user_id, attempted_at);
create index login_attempts_ip_idx on private.login_attempts (ip, attempted_at);

-- ---------------------------------------------------------------------------
-- redeem_access_code
-- ---------------------------------------------------------------------------

-- Returns the signed-in person, or no row when the code is unknown.
-- Raises 'too_many_attempts' after 5 failures per device or 20 per IP in 10 minutes.
create function public.redeem_access_code(code text)
returns table (person_id uuid, name text, role public.person_role)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  client_ip text := split_part(
    coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1);
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

revoke all on function public.redeem_access_code(text) from public, anon;
grant execute on function public.redeem_access_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- The app reads its own login row and signs out by deleting it
-- ---------------------------------------------------------------------------

grant select, delete on public.person_logins to authenticated;

create policy "read own login" on public.person_logins
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy "sign out" on public.person_logins
  for delete to authenticated
  using (auth_user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Students see the name of their turmas' teachers ("Com o professor Chuck")
-- ---------------------------------------------------------------------------

create function private.teaches_me(person uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
      from public.turmas t
      join public.enrollments e on e.turma_id = t.id
     where t.teacher_id = person and e.person_id = private.current_person_id()
  )
$$;

revoke all on function private.teaches_me(uuid) from public;
grant execute on function private.teaches_me(uuid) to authenticated;

create policy "students read their teachers" on public.people
  for select to authenticated
  using (private.teaches_me(id));

-- ---------------------------------------------------------------------------
-- Realtime: open screens update when a class starts, changes or ends
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.aulas, public.turmas;
