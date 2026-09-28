import { DAY, MINUTE } from "./time.ts";

export type AulaType = "scheduled" | "lightning";
export type AulaStatus = "scheduled" | "live" | "ended";

export type Turma = {
  id: string;
  name: string;
  nivel: string;
  horario: string;
  teacher: string;
  meetLink: string | null;
};

export type Aula = {
  id: string;
  turmaId: string;
  type: AulaType;
  title: string;
  startAt: number; // UTC ms
  durationMin: number;
  meetLink: string;
  status: AulaStatus;
  pingAt: number | null; // last time the students were alerted
};

/** The join button lights up this long before a scheduled class. */
export const JOIN_WINDOW_MS = 10 * MINUTE;
export const DEFAULT_DURATION_MIN = 60;

export function endsAt(a: Aula): number {
  return a.startAt + a.durationMin * MINUTE;
}

/** True while students can join: from T-10 for scheduled classes, from the start for lightning ones. */
export function isLive(a: Aula, now: number): boolean {
  if (a.status === "ended") return false;
  const opensAt = a.type === "lightning" ? a.startAt : a.startAt - JOIN_WINDOW_MS;
  return now >= opensAt && now < endsAt(a);
}

export function isOver(a: Aula, now: number): boolean {
  return a.status === "ended" || now >= endsAt(a);
}

export function aulasOf(aulas: Aula[], turmaId: string): Aula[] {
  return aulas.filter((a) => a.turmaId === turmaId).sort((x, y) => x.startAt - y.startAt);
}

export type StudentView = {
  /** The class to join right now, if any (the most recently started one). */
  live: Aula | null;
  /** Classes that have not opened yet, soonest first. */
  upcoming: Aula[];
};

export function studentView(aulas: Aula[], turmaId: string, now: number): StudentView {
  const list = aulasOf(aulas, turmaId);
  const live = list.filter((a) => isLive(a, now));
  const upcoming = list.filter((a) => !isLive(a, now) && !isOver(a, now));
  return { live: live.at(-1) ?? null, upcoming };
}

/** Classes shown to the teacher: everything not over, plus classes that ended in the last 24 hours. */
export function teacherList(aulas: Aula[], turmaId: string, now: number): Aula[] {
  return aulasOf(aulas, turmaId).filter((a) => !isOver(a, now) || now - endsAt(a) < DAY);
}

/** Lightning classes that must end when a new lightning class starts in the same turma. */
export function lightningToReplace(aulas: Aula[], turmaId: string, now: number): Aula[] {
  return aulasOf(aulas, turmaId).filter((a) => a.type === "lightning" && isLive(a, now));
}
