"use client";

import { useState, type FormEvent } from "react";
import type { Turma } from "@/lib/aulas";
import { MEET_LINK_ERROR, normalizeMeetLink, shortMeetLink } from "@/lib/meet";
import { addTurma } from "@/lib/store";
import { FormMessage, type Message } from "./form-message";

export function TurmasBox({ turmas }: { turmas: Turma[] }) {
  const [name, setName] = useState("");
  const [nivel, setNivel] = useState("");
  const [horario, setHorario] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState<Message>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || !nivel.trim() || !horario.trim())
      return setMessage({ kind: "err", text: "Preencha nome, nível e horário." });
    const raw = link.trim();
    const meetLink = raw ? normalizeMeetLink(raw) : null;
    if (raw && !meetLink) return setMessage({ kind: "err", text: MEET_LINK_ERROR });
    addTurma({ name: n, nivel: nivel.trim(), horario: horario.trim(), teacher: "", meetLink });
    setName("");
    setNivel("");
    setHorario("");
    setLink("");
    setMessage({ kind: "ok", text: `Turma ${n} criada.` });
  }

  return (
    <details className="card group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-display text-[1.25rem] font-extrabold [&::-webkit-details-marker]:hidden">
        Turmas
        <span aria-hidden="true" className="text-[1.6rem] text-muted">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>
      <ul className="flex flex-col">
        {turmas.map((t) => (
          <li key={t.id} className="flex flex-col border-t border-line py-3 first:border-t-0 [overflow-wrap:anywhere]">
            <b>{t.name}</b>
            <span className="text-[0.95rem] text-muted">
              {t.nivel} · {t.horario}
            </span>
            <span className="text-[0.95rem] text-muted">
              {t.meetLink ? shortMeetLink(t.meetLink) : "Sem link fixo"}
            </span>
          </li>
        ))}
      </ul>
      <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
        <h3 className="eyebrow">Nova turma</h3>
        <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
          <div className="field">
            <label htmlFor="tName">Nome</label>
            <input
              id="tName"
              className="input"
              placeholder="Ex.: Teens 3 · tarde"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tNivel">Nível</label>
            <input
              id="tNivel"
              className="input"
              placeholder="Ex.: Teens 3"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="tHorario">Horário</label>
          <input
            id="tHorario"
            className="input"
            placeholder="Ex.: Segunda e quarta, 15:00 - 16:00"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="tLink">Link fixo do Meet (opcional)</label>
          <input
            id="tLink"
            className="input"
            inputMode="url"
            autoComplete="off"
            placeholder="meet.google.com/abc-defg-hij"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <FormMessage message={message} />
        <button className="btn" type="submit">
          Criar turma
        </button>
      </form>
    </details>
  );
}
