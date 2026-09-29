"use client";

import { useNow, usePref, writePref } from "@/lib/hooks";
import { PREF } from "@/lib/pref-keys";
import { useData } from "@/lib/data";
import type { Person } from "@/lib/session";
import { AulaList } from "./aula-list";
import { LightningForm } from "./lightning-form";
import { ScheduleForm } from "./schedule-form";
import { TurmasBox } from "./turmas-box";

export function TeacherHome({ person }: { person: Person }) {
  const { data, error } = useData(person);
  const now = useNow();
  const saved = usePref(PREF.profTurma);

  if (!data || now === null || saved === undefined) {
    return (
      <p className={error ? "msg-err" : "text-muted"}>
        {error ? "Não deu para carregar as turmas. Confira a internet." : "Carregando…"}
      </p>
    );
  }

  // Teachers manage their own turmas; a school admin manages all of them.
  const turmas = person.role === "admin" ? data.turmas : data.turmas.filter((t) => t.teacherId === person.id);
  const turma = turmas.find((t) => t.id === saved) ?? turmas[0] ?? null;

  return (
    <>
      <h1 className="sr-only">Minhas turmas</h1>
      <div className="field desktop:max-w-[32rem]">
        <label htmlFor="profTurma">Turma</label>
        <select
          id="profTurma"
          className="input"
          value={turma?.id ?? ""}
          onChange={(e) => writePref(PREF.profTurma, e.target.value)}
          disabled={!turma}
        >
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.nivel}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-2 desktop:items-start desktop:gap-6">
        <div className="flex flex-col gap-4">
          <LightningForm key={`l-${turma?.id}`} person={person} turma={turma} />
          <ScheduleForm key={`s-${turma?.id}`} person={person} turma={turma} now={now} />
        </div>
        <div className="flex flex-col gap-4">
          <AulaList aulas={data.aulas} turma={turma} now={now} />
          <TurmasBox person={person} turmas={turmas} />
        </div>
      </div>
    </>
  );
}
