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
