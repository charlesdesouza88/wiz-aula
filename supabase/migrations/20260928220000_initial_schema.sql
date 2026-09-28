-- Wiz Aula initial schema: tables, constraints and row-level security.
-- All timestamps are timestamptz (stored as UTC); the app displays America/Sao_Paulo.
-- LGPD: for students we keep only name, school, turmas and the access-code hash.
-- The service role (server code) bypasses RLS; clients use anon/authenticated.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.person_role as enum ('student', 'teacher', 'admin');
create type public.aula_type as enum ('scheduled', 'lightning');
-- Scheduled classes are 'scheduled' until ended early; "live" for them is derived
-- from the clock (T-10 until the end). Lightning classes are created 'live'.
create type public.aula_status as enum ('scheduled', 'live', 'ended');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  city text,
  created_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  role public.person_role not null,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (id, school_id)
);

create index people_school_idx on public.people (school_id);

-- Kept apart from people so clients can never read it (no grants, no policies).
create table public.access_codes (
  person_id uuid primary key references public.people (id) on delete cascade,
  -- Hex HMAC-SHA256 of the normalised code (upper case, spaces and hyphens
  -- removed) keyed with the server-side ACCESS_CODE_PEPPER. Deterministic so
  -- the login can look it up; the code itself is never stored.
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

-- Links a Supabase Auth user (one per signed-in device) to a person.
-- Written only by the server after it verifies an access code (milestone 3).
create table public.person_logins (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index person_logins_person_idx on public.person_logins (person_id);

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  nivel text not null default '',
  horario text not null default '',
  teacher_id uuid,
  -- Fixed Meet link for the turma, already normalised by the app.
  meet_link text check (meet_link ~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  created_at timestamptz not null default now(),
  -- The teacher must belong to the same school.
  foreign key (teacher_id, school_id) references public.people (id, school_id) on delete set null (teacher_id)
);

create index turmas_school_idx on public.turmas (school_id);
create index turmas_teacher_idx on public.turmas (teacher_id);

create table public.enrollments (
  person_id uuid not null references public.people (id) on delete cascade,
  turma_id uuid not null references public.turmas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, turma_id)
);

create index enrollments_turma_idx on public.enrollments (turma_id);

create table public.aulas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas (id) on delete cascade,
  type public.aula_type not null,
  title text not null default '',
  start_at timestamptz not null,
  duration_min integer not null default 60 check (duration_min between 5 and 240),
  meet_link text not null check (meet_link ~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  status public.aula_status not null,
  -- Last time the students were alerted (start of a lightning class, "Avisar de novo").
  ping_at timestamptz,
  -- Set by the T-10 reminder job so each scheduled class is reminded once.
  reminder_sent_at timestamptz,
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint aulas_status_matches_type check (
    (type = 'scheduled' and status in ('scheduled', 'ended'))
    or (type = 'lightning' and status in ('live', 'ended'))
  )
);

create index aulas_turma_start_idx on public.aulas (turma_id, start_at);
-- For the reminder job: scheduled classes not yet reminded.
create index aulas_reminder_idx on public.aulas (start_at)
  where type = 'scheduled' and status = 'scheduled' and reminder_sent_at is null;
-- At most one live lightning class per turma.
create unique index aulas_one_live_lightning_idx on public.aulas (turma_id)
  where type = 'lightning' and status = 'live';

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text not null default '',
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);

create index push_subscriptions_person_idx on public.push_subscriptions (person_id);

create table public.join_events (
  id bigint generated always as identity primary key,
  aula_id uuid not null references public.aulas (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  joined_at timestamptz not null default now()
);

create index join_events_aula_idx on public.join_events (aula_id);

-- ---------------------------------------------------------------------------
-- Lightning replaces lightning
-- ---------------------------------------------------------------------------

-- Starting a lightning class ends the turma's previous live lightning class,
-- in the same transaction, so the unique index above never trips.
-- Runs as the inserting user, so the teacher's own update policy applies.
create function public.end_previous_lightning() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.aulas
     set status = 'ended'
   where turma_id = new.turma_id
     and type = 'lightning'
     and status = 'live';
  return new;
end;
$$;

create trigger aulas_end_previous_lightning
  before insert on public.aulas
  for each row
  when (new.type = 'lightning' and new.status = 'live')
  execute function public.end_previous_lightning();

-- ---------------------------------------------------------------------------
-- RLS helpers (private schema, not exposed through the API)
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- The person signed in on this device, or null.
create function private.current_person_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select person_id from public.person_logins where auth_user_id = (select auth.uid())
$$;

create function private.current_school_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.school_id from public.people p where p.id = private.current_person_id()
$$;

create function private.current_person_role() returns public.person_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.people p where p.id = private.current_person_id()
$$;

-- Teacher or admin of the signed-in person's school.
create function private.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.current_person_role() in ('teacher', 'admin'), false)
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.current_person_role() = 'admin', false)
$$;

-- May write the turma's classes: its teacher, or an admin of its school.
create function private.teaches(turma uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.turmas t
     where t.id = turma
       and (t.teacher_id = private.current_person_id()
            or (private.is_admin() and t.school_id = private.current_school_id()))
  )
$$;

-- May see the turma: enrolled students, plus staff of its school.
create function private.can_view_turma(turma uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.turmas t
     where t.id = turma
       and (
         (private.is_staff() and t.school_id = private.current_school_id())
         or exists (
           select 1 from public.enrollments e
            where e.turma_id = t.id and e.person_id = private.current_person_id()
         )
       )
  )
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;
revoke all on function public.end_previous_lightning() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Grants: anonymous visitors get nothing; signed-in users go through RLS.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
-- Server only (service role).
revoke all on public.person_logins, public.access_codes from authenticated;
-- Rosters are managed on the server, where codes are hashed.
revoke insert, update, delete on public.people from authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.people enable row level security;
alter table public.access_codes enable row level security;
alter table public.person_logins enable row level security;
alter table public.turmas enable row level security;
alter table public.enrollments enable row level security;
alter table public.aulas enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.join_events enable row level security;

-- schools: your own school only; managed with the service role.
create policy "read own school" on public.schools
  for select to authenticated
  using (id = (select private.current_school_id()));

-- people: yourself; staff see everyone in their school. Rosters are managed
-- with the service role (codes must be hashed on the server).
create policy "read self or school as staff" on public.people
  for select to authenticated
  using (
    id = (select private.current_person_id())
    or ((select private.is_staff()) and school_id = (select private.current_school_id()))
  );

-- person_logins, access_codes: no policies, service role only.

-- turmas
create policy "read visible turmas" on public.turmas
  for select to authenticated
  using (private.can_view_turma(id));

create policy "staff create turmas in own school" on public.turmas
  for insert to authenticated
  with check (
    (select private.is_staff())
    and school_id = (select private.current_school_id())
    and (teacher_id = (select private.current_person_id()) or (select private.is_admin()))
  );

create policy "teacher updates own turma" on public.turmas
  for update to authenticated
  using (private.teaches(id))
  with check (
    school_id = (select private.current_school_id())
    and (teacher_id = (select private.current_person_id()) or (select private.is_admin()))
  );

create policy "admin deletes turmas" on public.turmas
  for delete to authenticated
  using ((select private.is_admin()) and school_id = (select private.current_school_id()));

-- enrollments: your own; staff see their school's. Managed by admins.
create policy "read own or as staff" on public.enrollments
  for select to authenticated
  using (
    person_id = (select private.current_person_id())
    or ((select private.is_staff()) and private.can_view_turma(turma_id))
  );

create policy "admin manages enrollments" on public.enrollments
  for all to authenticated
  using ((select private.is_admin()) and private.can_view_turma(turma_id))
  with check (
    (select private.is_admin())
    and private.can_view_turma(turma_id)
    and exists (
      select 1 from public.people p
       where p.id = person_id and p.school_id = (select private.current_school_id())
    )
  );

-- aulas: visible with the turma; written by its teacher (or a school admin).
create policy "read aulas of visible turmas" on public.aulas
  for select to authenticated
  using (private.can_view_turma(turma_id));

create policy "teacher inserts aulas" on public.aulas
  for insert to authenticated
  with check (private.teaches(turma_id));

create policy "teacher updates aulas" on public.aulas
  for update to authenticated
  using (private.teaches(turma_id))
  with check (private.teaches(turma_id));

create policy "teacher deletes aulas" on public.aulas
  for delete to authenticated
  using (private.teaches(turma_id));

-- push_subscriptions: each person manages their own devices.
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (person_id = (select private.current_person_id()))
  with check (person_id = (select private.current_person_id()));

-- join_events: students record their own joins; teachers read their turmas'.
create policy "record own join" on public.join_events
  for insert to authenticated
  with check (
    person_id = (select private.current_person_id())
    and exists (
      select 1 from public.aulas a where a.id = aula_id and private.can_view_turma(a.turma_id)
    )
  );

create policy "read own joins or as teacher" on public.join_events
  for select to authenticated
  using (
    person_id = (select private.current_person_id())
    or exists (select 1 from public.aulas a where a.id = aula_id and private.teaches(a.turma_id))
  );
