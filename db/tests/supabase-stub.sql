-- Minimal stand-in for what a Supabase database provides, so the migrations
-- can be tested on plain Postgres (no Docker). Not used on Supabase itself.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema extensions;
create extension pgcrypto schema extensions;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Same lookup order as Supabase's auth.uid().
create function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;

create publication supabase_realtime;

-- pg_net: record requests instead of sending them.
create schema net;
create table net.requests (
  id bigint generated always as identity primary key,
  url text, headers jsonb, body jsonb, created timestamptz default now()
);
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
                              headers jsonb default '{}', timeout_milliseconds integer default 5000)
returns bigint language sql as $$
  insert into net.requests (url, headers, body) values (url, headers, body) returning id
$$;

-- pg_cron: record scheduled jobs.
create schema cron;
create table cron.jobs (jobname text primary key, schedule text, command text);
create function cron.schedule(job_name text, schedule text, command text) returns bigint
language sql as $$
  insert into cron.jobs values (job_name, schedule, command) returning 1::bigint
$$;
