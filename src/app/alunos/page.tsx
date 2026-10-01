import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/admin-home";

export const metadata: Metadata = { title: "Alunos · Wiz Aula" };

export default function AlunosPage() {
  return <AdminPage />;
}
