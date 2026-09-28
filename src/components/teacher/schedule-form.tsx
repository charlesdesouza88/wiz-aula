"use client";

import { useState, type FormEvent } from "react";
import type { Turma } from "@/lib/aulas";
import { formatDay, formatTime } from "@/lib/format";
import { MEET_LINK_ERROR, normalizeMeetLink, shortMeetLink } from "@/lib/meet";
import { scheduleAulas } from "@/lib/store";
import { parseDateTimeInput, tomorrowInputValue } from "@/lib/time";
import { FormMessage, type Message } from "./form-message";

const REPEAT_WEEKS = 4;

export function ScheduleForm({ turma, now }: { turma: Turma | null; now: number }) {
  const [date, setDate] = useState(() => tomorrowInputValue(now));
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("60");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState(turma?.meetLink ? shortMeetLink(turma.meetLink) : "");
  const [repeat, setRepeat] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!turma) return setMessage({ kind: "err", text: "Crie uma turma primeiro, em Turmas." });
    if (!date || !time) return setMessage({ kind: "err", text: "Escolha o dia e o horário da aula." });
    const startAt = parseDateTimeInput(date, time);
    if (startAt === null) return setMessage({ kind: "err", text: "Esse dia ou horário não é válido." });
    const submittedAt = Date.now();
    if (startAt < submittedAt)
      return setMessage({ kind: "err", text: "Esse horário já passou. Escolha um horário futuro." });
    const meetLink = normalizeMeetLink(link || turma.meetLink || "");
    if (!meetLink) return setMessage({ kind: "err", text: MEET_LINK_ERROR });

    const weeks = repeat ? REPEAT_WEEKS : 1;
    scheduleAulas(turma.id, { startAt, durationMin: Number(duration), title: title.trim(), meetLink, weeks });
    setTitle("");
    setMessage({
      kind: "ok",
      text:
        weeks > 1
          ? `Agendadas ${weeks} aulas, uma por semana.`
          : `Aula agendada para ${formatDay(startAt, submittedAt).toLowerCase()} às ${formatTime(startAt)}.`,
    });
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2 className="text-[1.5rem] font-extrabold">Agendar aula</h2>
      <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
        <div className="field">
          <label htmlFor="schedDate">Dia</label>
          <input id="schedDate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="schedTime">Horário</label>
          <input id="schedTime" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
        <div className="field">
          <label htmlFor="schedDur">Duração</label>
          <select id="schedDur" className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">1 hora</option>
            <option value="90">1 hora e 30</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="schedTitle">Assunto (opcional)</label>
          <input
            id="schedTitle"
            className="input"
            placeholder="Ex.: Lesson 12"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="schedLink">Link do Google Meet</label>
        <input
          id="schedLink"
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
          checked={repeat}
          onChange={(e) => setRepeat(e.target.checked)}
        />
        Repetir toda semana (próximas {REPEAT_WEEKS} semanas)
      </label>
      <FormMessage message={message} />
      <button className="btn" type="submit">
        Agendar
      </button>
    </form>
  );
}
