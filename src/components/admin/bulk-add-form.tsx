"use client";

import { useState, type FormEvent } from "react";
import { addStudents, adminError } from "@/lib/admin";
import type { Turma } from "@/lib/aulas";
import { MAX_NAMES, parseNames } from "@/lib/roster";
import { FormMessage } from "@/components/form-message";
import type { Batch } from "./code-sheet";

const ERRORS = {
  invalid: "Confira os nomes (até 80 letras cada) e a turma.",
  "not-allowed": "Só a secretaria pode adicionar alunos.",
  offline: "Não deu para salvar agora. Confira a internet e tente de novo. Ninguém foi adicionado.",
} as const;

/** Paste a column of names from the roster spreadsheet; everyone gets a code at once. */
export function BulkAddForm({
  turmas,
  suggestedTurmaId,
  onAdded,
}: {
  turmas: Turma[];
  suggestedTurmaId: string | null;
  onAdded: (batch: Batch) => void;
}) {
  const [text, setText] = useState("");
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const chosenTurma = turmaId ?? suggestedTurmaId ?? turmas[0]?.id ?? "";
  const names = parseNames(text);
  const count = names.length === 1 ? "1 aluno" : `${names.length} alunos`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (names.length === 0) return setError("Cole ou escreva pelo menos um nome.");
    if (names.length > MAX_NAMES) return setError(`São ${names.length} nomes. Adicione no máximo ${MAX_NAMES} de cada vez.`);
    const turma = turmas.find((t) => t.id === chosenTurma) ?? null;
    setBusy(true);
    try {
      const people = await addStudents(names, turma?.id ?? null);
      setText("");
      onAdded({ turma: turma?.name ?? null, people });
    } catch (err) {
      setError(ERRORS[adminError(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="card group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-display text-[1.25rem] font-extrabold [&::-webkit-details-marker]:hidden">
        Adicionar vários alunos
        <span aria-hidden="true" className="text-[1.6rem] text-muted">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>
      <form className="flex flex-col gap-3.5" onSubmit={submit} onChange={() => setError(null)} noValidate>
        <div className="field">
          <label htmlFor="bulkNames">Nomes, um por linha</label>
          <p id="bulkHint" className="text-[0.95rem] text-muted">
            Copie a coluna de nomes da planilha e cole aqui.
          </p>
          <textarea
            id="bulkNames"
            aria-describedby="bulkHint"
            className="input min-h-40 resize-y"
            autoComplete="off"
            spellCheck={false}
            placeholder={"Maria Souza\nJoão Lima"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="bulkTurma">Turma</label>
          <select id="bulkTurma" className="input" value={chosenTurma} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.nivel}
              </option>
            ))}
            <option value="">Sem turma por enquanto</option>
          </select>
        </div>
        <FormMessage message={error ? { kind: "err", text: error } : null} />
        <button className="btn" type="submit" disabled={busy || names.length === 0}>
          {busy ? "Criando…" : names.length ? `Adicionar ${count} e criar códigos` : "Adicionar e criar códigos"}
        </button>
      </form>
    </details>
  );
}
