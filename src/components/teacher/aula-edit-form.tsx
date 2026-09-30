"use client";

import { useState, type FormEvent } from "react";
import type { Aula } from "@/lib/aulas";
import { updateAula } from "@/lib/data";
import { MEET_LINK_ERROR, normalizeMeetLink, shortMeetLink } from "@/lib/meet";
import { parseDateTimeInput, toDateTimeInputs } from "@/lib/time";
import { FormMessage, type Message } from "@/components/form-message";

const DURATIONS: [number, string][] = [
  [30, "30 minutos"],
  [45, "45 minutos"],
  [60, "1 hora"],
  [90, "1 hora e 30"],
];

/** Inline editor for a scheduled class in the teacher's list. */
export function AulaEditForm({ aula, onDone }: { aula: Aula; onDone: (saved: boolean) => void }) {
  const initial = toDateTimeInputs(aula.startAt);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(String(aula.durationMin));
  const [title, setTitle] = useState(aula.title);
  const [link, setLink] = useState(shortMeetLink(aula.meetLink));
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);
  const id = (field: string) => `edit-${aula.id}-${field}`;
  const durations = DURATIONS.some(([m]) => m === aula.durationMin)
    ? DURATIONS
    : [...DURATIONS, [aula.durationMin, `${aula.durationMin} minutos`] as [number, string]];

  async function submit(e: FormEvent) {
    e.preventDefault();
    const startAt = parseDateTimeInput(date, time);
    if (startAt === null) return setMessage({ kind: "err", text: "Esse dia ou horário não é válido." });
    if (startAt < Date.now())
      return setMessage({ kind: "err", text: "Esse horário já passou. Escolha um horário futuro." });
    const meetLink = normalizeMeetLink(link);
    if (!meetLink) return setMessage({ kind: "err", text: MEET_LINK_ERROR });
    setBusy(true);
    try {
      await updateAula(aula.id, { startAt, durationMin: Number(duration), title: title.trim(), meetLink });
      onDone(true);
    } catch {
      setMessage({ kind: "err", text: "Não deu para salvar agora. Confira a internet e tente de novo." });
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4"
      onSubmit={submit}
      onChange={() => setMessage(null)}
      noValidate
      aria-label="Editar aula"
    >
      <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
        <div className="field">
          <label htmlFor={id("date")}>Dia</label>
          <input id={id("date")} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={id("time")}>Horário</label>
          <input id={id("time")} type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
        <div className="field">
          <label htmlFor={id("dur")}>Duração</label>
          <select id={id("dur")} className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {durations.map(([m, label]) => (
              <option key={m} value={m}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={id("title")}>Assunto (opcional)</label>
          <input id={id("title")} className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor={id("link")}>Link do Google Meet</label>
        <input
          id={id("link")}
          className="input"
          inputMode="url"
          autoComplete="off"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <FormMessage message={message} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="submit" disabled={busy}>
          Salvar
        </button>
        <button className="btn-ghost" type="button" onClick={() => onDone(false)} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
