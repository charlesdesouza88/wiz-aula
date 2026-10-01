"use client";

import { useState } from "react";
import { studentView } from "@/lib/aulas";
import { enableChime } from "@/lib/chime";
import { recordJoin, useData } from "@/lib/data";
import { formatDay, formatTime } from "@/lib/format";
import { useDevice, useNow } from "@/lib/hooks";
import type { Person } from "@/lib/session";
import { InstallCard } from "@/components/install-card";
import { AlertsCard } from "./alerts-card";
import { Hero } from "./hero";
import { LiveAlert } from "./live-alert";

export function StudentHome({ person }: { person: Person }) {
  const { data, error } = useData(person);
  const now = useNow();
  const device = useDevice();
  const [sound, setSound] = useState(false);

  if (!data || now === null || !device) {
    return <p className={error ? "msg-err" : "text-muted"}>{error ? "Não deu para carregar as aulas. Confira a internet." : "Carregando…"}</p>;
  }
  if (!data.turmas.length) {
    return (
      <div className="card">
        <h1 className="text-[1.5rem] font-bold">Olá, {person.name}!</h1>
        <p className="text-muted">Você ainda não está em nenhuma turma. Fale com a escola.</p>
      </div>
    );
  }

  const turmaById = new Map(data.turmas.map((t) => [t.id, t]));
  const { live, upcoming } = studentView(data.aulas, now);
  const later = live ? upcoming : upcoming.slice(1);
  const heroTurma = turmaById.get((live ?? upcoming[0])?.turmaId ?? "") ?? data.turmas[0];
  const several = data.turmas.length > 1;

  return (
    <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] desktop:items-start desktop:gap-x-6">
      <p className="text-[0.95rem] desktop:col-span-2">
        Olá, <b>{person.name}</b> ·{" "}
        {several ? (
          <>Turmas {data.turmas.map((t) => t.name).join(", ")}</>
        ) : (
          <>
            Turma <b>{data.turmas[0].name}</b> · {data.turmas[0].nivel}
          </>
        )}
      </p>

      <Hero
        turma={heroTurma}
        showTurma={several}
        live={live}
        next={upcoming[0] ?? null}
        now={now}
        device={device}
        onJoin={(aula) => recordJoin(person, aula.id)}
      />

      <div className="flex flex-col gap-4">
        <AlertsCard person={person} device={device} />
        <InstallCard />
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
              className={`min-h-14 cursor-pointer rounded-full border-2 bg-surface px-4 py-2.5 font-bold ${
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
                    <span className="text-[0.95rem] text-muted">
                      {several && `${turmaById.get(a.turmaId)?.name ?? ""} · `}
                      {a.title || "Aula"}
                    </span>
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

      <LiveAlert turma={live ? (turmaById.get(live.turmaId) ?? heroTurma) : heroTurma} live={live} sound={sound} />
    </div>
  );
}
