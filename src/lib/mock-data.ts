import type { Aula, Turma } from "./aulas.ts";
import { DAY, zonedParts, zonedTimeToUtc } from "./time.ts";

// Stand-in data until the Supabase schema lands (milestone 2).

/** Next occurrence (school time zone) of one of `weekdays` (0 = Sunday) at `hour`:00 that has not ended yet. */
function nextOccurrence(now: number, weekdays: number[], hour: number, durationMin: number): number {
  const today = zonedParts(now);
  for (let i = 0; i < 8; i++) {
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    const start = zonedTimeToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour, 0);
    if (weekdays.includes(d.getUTCDay()) && start + durationMin * 60_000 > now) return start;
  }
  return now + DAY;
}

export function mockData(now: number): { turmas: Turma[]; aulas: Aula[] } {
  return {
    turmas: [
      {
        id: "masters",
        name: "Masters",
        nivel: "Adults Book 4",
        horario: "Terça e quinta, 19:00 - 20:00",
        teacher: "Chuck",
        meetLink: "https://meet.google.com/abc-defg-hij",
      },
      {
        id: "teens2",
        name: "Teens 2 · tarde",
        nivel: "Teens 2",
        horario: "Segunda e quarta, 15:00 - 16:00",
        teacher: "Chuck",
        meetLink: null,
      },
    ],
    aulas: [
      {
        id: "a1",
        turmaId: "masters",
        type: "scheduled",
        title: "Lesson 12",
        startAt: nextOccurrence(now, [2, 4], 19, 60),
        durationMin: 60,
        meetLink: "https://meet.google.com/abc-defg-hij",
        status: "scheduled",
        pingAt: null,
      },
      {
        id: "a2",
        turmaId: "teens2",
        type: "scheduled",
        title: "",
        startAt: nextOccurrence(now, [1, 3], 15, 60),
        durationMin: 60,
        meetLink: "https://meet.google.com/xyz-abcd-efg",
        status: "scheduled",
        pingAt: null,
      },
    ],
  };
}
