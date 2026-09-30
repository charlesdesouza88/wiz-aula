"use client";

import { useState } from "react";
import { adminError, newCode, removePerson } from "@/lib/admin";
import type { Turma } from "@/lib/aulas";
import { filterRoster, roleLabel, statusLabel, type RosterEntry, type RosterFilter } from "@/lib/roster";
import { ConfirmButton } from "@/components/confirm-button";
import { FormMessage, type Message } from "@/components/form-message";
import type { Issued } from "./code-card";
import { EditPersonForm } from "./edit-person-form";

const OFFLINE = "Não deu agora. Confira a internet e tente de novo.";

/** "Aluno · Turma Masters", "Professor · Turma Masters, Turma Teens 3", "Secretaria". */
export function personDetail(e: RosterEntry, turmas: Turma[]): string {
  const names =
    e.role === "student"
      ? turmas.filter((t) => e.turmaIds.includes(t.id))
      : e.role === "teacher"
        ? turmas.filter((t) => t.teacherId === e.id)
        : [];
  if (e.role === "student" && names.length === 0) return "Aluno · Sem turma";
  return [roleLabel(e.role), names.map((t) => `Turma ${t.name}`).join(", ")].filter(Boolean).join(" · ");
}

export function RosterList({
  roster,
  loadFailed,
  turmas,
  filter,
  onFilter,
  onIssued,
  onRemoved,
  onChanged,
}: {
  roster: RosterEntry[] | null;
  loadFailed: boolean;
  turmas: Turma[];
  filter: RosterFilter;
  onFilter: (f: RosterFilter) => void;
  onIssued: (issued: Issued) => void;
  onRemoved: (personId: string) => void;
  onChanged: () => void;
}) {
  const [message, setMessage] = useState<Message>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const shown = roster ? filterRoster(roster, filter) : [];

  async function giveCode(e: RosterEntry) {
    setMessage(null);
    try {
      const code = await newCode(e.id);
      onIssued({
        personId: e.id,
        name: e.name,
        detail: personDetail(e, turmas),
        code,
      });
    } catch (err) {
      setMessage({
        kind: "err",
        text: adminError(err) === "offline" ? OFFLINE : "Não é possível mudar o código desta pessoa.",
      });
    }
    onChanged();
  }

  async function remove(e: RosterEntry) {
    setMessage(null);
    try {
      await removePerson(e.id);
      onRemoved(e.id);
      setMessage({ kind: "ok", text: `Removemos ${e.name}.` });
    } catch (err) {
      setMessage({
        kind: "err",
        text: adminError(err) === "offline" ? OFFLINE : "Não é possível remover esta pessoa.",
      });
    }
    onChanged();
  }

  return (
    <section className="card" aria-labelledby="rosterTitle">
      <h2 id="rosterTitle" className="text-[1.5rem] font-extrabold">
        Pessoas da escola
      </h2>
      <div className="field">
        <label htmlFor="rosterFilter">Mostrar</label>
        <select id="rosterFilter" className="input" value={filter} onChange={(e) => onFilter(e.target.value)}>
          <option value="all">Todos</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              Turma {t.name}
            </option>
          ))}
          <option value="no-turma">Alunos sem turma</option>
          <option value="teachers">Professores e secretaria</option>
        </select>
      </div>
      <p className="text-[0.95rem] text-muted">
        <b>Novo código</b> serve para quem perdeu o código: o antigo para de funcionar e a pessoa entra de novo em todos
        os aparelhos.
      </p>
      <FormMessage message={message} />
      {!roster ? (
        <p className={loadFailed ? "msg-err" : "text-muted"}>
          {loadFailed ? "Não deu para carregar a lista. Confira a internet." : "Carregando…"}
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted">Ninguém aqui ainda.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-2.5 border-t border-line py-3 first:border-t-0 [overflow-wrap:anywhere]"
            >
              {editingId === e.id ? (
                <EditPersonForm
                  entry={e}
                  turmas={turmas}
                  onSaved={(name) => {
                    setEditingId(null);
                    setMessage({ kind: "ok", text: `${name}: dados salvos.` });
                    onChanged();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <span className="flex flex-col">
                    <b>{e.name}</b>
                    <span className="text-[0.95rem] text-muted">{personDetail(e, turmas)}</span>
                    <span className={`text-[0.95rem] ${e.hasCode ? "text-muted" : "font-bold text-err-ink"}`}>
                      {statusLabel(e)}
                    </span>
                  </span>
                  {e.role !== "admin" && (
                    <span className="flex flex-wrap gap-2">
                      {e.hasCode ? (
                        <ConfirmButton
                          label="Novo código"
                          confirmLabel="Toque de novo para trocar"
                          onConfirm={() => void giveCode(e)}
                        />
                      ) : (
                        <button type="button" className="btn-ghost" onClick={() => void giveCode(e)}>
                          Criar código
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setMessage(null);
                          setEditingId(e.id);
                        }}
                      >
                        Editar
                      </button>
                      <ConfirmButton
                        label="Remover"
                        confirmLabel="Toque de novo para remover"
                        onConfirm={() => void remove(e)}
                      />
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
