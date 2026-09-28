"use client";

import { useNow, usePref, writePref } from "@/lib/hooks";
import { PREF } from "@/lib/pref-keys";
import { useData } from "@/lib/store";
import { AulaList } from "./aula-list";
import { LightningForm } from "./lightning-form";
import { ScheduleForm } from "./schedule-form";
import { TurmasBox } from "./turmas-box";

export function TeacherHome() {
  const data = useData();
  const now = useNow();
  const saved = usePref(PREF.profTurma);

  if (!data || now === null || saved === undefined) {
    return <p className="text-muted">Carregando…</p>;
  }

  const turma = data.turmas.find((t) => t.id === saved) ?? data.turmas[0] ?? null;

  return (
    <>
      <h1 className="sr-only">Professor</h1>
      <div className="field desktop:max-w-[32rem]">
        <label htmlFor="profTurma">Turma</label>
        <select
          id="profTurma"
          className="input"
          value={turma?.id ?? ""}
          onChange={(e) => writePref(PREF.profTurma, e.target.value)}
          disabled={!turma}
        >
          {data.turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.nivel}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-2 desktop:items-start desktop:gap-6">
        <div className="flex flex-col gap-4">
          <LightningForm key={`l-${turma?.id}`} turma={turma} />
          <ScheduleForm key={`s-${turma?.id}`} turma={turma} now={now} />
        </div>
        <div className="flex flex-col gap-4">
          <AulaList aulas={data.aulas} turma={turma} now={now} />
          <TurmasBox turmas={data.turmas} />
        </div>
      </div>
    </>
  );
}
