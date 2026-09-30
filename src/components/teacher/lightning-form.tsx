"use client";

import { useState, type FormEvent } from "react";
import type { Turma } from "@/lib/aulas";
import { MEET_LINK_ERROR, normalizeMeetLink, shortMeetLink } from "@/lib/meet";
import { startLightning } from "@/lib/data";
import type { Person } from "@/lib/session";
import { BoltIcon } from "@/components/icons";
import { FormMessage, type Message } from "@/components/form-message";

export function LightningForm({ person, turma }: { person: Person; turma: Turma | null }) {
  const [link, setLink] = useState(turma?.meetLink ? shortMeetLink(turma.meetLink) : "");
  const [save, setSave] = useState(!turma?.meetLink);
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!turma) return setMessage({ kind: "err", text: "Crie uma turma primeiro, em Turmas." });
    const meetLink = normalizeMeetLink(link);
    if (!meetLink) return setMessage({ kind: "err", text: MEET_LINK_ERROR });
    setBusy(true);
    try {
      await startLightning(person, turma, meetLink, save);
      setLink(shortMeetLink(meetLink));
      setMessage({ kind: "ok", text: `Pronto! A aula começou e os alunos de ${turma.name} foram avisados.` });
    } catch {
      setMessage({ kind: "err", text: "Não deu para salvar agora. Confira a internet e tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} onChange={() => setMessage(null)} noValidate>
      <div className="flex items-center gap-2.5">
        <BoltIcon className="size-7 flex-none" />
        <h2 className="text-[1.5rem] font-extrabold">Aula relâmpago</h2>
      </div>
      <p className="text-[0.95rem] text-muted">
        Começa agora. Todos os alunos da turma recebem um aviso e entram com um toque.
      </p>
      <div className="field">
        <label htmlFor="flashLink">Link do Google Meet</label>
        <input
          id="flashLink"
          className="input"
          inputMode="url"
          autoComplete="off"
          placeholder="meet.google.com/abc-defg-hij"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <label className="flex min-h-14 cursor-pointer items-center gap-2.5 text-base">
        <input
          type="checkbox"
          className="size-6 flex-none accent-primary"
          checked={save}
          onChange={(e) => setSave(e.target.checked)}
        />
        Guardar como link fixo da turma
      </label>
      <FormMessage message={message} />
      <button className="btn btn-gold" type="submit" disabled={busy}>
        Começar agora e avisar alunos
      </button>
    </form>
  );
}
