-- Teachers manage their own turmas and classes from the app.
--
-- * A teacher may delete a turma they teach (before, only a school admin could).
--   Its classes, enrolments and attendance go with it (on delete cascade);
--   the students themselves stay in the school.
-- * Moving a scheduled class to another time re-arms its T-10 reminder.

create policy "teacher deletes own turma" on public.turmas
  for delete to authenticated
  using (teacher_id = (select private.current_person_id()));

create function private.rearm_reminder() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.start_at is distinct from old.start_at then
    new.reminder_sent_at := null;
  end if;
  return new;
end;
$$;

revoke all on function private.rearm_reminder() from public, authenticated;

create trigger aulas_rearm_reminder
  before update of start_at on public.aulas
  for each row execute function private.rearm_reminder();
