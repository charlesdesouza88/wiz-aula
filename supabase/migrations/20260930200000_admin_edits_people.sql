-- Admins fix names, move students between turmas, and add a whole list of
-- students at once (pasted from the roster spreadsheet).
--
--   admin_update_person(person, name, turma_ids)  rename; for students also set their turmas
--   admin_add_students(names, turma)              one student per name, each with a new code

create function public.admin_update_person(person uuid, name text, turma_ids uuid[] default null)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
declare
  school uuid := private.admin_school();
  clean text := trim(regexp_replace(name, '[[:space:]]+', ' ', 'g'));
  target_role public.person_role;
begin
  perform private.admin_target(person);
  if clean = '' or length(clean) > 80 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  update public.people p set name = clean where p.id = person returning p.role into target_role;

  -- null leaves the turmas as they are; teachers are linked to turmas as their teacher, not enrolled.
  if turma_ids is not null then
    if target_role <> 'student'
       or exists (select 1 from unnest(turma_ids) as wanted(id)
                   where not exists (select 1 from public.turmas t where t.id = wanted.id and t.school_id = school))
    then
      raise exception 'invalid_turma' using errcode = '22023';
    end if;
    delete from public.enrollments e where e.person_id = person and e.turma_id <> all (turma_ids);
    insert into public.enrollments (person_id, turma_id)
    select distinct person, wanted.id from unnest(turma_ids) as wanted(id)
    on conflict do nothing;
  end if;
end;
$$;

-- All or nothing: a bad name or turma adds nobody. At most 200 names per call.
create function public.admin_add_students(names text[], turma uuid default null)
returns table (person_id uuid, name text, code text)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  school uuid := private.admin_school();
  raw text;
  clean text;
  cleaned text[] := '{}';
  added uuid;
begin
  if turma is not null
     and not exists (select 1 from public.turmas t where t.id = turma and t.school_id = school) then
    raise exception 'invalid_turma' using errcode = '22023';
  end if;

  foreach raw in array coalesce(names, '{}') loop
    clean := trim(regexp_replace(raw, '[[:space:]]+', ' ', 'g'));
    continue when clean = '';
    if length(clean) > 80 then
      raise exception 'invalid_name' using errcode = '22023';
    end if;
    cleaned := cleaned || clean;
  end loop;
  if cardinality(cleaned) = 0 or cardinality(cleaned) > 200 then
    raise exception 'invalid_list' using errcode = '22023';
  end if;

  foreach clean in array cleaned loop
    insert into public.people (school_id, role, name) values (school, 'student', clean) returning id into added;
    if turma is not null then
      insert into public.enrollments (person_id, turma_id) values (added, turma);
    end if;
    person_id := added;
    name := clean;
    code := private.issue_code(added);
    return next;
  end loop;
end;
$$;

revoke all on function public.admin_update_person(uuid, text, uuid[]), public.admin_add_students(text[], uuid)
  from public, anon;
grant execute on function public.admin_update_person(uuid, text, uuid[]), public.admin_add_students(text[], uuid)
  to authenticated;
