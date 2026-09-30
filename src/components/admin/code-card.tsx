"use client";

import { useEffect, useRef, useState } from "react";
import { codeMessage } from "@/lib/roster";

export type Issued = { personId: string; name: string; detail: string; code: string };

/** A code just created: shown once, to print, send or write down. */
export function CodeCard({ issued, onDone }: { issued: Issued; onDone: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;
  const message = codeMessage(issued.name, issued.code, appUrl);
  const canShare = typeof navigator.share === "function";

  // Bring the new code into view, e.g. after "Novo código" far down the list.
  useEffect(() => ref.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="codeTitle"
      className="card print-card border-gold bg-gold-soft focus-visible:outline-none"
    >
      <h2 id="codeTitle" className="eyebrow">
        Código de acesso
      </h2>
      <div>
        <p className="font-display text-[1.35rem] leading-tight font-extrabold">{issued.name}</p>
        <p className="text-[0.95rem] text-muted">{issued.detail}</p>
      </div>
      <p className="font-display text-[2.1rem] leading-tight font-extrabold tracking-[0.06em] select-all">
        {issued.code}
      </p>
      <p className="text-[0.95rem]">
        Para entrar: abra <b>{new URL(appUrl).host}</b>, digite o código e toque em <b>Entrar</b>.
      </p>
      <p className="no-print text-[0.95rem] text-muted">
        Imprima, envie ou anote agora. Por segurança, este código não aparece de novo.
      </p>
      <div className="no-print flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => window.print()}>
          Imprimir
        </button>
        {canShare ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void navigator.share({ title: "Código do Wiz Aula", text: message }).catch(() => {})}
          >
            Enviar
          </button>
        ) : (
          <button type="button" className="btn-ghost" onClick={copy}>
            {copied ? "Mensagem copiada ✓" : "Copiar mensagem"}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onDone}>
          Pronto
        </button>
      </div>
    </section>
  );
}
