"use client";

import { useState } from "react";
import { isLive, isOver, teacherList, type Aula, type Turma } from "@/lib/aulas";
import { formatDay, formatTime } from "@/lib/format";
import { shortMeetLink } from "@/lib/meet";
import { deleteAula, endAula, pingAula } from "@/lib/data";
import { ConfirmButton } from "@/components/confirm-button";
import { FormMessage, type Message } from "@/components/form-message";
import { AulaEditForm } from "./aula-edit-form";

type Act = (action: () => Promise<void>) => void;

export function AulaList({ aulas, turma, now }: { aulas: Aula[]; turma: Turma | null; now: number }) {
  const [message, setMessage] = useState<Message>(null);
  const list = turma ? teacherList(aulas, turma.id, now) : [];
  const act: Act = (action) => {
    setMessage(null);
    action().catch(() => setMessage({ kind: "err", text: "Não deu para salvar agora. Confira a internet e tente de novo." }));
  };
  const onEdited = (saved: boolean) => saved && setMessage({ kind: "ok", text: "Aula atualizada." });
  return (
    <div className="card">
      <h2 className="eyebrow">Aulas desta turma</h2>
      <FormMessage message={message} />
      <ul className="flex flex-col">
        {list.length ? (
          list.map((a) => <AulaRow key={a.id} aula={a} now={now} act={act} onEdited={onEdited} />)
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

function AulaRow({
  aula,
  now,
  act,
  onEdited,
}: {
  aula: Aula;
  now: number;
  act: Act;
  onEdited: (saved: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const live = isLive(aula, now);
  const over = isOver(aula, now);
  // Only scheduled classes that have not opened yet can be edited; a live one is ended instead.
  const editable = aula.type === "scheduled" && !live && !over;
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
          <button type="button" className="btn-ghost" onClick={() => act(() => pingAula(aula.id))}>
            Avisar de novo
          </button>
          <button type="button" className="btn-ghost" onClick={() => act(() => endAula(aula.id))}>
            Encerrar
          </button>
        </span>
      ) : editing ? (
        <AulaEditForm
          aula={aula}
          onDone={(saved) => {
            setEditing(false);
            onEdited(saved);
          }}
        />
      ) : (
        !over && (
          <span className="flex flex-wrap gap-2">
            {editable && (
              <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
                Editar
              </button>
            )}
            <ConfirmButton label="Excluir" onConfirm={() => act(() => deleteAula(aula.id))} />
          </span>
        )
      )}
    </li>
  );
}
