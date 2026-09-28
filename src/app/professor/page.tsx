import type { Metadata } from "next";
import { TeacherHome } from "@/components/teacher/teacher-home";

export const metadata: Metadata = { title: "Professor · Wiz Aula" };

export default function ProfessorPage() {
  return <TeacherHome />;
}
