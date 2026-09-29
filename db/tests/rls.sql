-- Row-level security and constraint tests. Runs after the migrations and
-- supabase/seed.sql (see scripts/test-db.sh). Any failed check aborts with an error.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create schema test;
grant usage on schema test to anon, authenticated;

create function test.ok(cond boolean, what text) returns void
language plpgsql as $$
begin
  if cond is not true then
    raise exception 'FAILED: %', what;
  end if;
  raise notice 'ok - %', what;
end;
$$;

-- Runs `stmt` and expects it to fail with the given SQLSTATE.
create function test.fails(stmt text, state text, what text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED: % (statement succeeded)', what;
exception
  when others then
    if sqlstate = state then
      raise notice 'ok - %', what;
    elsif sqlerrm like 'FAILED:%' then
      raise;
    else
      raise exception 'FAILED: % (got % %)', what, sqlstate, sqlerrm;
    end if;
end;
$$;

-- Number of rows a statement affects or returns.
create function test.count_rows(stmt text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute 'with q as (' || stmt || ') select count(*) from q' into n;
  return n;
end;
$$;

create function test.rows_changed(stmt text) returns bigint
language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema test to anon, authenticated;

-- A second school to check isolation, plus one device login per person.
insert into public.schools (id, name) values ('00000000-0000-4000-8000-00000000000b', 'Outra Escola');
insert into public.people (id, school_id, role, name) values
  ('00000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000000b', 'teacher', 'Outro Prof'),
  ('00000000-0000-4000-8000-00000000b201', '00000000-0000-4000-8000-00000000000b', 'student', 'Outro Aluno'),
  ('00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-000000000001', 'admin', 'Admin');
insert into public.turmas (id, school_id, name, teacher_id, meet_link) values
  ('00000000-0000-4000-8000-00000000b301', '00000000-0000-4000-8000-00000000000b', 'Outra Turma',
   '00000000-0000-4000-8000-00000000b101', 'https://meet.google.com/zzz-zzzz-zzz');
insert into public.enrollments values ('00000000-0000-4000-8000-00000000b201', '00000000-0000-4000-8000-00000000b301');
insert into public.aulas (id, turma_id, type, start_at, meet_link, status) values
  ('00000000-0000-4000-8000-00000000b401', '00000000-0000-4000-8000-00000000b301', 'scheduled',
   now() + interval '1 day', 'https://meet.google.com/zzz-zzzz-zzz', 'scheduled');

-- Auth users: 1xx = device of the person with the same suffix; 999 = signed in, no person.
insert into auth.users (id) values
  ('10000000-0000-4000-8000-000000000101'), ('10000000-0000-4000-8000-000000000201'),
  ('10000000-0000-4000-8000-000000000202'), ('10000000-0000-4000-8000-00000000b101'),
  ('10000000-0000-4000-8000-00000000a001'), ('10000000-0000-4000-8000-000000000999');
insert into public.person_logins (auth_user_id, person_id) values
  ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000101'),
  ('10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201'),
  ('10000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000202'),
  ('10000000-0000-4000-8000-00000000b101', '00000000-0000-4000-8000-00000000b101'),
  ('10000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a001');

\set masters '''00000000-0000-4000-8000-000000000301'''
\set outra_turma '''00000000-0000-4000-8000-00000000b301'''
\set outra_aula '''00000000-0000-4000-8000-00000000b401'''
\set chuck '''00000000-0000-4000-8000-000000000101'''
\set ana '''00000000-0000-4000-8000-000000000201'''
\set bruno '''00000000-0000-4000-8000-000000000202'''

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

select test.ok((select count(*) from public.people where school_id = '00000000-0000-4000-8000-000000000001' and role = 'student') = 2,
               'seed has two students');
select test.ok((select code_hash from public.access_codes where person_id = :chuck)
               = encode(extensions.hmac('WIZPROF01', (select access_code_pepper from private.settings), 'sha256'), 'hex'),
               'seed hashes codes with HMAC-SHA256 and the database pepper');
select test.ok(private.hash_access_code(' wiz-prof 01 ') = private.hash_access_code('WIZPROF01'),
               'codes are normalised before hashing');
select test.ok(length((select access_code_pepper from private.settings)) = 64, 'the pepper is random 32 bytes');
select test.ok((select count(*) from public.aulas where turma_id = :masters and start_at > now() - interval '1 hour') = 1,
               'seed has one upcoming Masters class');
select test.ok((select extract(hour from start_at at time zone 'America/Sao_Paulo') = 19 from public.aulas where turma_id = :masters),
               'seeded class starts at 19:00 São Paulo time');

-- ---------------------------------------------------------------------------
-- Constraints and the lightning trigger (as the table owner)
-- ---------------------------------------------------------------------------

select test.fails($$insert into public.turmas (school_id, name, meet_link)
  values ('00000000-0000-4000-8000-000000000001', 'X', 'https://meet.google.com/abcdefghij')$$,
  '23514', 'meet_link must be normalised');
select test.fails($$insert into public.aulas (turma_id, type, start_at, meet_link, status)
  values ('00000000-0000-4000-8000-000000000301', 'scheduled', now(), 'https://meet.google.com/abc-defg-hij', 'live')$$,
  '23514', 'a scheduled class cannot be created live');
select test.fails($$insert into public.turmas (school_id, name, teacher_id)
  values ('00000000-0000-4000-8000-00000000000b', 'X', '00000000-0000-4000-8000-000000000101')$$,
  '23503', 'a turma teacher must belong to the same school');
select test.fails(format($$insert into public.access_codes (person_id, code_hash) values (%L, 'WIZALUNO01')$$, :bruno),
  '23514', 'plain-text access codes are rejected');

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------

set role anon;
select test.fails('select * from public.aulas', '42501', 'anon cannot read aulas');
select test.fails('select * from public.people', '42501', 'anon cannot read people');
select test.fails('select * from public.turmas', '42501', 'anon cannot read turmas');
reset role;

-- ---------------------------------------------------------------------------
-- Signed in, but no person linked
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000999", "role": "authenticated"}';
select test.ok(test.count_rows('select * from public.aulas') = 0, 'unlinked user sees no aulas');
select test.ok(test.count_rows('select * from public.people') = 0, 'unlinked user sees no people');
select test.ok(test.count_rows('select * from public.person_logins') = 0, 'clients see no one else''s device logins');
select test.fails($$insert into public.person_logins values ('10000000-0000-4000-8000-000000000999', '00000000-0000-4000-8000-000000000101')$$,
                  '42501', 'clients cannot link a device to a person themselves');
select test.fails('select * from public.access_codes', '42501', 'clients cannot read access codes');
reset role;

-- ---------------------------------------------------------------------------
-- Student Ana
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000201", "role": "authenticated"}';
select test.ok(test.count_rows('select * from public.schools') = 1, 'student sees only her school');
select test.ok((select string_agg(name, ', ' order by name) from public.people) = 'Ana (teste), Chuck', 'student sees herself and her teacher only');
select test.ok(test.count_rows('select * from public.turmas') = 1, 'student sees only her turma');
select test.ok(test.count_rows('select * from public.aulas') = 1, 'student sees only her turma''s aulas');
select test.ok(test.count_rows('select * from public.enrollments') = 1, 'student sees only her enrolment');
select test.fails('select * from public.access_codes', '42501', 'student cannot read access-code hashes');
select test.fails(format($$insert into public.aulas (turma_id, type, start_at, meet_link, status)
  values (%L, 'lightning', now(), 'https://meet.google.com/abc-defg-hij', 'live')$$, :masters),
  '42501', 'student cannot start a class');
select test.ok(test.rows_changed(format('update public.aulas set status = ''ended'' where turma_id = %L', :masters)) = 0,
               'student cannot end a class');
select test.ok(test.rows_changed(format('update public.turmas set meet_link = null where id = %L', :masters)) = 0,
               'student cannot change the turma link');
select test.fails(format($$update public.people set name = 'X' where id = %L$$, :ana), '42501', 'student cannot rename herself');
select test.ok(test.rows_changed(format($$insert into public.push_subscriptions (person_id, endpoint, p256dh, auth)
  values (%L, 'https://push.example/ana', 'k', 'a')$$, :ana)) = 1, 'student saves her own push subscription');
select test.fails(format($$insert into public.push_subscriptions (person_id, endpoint, p256dh, auth)
  values (%L, 'https://push.example/bruno', 'k', 'a')$$, :bruno), '42501', 'student cannot save a subscription for someone else');
select test.ok(test.rows_changed(format($$insert into public.join_events (aula_id, person_id)
  select id, %L from public.aulas where turma_id = %L$$, :ana, :masters)) = 1, 'student records her own join');
select test.fails(format($$insert into public.join_events (aula_id, person_id) values (%L, %L)$$, :outra_aula, :ana),
  '42501', 'student cannot record a join in another school''s class');
reset role;

-- Bruno cannot see Ana's subscription.
set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000202", "role": "authenticated"}';
select test.ok(test.count_rows('select * from public.push_subscriptions') = 0, 'students do not see each other''s devices');
select test.ok(test.count_rows('select * from public.join_events') = 0, 'students do not see each other''s joins');
reset role;

-- ---------------------------------------------------------------------------
-- Teacher Chuck
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-000000000101", "role": "authenticated"}';
select test.ok(test.count_rows('select * from public.people') = 4, 'teacher sees everyone in his school only');
select test.ok(test.count_rows('select * from public.turmas') = 1, 'teacher sees his school''s turmas only');
select test.ok(test.count_rows('select * from public.join_events') = 1, 'teacher sees joins in his turma');
select test.ok(test.rows_changed(format($$insert into public.aulas (turma_id, type, start_at, meet_link, status, ping_at, created_by)
  values (%L, 'lightning', now(), 'https://meet.google.com/abc-defg-hij', 'live', now(), %L)$$, :masters, :chuck)) = 1,
  'teacher starts a lightning class');
select test.ok(test.rows_changed(format($$insert into public.aulas (turma_id, type, start_at, meet_link, status, ping_at, created_by)
  values (%L, 'lightning', now(), 'https://meet.google.com/xyz-abcd-efg', 'live', now(), %L)$$, :masters, :chuck)) = 1,
  'teacher starts a second lightning class');
select test.ok((select count(*) from public.aulas where turma_id = :masters and type = 'lightning' and status = 'live') = 1,
               'the new lightning class ended the previous one');
select test.ok((select meet_link from public.aulas where turma_id = :masters and type = 'lightning' and status = 'live')
               = 'https://meet.google.com/xyz-abcd-efg', 'the newest lightning class is the live one');
select test.ok(test.rows_changed(format('update public.aulas set ping_at = now() where turma_id = %L and status = ''live''', :masters)) = 1,
               'teacher re-sends the alert');
select test.ok(test.rows_changed(format('update public.turmas set meet_link = ''https://meet.google.com/abc-defg-hij'' where id = %L', :masters)) = 1,
               'teacher updates his turma link');
select test.fails(format($$insert into public.aulas (turma_id, type, start_at, meet_link, status)
  values (%L, 'scheduled', now() + interval '1 day', 'https://meet.google.com/abc-defg-hij', 'scheduled')$$, :outra_turma),
  '42501', 'teacher cannot add a class to another school''s turma');
select test.ok(test.rows_changed(format('update public.aulas set status = ''ended'' where id = %L', :outra_aula)) = 0,
               'teacher cannot end another school''s class');
select test.ok(test.rows_changed(format($$insert into public.turmas (school_id, name, teacher_id)
  values ('00000000-0000-4000-8000-000000000001', 'Teens 2 · tarde', %L)$$, :chuck)) = 1,
  'teacher creates a turma in his school');
select test.fails($$insert into public.turmas (school_id, name, teacher_id)
  values ('00000000-0000-4000-8000-00000000000b', 'Intrusa', null)$$,
  '42501', 'teacher cannot create a turma in another school');
select test.fails(format($$update public.turmas set teacher_id = null where id = %L$$, :masters),
  '42501', 'teacher cannot remove himself from his turma');
select test.ok(test.rows_changed(format('delete from public.turmas where id = %L', :masters)) = 0,
               'teacher cannot delete a turma');
select test.fails(format($$insert into public.enrollments values (%L, %L)$$, :ana, :outra_turma),
  '42501', 'teacher cannot enrol students');
reset role;

-- ---------------------------------------------------------------------------
-- Admin of the first school
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-00000000a001", "role": "authenticated"}';
select test.ok(test.count_rows(format('select * from public.aulas where turma_id = %L', :masters)) >= 1, 'admin sees the school''s classes');
select test.ok(test.rows_changed(format('update public.aulas set status = ''ended'' where turma_id = %L and status = ''live''', :masters)) = 1,
               'admin can end a class in the school');
select test.ok(test.count_rows(format('select * from public.aulas where turma_id = %L', :outra_turma)) = 0,
               'admin does not see other schools'' classes');
reset role;

-- ---------------------------------------------------------------------------
-- Teacher of the other school
-- ---------------------------------------------------------------------------

set role authenticated;
set request.jwt.claims = '{"sub": "10000000-0000-4000-8000-00000000b101", "role": "authenticated"}';
select test.ok(test.count_rows(format('select * from public.aulas where turma_id = %L', :masters)) = 0,
               'schools are isolated: no Masters classes for the other school');
select test.ok(test.count_rows('select * from public.people') = 2, 'other teacher sees only his school''s people');
reset role;

-- ---------------------------------------------------------------------------
-- Access-code login
-- ---------------------------------------------------------------------------

insert into auth.users (id) values
  ('20000000-0000-4000-8000-000000000001'), ('20000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000003');

set role anon;
select test.fails($$select * from public.redeem_access_code('WIZ-ALUNO-01')$$, '42501', 'anonymous visitors cannot redeem codes');
reset role;

set role authenticated;
set request.jwt.claims = '';
select test.fails($$select * from public.redeem_access_code('WIZ-ALUNO-01')$$, '28000', 'redeeming needs a signed-in device');

-- A new device (anonymous auth user) redeems Ana's code, typed loosely.
set request.jwt.claims = '{"sub": "20000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select test.ok(test.count_rows('select * from public.aulas') = 0, 'a new device sees nothing before the code');
select test.ok((select name from public.redeem_access_code(' wiz aluno-01 ')) = 'Ana (teste)', 'the right code signs Ana in');
select test.ok(test.count_rows('select * from public.person_logins') = 1, 'the device reads its own login');
select test.ok(test.count_rows(format('select * from public.aulas where turma_id = %L', :masters)) >= 1, 'after the code Ana sees her classes');
select test.ok((select string_agg(name, ', ' order by name) from public.people) = 'Ana (teste), Chuck',
               'a student sees herself and her teacher, nobody else');
select test.fails('select * from private.settings', '42501', 'clients cannot read the pepper');
select test.fails($$select private.hash_access_code('x')$$, '42501', 'clients cannot hash codes');
select test.ok(test.rows_changed('delete from public.person_logins where auth_user_id <> auth.uid()') = 0,
               'a device cannot sign other devices out');
select test.ok(test.rows_changed('delete from public.person_logins') = 1, 'signing out removes the device login');
select test.ok(test.count_rows('select * from public.aulas') = 0, 'after signing out the device sees nothing');

-- Wrong codes, then rate limiting per device.
set request.jwt.claims = '{"sub": "20000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select test.ok(test.count_rows($$select * from public.redeem_access_code('WIZ-ERRADO-1')$$) = 0, 'an unknown code signs nobody in');
select test.count_rows($$select * from public.redeem_access_code('WIZ-ERRADO-2')$$);
select test.count_rows($$select * from public.redeem_access_code('WIZ-ERRADO-3')$$);
select test.count_rows($$select * from public.redeem_access_code('WIZ-ERRADO-4')$$);
select test.count_rows($$select * from public.redeem_access_code('WIZ-ERRADO-5')$$);
select test.fails($$select * from public.redeem_access_code('WIZ-ALUNO-01')$$, 'P0001',
                  'after 5 wrong codes the device must wait, even with the right code');

-- Another device is not blocked, and the teacher code gives teacher access.
set request.jwt.claims = '{"sub": "20000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select test.ok((select role from public.redeem_access_code('WIZ-PROF-01')) = 'teacher', 'the teacher code signs Chuck in');
select test.ok(test.count_rows('select * from public.people') = 4, 'Chuck''s new device sees his school');
reset role;

-- ---------------------------------------------------------------------------
-- Push alerts
-- ---------------------------------------------------------------------------

select test.ok((select count(*) from cron.jobs where jobname = 'wiz-aula-reminders' and schedule = '* * * * *') = 1,
               'the reminder job runs every minute');

set role authenticated;
set request.jwt.claims = '{"sub": "20000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select test.ok(public.vapid_public_key() is null, 'no public key is offered before push is configured');
reset role;

-- Starting a class before push is configured sends nothing.
delete from net.requests;
update public.aulas set status = 'ended' where type = 'lightning' and status = 'live';
insert into public.aulas (turma_id, type, start_at, meet_link, status, ping_at)
values ('00000000-0000-4000-8000-000000000301', 'lightning', now(), 'https://meet.google.com/abc-defg-hij', 'live', now());
select test.ok((select count(*) from net.requests) = 0, 'nothing is sent while push is not configured');

update private.settings set vapid_public_key = 'test-public', vapid_private_key = 'test-private',
                            functions_url = 'https://example.test/functions/v1';

set role authenticated;
select test.ok(public.vapid_public_key() = 'test-public', 'signed-in devices get the VAPID public key');
select test.fails('select * from public.push_config()', '42501', 'clients cannot read the push secrets');
select test.fails('select private.send_due_reminders()', '42501', 'clients cannot trigger reminders');

-- Chuck's device (signed in above) starts, re-sends, renames and ends a lightning class.
select test.ok(test.rows_changed(format($$insert into public.aulas (turma_id, type, start_at, meet_link, status, ping_at)
  values (%L, 'lightning', now(), 'https://meet.google.com/xyz-abcd-efg', 'live', now())$$, :masters)) = 1, 'teacher starts a lightning class');
reset role;
select test.ok((select count(*) from net.requests) = 1, 'starting a lightning class sends one alert request');
select test.ok((select body ->> 'kind' from net.requests order by id desc limit 1) = 'live'
               and (select url from net.requests order by id desc limit 1) = 'https://example.test/functions/v1/send-push',
               'the request goes to the send-push function as a live alert');
select test.ok((select headers ->> 'x-push-secret' from net.requests order by id desc limit 1)
               = (select push_secret from private.settings), 'the request carries the shared secret');

set role authenticated;
select test.rows_changed(format('update public.aulas set ping_at = now() + interval ''1 second'' where turma_id = %L and status = ''live''', :masters));
reset role;
select test.ok((select count(*) from net.requests) = 2, '"Avisar de novo" sends another alert request');

set role authenticated;
select test.rows_changed(format('update public.aulas set title = ''Renomeada'' where turma_id = %L and status = ''live''', :masters));
select test.rows_changed(format('update public.aulas set status = ''ended'' where turma_id = %L and status = ''live''', :masters));
reset role;
select test.ok((select count(*) from net.requests) = 2, 'renaming or ending a class sends nothing');

-- T-10 reminders: once per class, only inside the window.
insert into public.aulas (id, turma_id, type, title, start_at, meet_link, status) values
  ('00000000-0000-4000-8000-00000000c001', :masters, 'scheduled', 'Em 5 minutos', now() + interval '5 minutes', 'https://meet.google.com/abc-defg-hij', 'scheduled'),
  ('00000000-0000-4000-8000-00000000c002', :masters, 'scheduled', 'Em 30 minutos', now() + interval '30 minutes', 'https://meet.google.com/abc-defg-hij', 'scheduled'),
  ('00000000-0000-4000-8000-00000000c003', :masters, 'scheduled', 'Já começou', now() - interval '5 minutes', 'https://meet.google.com/abc-defg-hij', 'scheduled');
select private.send_due_reminders();
select test.ok((select reminder_sent_at is not null from public.aulas where id = '00000000-0000-4000-8000-00000000c001'),
               'a class starting in 5 minutes gets its reminder');
select test.ok((select reminder_sent_at is null from public.aulas where id = '00000000-0000-4000-8000-00000000c002'),
               'a class starting in 30 minutes waits');
select test.ok((select reminder_sent_at is null from public.aulas where id = '00000000-0000-4000-8000-00000000c003'),
               'a class that already started gets no reminder');
select test.ok((select count(*) from net.requests where body ->> 'aula_id' = '00000000-0000-4000-8000-00000000c001' and body ->> 'kind' = 'reminder') = 1,
               'the reminder request is sent');
select private.send_due_reminders();
select test.ok((select count(*) from net.requests where body ->> 'aula_id' = '00000000-0000-4000-8000-00000000c001') = 1,
               'each class is reminded only once');

\echo 'All database tests passed.'
