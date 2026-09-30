import { DAY, MINUTE } from "./time.ts";

export type AulaType = "scheduled" | "lightning";
export type AulaStatus = "scheduled" | "live" | "ended";

export type Turma = {
  id: string;
  name: string;
  nivel: string;
  horario: string;
  teacherId: string | null;
  /** Teacher's name, when the signed-in person may see it. */
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

/**
 * Applies the rule the database cannot see: a live lightning class ends when a
 * later scheduled class of the same turma opens (T-10), so students only ever
 * have one button. Returns the list with those lightning classes marked ended.
 */
export function resolveOverlaps(aulas: Aula[], now: number): Aula[] {
  return aulas.map((a) => {
    if (a.type !== "lightning" || a.status === "ended") return a;
    const replaced = aulas.some(
      (b) =>
        b.turmaId === a.turmaId &&
        b.type === "scheduled" &&
        b.status !== "ended" &&
        b.startAt - JOIN_WINDOW_MS > a.startAt &&
        now >= b.startAt - JOIN_WINDOW_MS,
    );
    return replaced ? { ...a, status: "ended" as const } : a;
  });
}

export type StudentView = {
  /** The class to join right now, if any (the most recently opened one). */
  live: Aula | null;
  /** Classes that have not opened yet, soonest first. */
  upcoming: Aula[];
};

/** What a student sees across all of their turmas. */
export function studentView(aulas: Aula[], now: number): StudentView {
  const list = resolveOverlaps(aulas, now).sort((x, y) => x.startAt - y.startAt);
  const live = list.filter((a) => isLive(a, now));
  const upcoming = list.filter((a) => !isLive(a, now) && !isOver(a, now));
  return { live: live.at(-1) ?? null, upcoming };
}

/** Classes shown to the teacher: everything not over, plus classes that ended in the last 24 hours. */
export function teacherList(aulas: Aula[], turmaId: string, now: number): Aula[] {
  return resolveOverlaps(aulasOf(aulas, turmaId), now).filter((a) => !isOver(a, now) || now - endsAt(a) < DAY);
}
