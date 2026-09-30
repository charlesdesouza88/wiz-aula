"use client";

import { useState, type FormEvent } from "react";
import { adminError, updatePerson } from "@/lib/admin";
import type { Turma } from "@/lib/aulas";
import type { RosterEntry } from "@/lib/roster";
import { FormMessage } from "@/components/form-message";

const ERRORS = {
  invalid: "Confira o nome.",
  "not-allowed": "Não é possível mudar esta pessoa.",
  offline: "Não deu para salvar agora. Confira a internet e tente de novo.",
} as const;

/** Fix a name; for a student, also choose their turmas. */
export function EditPersonForm({
  entry,
  turmas,
  onSaved,
  onCancel,
}: {
  entry: RosterEntry;
  turmas: Turma[];
  onSaved: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entry.name);
  const [chosen, setChosen] = useState<string[]>(entry.turmaIds);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const student = entry.role === "student";
  const id = (field: string) => `edit-${entry.id}-${field}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return setError("Escreva o nome.");
    setBusy(true);
    try {
      await updatePerson(entry.id, clean, student ? chosen : null);
      onSaved(clean);
    } catch (err) {
      setError(ERRORS[adminError(err)]);
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4"
      onSubmit={submit}
      onChange={() => setError(null)}
      noValidate
    >
      <div className="field">
        <label htmlFor={id("name")}>Nome</label>
        <input
          id={id("name")}
          className="input"
          autoComplete="off"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {student && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-base font-bold">Turmas</legend>
          {turmas.map((t) => (
            <label key={t.id} className="flex min-h-14 cursor-pointer items-center gap-2.5 text-base">
              <input
                type="checkbox"
                className="size-6 flex-none accent-primary"
                checked={chosen.includes(t.id)}
                onChange={(e) =>
                  setChosen((c) => (e.target.checked ? [...c, t.id] : c.filter((x) => x !== t.id)))
                }
              />
              {t.name} · {t.nivel}
            </label>
          ))}
          {chosen.length === 0 && <p className="text-[0.95rem] text-muted">Sem turma: não vê nenhuma aula.</p>}
        </fieldset>
      )}
      <FormMessage message={error ? { kind: "err", text: error } : null} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="submit" disabled={busy}>
          Salvar
        </button>
        <button className="btn-ghost" type="button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
