"use client";

import { useEffect, useState } from "react";
import { isLive, isOver, teacherList, type Aula, type Turma } from "@/lib/aulas";
import { formatDay, formatTime } from "@/lib/format";
import { shortMeetLink } from "@/lib/meet";
import { deleteAula, endAula, pingAula } from "@/lib/store";

export function AulaList({ aulas, turma, now }: { aulas: Aula[]; turma: Turma | null; now: number }) {
  const list = turma ? teacherList(aulas, turma.id, now) : [];
  return (
    <div className="card">
      <h2 className="eyebrow">Aulas desta turma</h2>
      <ul className="flex flex-col">
        {list.length ? (
          list.map((a) => <AulaRow key={a.id} aula={a} now={now} />)
        ) : (
          <li className="py-3 text-[0.95rem] text-muted">
            Nenhuma aula para esta turma. Agende uma ou comece uma aula relâmpago.
          </li>
        )}
      </ul>
    </div>
  );
}

function StatusPill({ aula, live, over }: { aula: Aula; live: boolean; over: boolean }) {
  if (live) return <span className="pill bg-live text-white">Ao vivo</span>;
  if (over) return <span className="pill border border-line text-muted">Encerrada</span>;
  if (aula.type === "lightning") return <span className="pill bg-gold text-on-gold">Relâmpago</span>;
  return <span className="pill bg-surface-2 text-ink">Agendada</span>;
}

function AulaRow({ aula, now }: { aula: Aula; now: number }) {
  const live = isLive(aula, now);
  const over = isOver(aula, now);
  return (
    <li className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0">
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
          <b className="tabular-nums">
            {formatDay(aula.startAt, now)} · {formatTime(aula.startAt)}
          </b>
          <span className="text-[0.95rem] text-muted">
            {aula.type === "lightning" ? "Aula relâmpago" : aula.title || "Aula"} · {shortMeetLink(aula.meetLink)}
          </span>
        </span>
        <StatusPill aula={aula} live={live} over={over} />
      </span>
      {live ? (
        <span className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => pingAula(aula.id)}>
            Avisar de novo
          </button>
          <button type="button" className="btn-ghost" onClick={() => endAula(aula.id)}>
            Encerrar
          </button>
        </span>
      ) : (
        !over && (
          <span className="flex flex-wrap gap-2">
            <DeleteButton id={aula.id} />
          </span>
        )
      )}
    </li>
  );
}

/** Two taps to delete: the first asks for confirmation for 4 seconds. */
function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => (confirming ? deleteAula(id) : setConfirming(true))}
    >
      {confirming ? "Toque para confirmar" : "Excluir"}
    </button>
  );
}
