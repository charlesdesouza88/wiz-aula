-- Local development seed. Never run against production.
--
-- Access codes (dev only). Hashes use the database's own random pepper
-- (private.settings), so the same codes work in every dev database.
--   Teacher Chuck:    WIZ-PROF-01
--   Student Ana:      WIZ-ALUNO-01
--   Student Bruno:    WIZ-ALUNO-02
--   Admin Secretaria: WIZ-ADMIN-01

insert into public.schools (id, name, city) values
  ('00000000-0000-4000-8000-000000000001', 'Mister Wiz · Escola de Líderes', null);

create temporary table seed_people (id uuid, role public.person_role, name text, code text);
insert into seed_people values
  ('00000000-0000-4000-8000-000000000101', 'teacher', 'Chuck', 'WIZPROF01'),
  ('00000000-0000-4000-8000-000000000201', 'student', 'Ana (teste)', 'WIZALUNO01'),
  ('00000000-0000-4000-8000-000000000202', 'student', 'Bruno (teste)', 'WIZALUNO02'),
  ('00000000-0000-4000-8000-000000000901', 'admin', 'Secretaria', 'WIZADMIN01');

insert into public.people (id, school_id, role, name)
select id, '00000000-0000-4000-8000-000000000001', role, name from seed_people;

insert into public.access_codes (person_id, code_hash)
select p.id, private.hash_access_code(p.code) from seed_people p;

insert into public.turmas (id, school_id, name, nivel, horario, teacher_id, meet_link) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001',
   'Masters', 'Adults Book 4', 'Terça e quinta, 19:00 - 20:00',
   '00000000-0000-4000-8000-000000000101', 'https://meet.google.com/abc-defg-hij');

insert into public.enrollments (person_id, turma_id) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000301');

-- Next Tuesday or Thursday class at 19:00 São Paulo time that has not ended yet.
insert into public.aulas (turma_id, type, title, start_at, duration_min, meet_link, status, created_by)
select '00000000-0000-4000-8000-000000000301', 'scheduled', 'Lesson 12', s.start_at, 60,
       'https://meet.google.com/abc-defg-hij', 'scheduled', '00000000-0000-4000-8000-000000000101'
  from (
    select (d::date + time '19:00') at time zone 'America/Sao_Paulo' as start_at
      from generate_series((now() at time zone 'America/Sao_Paulo')::date,
                           (now() at time zone 'America/Sao_Paulo')::date + 7, interval '1 day') as d
     where extract(isodow from d) in (2, 4)
  ) s
 where s.start_at + interval '60 minutes' > now()
 order by s.start_at
 limit 1;

drop table seed_people;
