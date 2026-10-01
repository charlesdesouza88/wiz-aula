"use client";

import { useEffect, useRef, useState } from "react";

export type Batch = { turma: string | null; people: { id: string; name: string; code: string }[] };

/** Codes for a whole list, shown once: printed as cards to cut out, or copied as a list. */
export function CodeSheet({ batch, onDone }: { batch: Batch; onDone: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const host = window.location.host;
  const n = batch.people.length;
  const added = n === 1 ? "1 aluno adicionado" : `${n} alunos adicionados`;
  const detail = batch.turma ? `Aluno · Turma ${batch.turma}` : "Aluno · Sem turma";

  useEffect(() => ref.current?.focus(), []);

  async function copy() {
    const list = batch.people.map((p) => `${p.name}: ${p.code}`).join("\n");
    try {
      await navigator.clipboard.writeText(`Códigos do Wiz Aula (${window.location.origin})\n${list}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="sheetTitle"
      className="card print-card border-gold bg-gold-soft focus-visible:outline-none"
    >
      <div className="no-print">
        <h2 id="sheetTitle" className="eyebrow">
          Códigos de acesso
        </h2>
        <p className="font-bold">
          {added}
          {batch.turma ? ` à Turma ${batch.turma}` : ", sem turma"}
        </p>
        <p className="text-[0.95rem] text-muted">
          Imprima e recorte, ou copie a lista agora. Por segurança, estes códigos não aparecem de novo.
        </p>
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => window.print()}>
          Imprimir
        </button>
        <button type="button" className="btn-ghost" onClick={copy}>
          {copied ? "Lista copiada ✓" : "Copiar lista"}
        </button>
        <button type="button" className="btn-ghost" onClick={onDone}>
          Pronto
        </button>
      </div>
      <ul className="code-sheet grid grid-cols-1 gap-2 tablet:grid-cols-2">
        {batch.people.map((p) => (
          <li key={p.id} className="flex flex-col rounded-[14px] border-2 border-dashed border-line bg-surface p-3">
            <b className="[overflow-wrap:anywhere]">{p.name}</b>
            <span className="text-[0.9rem] text-muted">{detail}</span>
            <span className="font-display text-[1.5rem] leading-tight font-bold tracking-[0.06em]">{p.code}</span>
            <span className="text-[0.85rem]">
              Abra <b>{host}</b>, digite o código e toque em <b>Entrar</b>.
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
