-- Open screens also hear about enrolment changes: a student added to (or
-- removed from) a turma sees it without reopening the app. Row-level security
-- still decides who receives each change (a student, only their own rows).

alter publication supabase_realtime add table public.enrollments;
