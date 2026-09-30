"use client";

import { useState, type FormEvent } from "react";
import { addPerson, adminError } from "@/lib/admin";
import type { Turma } from "@/lib/aulas";
import { FormMessage } from "@/components/form-message";
import type { Issued } from "./code-card";

const ERRORS = {
  invalid: "Confira o nome e a turma.",
  "not-allowed": "Só a secretaria pode adicionar pessoas.",
  offline: "Não deu para salvar agora. Confira a internet e tente de novo.",
} as const;

type NewRole = "student" | "teacher";

/** The screen's main action: add a student (or teacher) and create their code. */
export function AddPersonForm({
  turmas,
  suggestedTurmaId,
  onAdded,
}: {
  turmas: Turma[];
  suggestedTurmaId: string | null;
  onAdded: (issued: Issued) => void;
}) {
  const [role, setRole] = useState<NewRole>("student");
  const [name, setName] = useState("");
  // null until chosen: follows the list filter, else the first turma. "" is "Sem turma".
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosenTurma = turmaId ?? suggestedTurmaId ?? turmas[0]?.id ?? "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return setError("Escreva o nome.");
    const turma = role === "student" ? (turmas.find((t) => t.id === chosenTurma) ?? null) : null;
    setBusy(true);
    try {
      const { id, code } = await addPerson(clean, role, turma?.id ?? null);
      setName("");
      onAdded({
        personId: id,
        name: clean,
        detail: role === "teacher" ? "Professor" : turma ? `Aluno · Turma ${turma.name}` : "Aluno",
        code,
      });
    } catch (err) {
      setError(ERRORS[adminError(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} onChange={() => setError(null)} noValidate>
      <h2 className="text-[1.5rem] font-extrabold">Adicionar pessoa</h2>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-base font-bold">Quem é</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["student", "teacher"] as const).map((r) => (
            <label
              key={r}
              className="flex min-h-14 cursor-pointer items-center gap-2.5 rounded-[14px] border-2 border-line px-3.5 has-checked:border-primary has-checked:bg-surface-2"
            >
              <input
                type="radio"
                name="newRole"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="size-6 flex-none accent-primary"
              />
              {r === "student" ? "Aluno" : "Professor"}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="newName">Nome</label>
        <input
          id="newName"
          className="input"
          autoComplete="off"
          maxLength={80}
          placeholder={role === "student" ? "Ex.: Maria Souza" : "Ex.: Profa. Lia"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {role === "student" ? (
        <div className="field">
          <label htmlFor="newTurma">Turma</label>
          <select id="newTurma" className="input" value={chosenTurma} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.nivel}
              </option>
            ))}
            <option value="">Sem turma por enquanto</option>
          </select>
        </div>
      ) : (
        <p className="text-[0.95rem] text-muted">O professor cria as turmas dele na tela de aulas, depois de entrar.</p>
      )}
      <FormMessage message={error ? { kind: "err", text: error } : null} />
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Criando…" : "Adicionar e criar código"}
      </button>
    </form>
  );
}
