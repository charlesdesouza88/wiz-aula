"use client";

import { resetData } from "@/lib/data";
import { signOut, useSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { LoginForm } from "./login-form";
import { StudentHome } from "./student/student-home";
import { TeacherHome } from "./teacher/teacher-home";

/** One address for everyone: the access code decides whether this is the student or the teacher screen. */
export function Home() {
  const session = useSession();

  if (!isSupabaseConfigured()) {
    return <p className="msg-err">O app ainda não foi configurado. Avise a escola.</p>;
  }
  if (session.status === "loading") return <p className="text-muted">Carregando…</p>;
  if (session.status === "signed-out") return <LoginForm />;

  const { person } = session;
  return (
    <>
      {person.role === "student" ? <StudentHome person={person} /> : <TeacherHome person={person} />}
      <p className="text-center text-[0.95rem] text-muted">
        Não é {person.name}?{" "}
        <button
          type="button"
          className="min-h-14 cursor-pointer px-1 font-bold text-primary underline underline-offset-[3px]"
          onClick={async () => {
            await signOut();
            resetData();
          }}
        >
          Sair
        </button>
      </p>
    </>
  );
}
