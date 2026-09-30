"use client";

import { useState, type FormEvent } from "react";
import type { Turma } from "@/lib/aulas";
import { addTurma, deleteTurma, updateTurma } from "@/lib/data";
import { MEET_LINK_ERROR, normalizeMeetLink, shortMeetLink } from "@/lib/meet";
import type { Person } from "@/lib/session";
import { ConfirmButton } from "@/components/confirm-button";
import { FormMessage, type Message } from "@/components/form-message";

const SAVE_ERROR = "Não deu para salvar agora. Confira a internet e tente de novo.";

type TurmaValues = { name: string; nivel: string; horario: string; meetLink: string | null };

export function TurmasBox({ person, turmas }: { person: Person; turmas: Turma[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  return (
    <details className="card group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between font-display text-[1.25rem] font-extrabold [&::-webkit-details-marker]:hidden">
        Turmas
        <span aria-hidden="true" className="text-[1.6rem] text-muted">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>
      <FormMessage message={message} />
      <ul className="flex flex-col">
        {turmas.map((t) => (
          <li key={t.id} className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0 [overflow-wrap:anywhere]">
            {editingId === t.id ? (
              <TurmaForm
                idPrefix={`t-${t.id}`}
                initial={{ name: t.name, nivel: t.nivel, horario: t.horario, meetLink: t.meetLink }}
                submitLabel="Salvar"
                onSubmit={async (values) => {
                  await updateTurma(t.id, values);
                  setEditingId(null);
                  setMessage({ kind: "ok", text: `Turma ${values.name} atualizada.` });
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <span className="flex flex-col">
                  <b>{t.name}</b>
                  <span className="text-[0.95rem] text-muted">
                    {t.nivel} · {t.horario}
                  </span>
                  <span className="text-[0.95rem] text-muted">
                    {t.meetLink ? shortMeetLink(t.meetLink) : "Sem link fixo"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setMessage(null);
                      setEditingId(t.id);
                    }}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    label="Excluir"
                    confirmLabel="Apagar a turma e as aulas?"
                    onConfirm={() => {
                      setMessage(null);
                      deleteTurma(t.id).then(
                        () => setMessage({ kind: "ok", text: `Turma ${t.name} excluída.` }),
                        () => setMessage({ kind: "err", text: "Não deu para excluir agora. Confira a internet e tente de novo." }),
                      );
                    }}
                  />
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      <h3 className="eyebrow">Nova turma</h3>
      <TurmaForm
        idPrefix="t-new"
        initial={{ name: "", nivel: "", horario: "", meetLink: null }}
        submitLabel="Criar turma"
        resetAfterSubmit
        onSubmit={async (values) => {
          await addTurma(person, values);
          setMessage({ kind: "ok", text: `Turma ${values.name} criada.` });
        }}
      />
    </details>
  );
}

function TurmaForm({
  idPrefix,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  resetAfterSubmit = false,
}: {
  idPrefix: string;
  initial: TurmaValues;
  submitLabel: string;
  onSubmit: (values: TurmaValues) => Promise<void>;
  onCancel?: () => void;
  resetAfterSubmit?: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [nivel, setNivel] = useState(initial.nivel);
  const [horario, setHorario] = useState(initial.horario);
  const [link, setLink] = useState(initial.meetLink ? shortMeetLink(initial.meetLink) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = (field: string) => `${idPrefix}-${field}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const values = { name: name.trim(), nivel: nivel.trim(), horario: horario.trim() };
    if (!values.name || !values.nivel || !values.horario) return setError("Preencha nome, nível e horário.");
    const raw = link.trim();
    const meetLink = raw ? normalizeMeetLink(raw) : null;
    if (raw && !meetLink) return setError(MEET_LINK_ERROR);
    setBusy(true);
    try {
      await onSubmit({ ...values, meetLink });
      if (resetAfterSubmit) {
        setName("");
        setNivel("");
        setHorario("");
        setLink("");
      }
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={`flex flex-col gap-3 ${onCancel ? "rounded-2xl bg-surface-2 p-4" : ""}`}
      onSubmit={submit}
      onChange={() => setError(null)}
      noValidate
    >
      <div className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2">
        <div className="field">
          <label htmlFor={id("name")}>Nome</label>
          <input
            id={id("name")}
            className="input"
            placeholder="Ex.: Teens 3 · tarde"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={id("nivel")}>Nível</label>
          <input
            id={id("nivel")}
            className="input"
            placeholder="Ex.: Teens 3"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={id("horario")}>Horário</label>
        <input
          id={id("horario")}
          className="input"
          placeholder="Ex.: Segunda e quarta, 15:00 - 16:00"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={id("link")}>Link fixo do Meet (opcional)</label>
        <input
          id={id("link")}
          className="input"
          inputMode="url"
          autoComplete="off"
          placeholder="meet.google.com/abc-defg-hij"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <FormMessage message={error ? { kind: "err", text: error } : null} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="submit" disabled={busy}>
          {submitLabel}
        </button>
        {onCancel && (
          <button className="btn-ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
