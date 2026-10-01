-- School admins add students and teachers and manage their access codes.
--
-- access_codes and person_logins stay closed to clients; admins go through
-- these functions, which check that the caller is an admin of the person's
-- school. A code is shown once, when it is created: only its hash is stored.
--
--   admin_roster()                   everyone in the school, with code and device status
--   admin_add_person(name, role, turma)  new student or teacher, returns the first code
--   admin_new_code(person)           replaces the code and signs the person out everywhere
--   admin_remove_person(person)      deletes the person and everything that is theirs
--
-- Also fixes the device cap from the hardening migration: re-saving a device
-- that is already registered (every sign-in does) no longer counts as new.

-- ---------------------------------------------------------------------------
-- Codes
-- ---------------------------------------------------------------------------

-- WIZ-XXXX-XXXX from 31 symbols that cannot be mistaken for each other
-- (no 0/O, 1/I/L): about 40 bits, drawn without modulo bias.
create function private.new_access_code() returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  raw bytea;
  symbols text := '';
  v integer;
begin
  while length(symbols) < 8 loop
    raw := extensions.gen_random_bytes(16);
    for i in 0 .. 15 loop
      v := get_byte(raw, i);
      -- 248 = 31 * 8: bytes above it would favour the first symbols.
      if v < 248 and length(symbols) < 8 then
        symbols := symbols || substr(alphabet, v % 31 + 1, 1);
      end if;
    end loop;
  end loop;
  return 'WIZ-' || substr(symbols, 1, 4) || '-' || substr(symbols, 5, 4);
end;
$$;

-- Gives the person a new code and signs out every device that used the old
-- one, including their alerts (a signed-in device re-registers on its own).
create function private.issue_code(person uuid) returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  code text;
begin
  loop
    code := private.new_access_code();
    begin
      insert into public.access_codes (person_id, code_hash)
      values (person, private.hash_access_code(code))
      on conflict (person_id) do update set code_hash = excluded.code_hash, created_at = now();
      exit;
    exception when unique_violation then
      -- Someone else already has this code (very unlikely): draw another.
    end;
  end loop;
  delete from public.person_logins where person_id = person;
  delete from public.push_subscriptions where person_id = person;
  return code;
end;
$$;

-- The caller must be an admin; returns their school.
create function private.admin_school() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return private.current_school_id();
end;
$$;

-- A student or teacher of the caller's school. Admins (the caller included)
-- are managed in the Supabase dashboard, so nobody can lock the school out.
create function private.admin_target(person uuid) returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.people p
                  where p.id = person and p.school_id = private.admin_school() and p.role <> 'admin')
  then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.new_access_code(), private.issue_code(uuid), private.admin_school(),
  private.admin_target(uuid) from public, authenticated;

-- ---------------------------------------------------------------------------
-- Admin API
-- ---------------------------------------------------------------------------

create function public.admin_roster()
returns table (
  person_id uuid,
  name text,
  role public.person_role,
  turma_ids uuid[],
  code_created_at timestamptz,
  devices integer,
  alerts integer
)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.name, p.role,
         coalesce(array(select e.turma_id from public.enrollments e where e.person_id = p.id), '{}'),
         c.created_at,
         (select count(*)::integer from public.person_logins l where l.person_id = p.id),
         (select count(*)::integer from public.push_subscriptions s where s.person_id = p.id)
    from public.people p
    left join public.access_codes c on c.person_id = p.id
   where p.school_id = private.admin_school()
   order by p.name
$$;

create function public.admin_add_person(name text, role public.person_role, turma uuid default null)
returns table (person_id uuid, code text)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  school uuid := private.admin_school();
  clean text := trim(regexp_replace(name, '[[:space:]]+', ' ', 'g'));
  added uuid;
begin
  if role not in ('student', 'teacher') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if clean = '' or length(clean) > 80 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if turma is not null and (role <> 'student'
     or not exists (select 1 from public.turmas t where t.id = turma and t.school_id = school)) then
    raise exception 'invalid_turma' using errcode = '22023';
  end if;

  insert into public.people (school_id, role, name) values (school, role, clean) returning id into added;
  if turma is not null then
    insert into public.enrollments (person_id, turma_id) values (added, turma);
  end if;
  return query select added, private.issue_code(added);
end;
$$;

create function public.admin_new_code(person uuid) returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform private.admin_target(person);
  return private.issue_code(person);
end;
$$;

-- Their code, devices, alerts, enrolments and attendance go with them; turmas
-- they taught stay, without a teacher.
create function public.admin_remove_person(person uuid) returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform private.admin_target(person);
  delete from public.people where id = person;
end;
$$;

revoke all on function public.admin_roster(), public.admin_add_person(text, public.person_role, uuid),
  public.admin_new_code(uuid), public.admin_remove_person(uuid) from public, anon;
grant execute on function public.admin_roster(), public.admin_add_person(text, public.person_role, uuid),
  public.admin_new_code(uuid), public.admin_remove_person(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Device cap: only new devices count
-- ---------------------------------------------------------------------------

create or replace function private.limit_push_subscriptions() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- An upsert of a known endpoint also fires this trigger before it turns into an update.
  if exists (select 1 from public.push_subscriptions s where s.endpoint = new.endpoint) then
    return new;
  end if;
  if (select count(*) from public.push_subscriptions s where s.person_id = new.person_id) >= 10 then
    raise exception 'too_many_devices' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
