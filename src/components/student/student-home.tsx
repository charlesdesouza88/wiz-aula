"use client";

import { useState } from "react";
import { studentView, type Turma } from "@/lib/aulas";
import type { Device } from "@/lib/device";
import { formatDay, formatTime } from "@/lib/format";
import { useDevice, useNow, usePref, writePref } from "@/lib/hooks";
import { PREF } from "@/lib/pref-keys";
import { useData, type Data } from "@/lib/store";
import { enableChime } from "@/lib/chime";
import { Hero } from "./hero";
import { LiveAlert } from "./live-alert";
import { TurmaPicker } from "./turma-picker";

export function StudentHome() {
  const data = useData();
  const now = useNow();
  const turmaId = usePref(PREF.turma);
  const device = useDevice();

  if (!data || now === null || turmaId === undefined || !device) {
    return <p className="text-muted">Carregando…</p>;
  }

  const turma = turmaId ? data.turmas.find((t) => t.id === turmaId) : undefined;
  if (!turma) {
    return <TurmaPicker turmas={data.turmas} onPick={(id) => writePref(PREF.turma, id)} />;
  }
  return <StudentMain key={turma.id} data={data} turma={turma} now={now} device={device} />;
}

function StudentMain({
  data,
  turma,
  now,
  device,
}: {
  data: Data;
  turma: Turma;
  now: number;
  device: Device;
}) {
  const [sound, setSound] = useState(false);
  const { live, upcoming } = studentView(data.aulas, turma.id, now);
  const later = live ? upcoming : upcoming.slice(1);

  return (
    <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] desktop:items-start desktop:gap-x-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5 desktop:col-span-2">
        <p className="text-[0.95rem]">
          Turma <b>{turma.name}</b> · {turma.nivel}
        </p>
        <button
          type="button"
          onClick={() => writePref(PREF.turma, null)}
          className="min-h-14 cursor-pointer font-bold text-primary underline underline-offset-[3px]"
        >
          Trocar turma
        </button>
      </div>

      <Hero turma={turma} live={live} next={upcoming[0] ?? null} now={now} device={device} />

      <div className="flex flex-col gap-4">
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <b>Aviso com som</b>
              <p className="text-[0.95rem] text-muted">Toca um sininho quando a aula começar.</p>
            </div>
            <button
              type="button"
              aria-pressed={sound}
              onClick={() => {
                if (!sound) enableChime();
                setSound(!sound);
              }}
              className={`min-h-14 cursor-pointer rounded-[14px] border-2 bg-surface px-4 py-2.5 font-bold ${
                sound ? "border-ok text-ok" : "border-line hover:border-primary"
              }`}
            >
              {sound ? "Ligado" : "Ativar"}
            </button>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Próximas aulas</p>
          <ul className="flex flex-col">
            {later.length ? (
              later.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0"
                >
                  <span className="flex min-w-0 flex-col">
                    <b className="tabular-nums">
                      {formatDay(a.startAt, now)} · {formatTime(a.startAt)}
                    </b>
                    <span className="text-[0.95rem] text-muted">{a.title || "Aula"}</span>
                  </span>
                  <span className="pill bg-surface-2 text-ink">Agendada</span>
                </li>
              ))
            ) : (
              <li className="py-3 text-[0.95rem] text-muted">Nenhuma outra aula marcada.</li>
            )}
          </ul>
        </div>
      </div>

      <LiveAlert turma={turma} live={live} sound={sound} />
    </div>
  );
}
