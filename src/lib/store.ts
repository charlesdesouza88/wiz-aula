import { useSyncExternalStore } from "react";
import { DEFAULT_DURATION_MIN, lightningToReplace, type Aula, type Turma } from "./aulas.ts";
import { mockData } from "./mock-data.ts";
import { refreshNow } from "./hooks.ts";
import { addWeeks } from "./time.ts";

// In-memory class data shared by every page, seeded with mock data.
// Replaced by Supabase queries in milestone 2; the action names stay.

export type Data = { turmas: Turma[]; aulas: Aula[] };

let data: Data | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Data {
  data ??= mockData(Date.now());
  return data;
}

function update(fn: (d: Data) => Data) {
  data = fn(getSnapshot());
  refreshNow();
  listeners.forEach((l) => l());
}

function newId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Class data, or null during server rendering and hydration. */
export function useData(): Data | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function startLightning(turmaId: string, meetLink: string, saveAsTurmaLink: boolean) {
  const now = Date.now();
  update((d) => {
    const replaced = new Set(lightningToReplace(d.aulas, turmaId, now).map((a) => a.id));
    const aula: Aula = {
      id: newId("a"),
      turmaId,
      type: "lightning",
      title: "",
      startAt: now,
      durationMin: DEFAULT_DURATION_MIN,
      meetLink,
      status: "live",
      pingAt: now,
    };
    return {
      turmas: saveAsTurmaLink ? d.turmas.map((t) => (t.id === turmaId ? { ...t, meetLink } : t)) : d.turmas,
      aulas: [...d.aulas.map((a) => (replaced.has(a.id) ? { ...a, status: "ended" as const } : a)), aula],
    };
  });
}

export function scheduleAulas(
  turmaId: string,
  opts: { startAt: number; durationMin: number; title: string; meetLink: string; weeks: number },
) {
  const created: Aula[] = Array.from({ length: opts.weeks }, (_, i) => ({
    id: newId("a"),
    turmaId,
    type: "scheduled",
    title: opts.title,
    startAt: addWeeks(opts.startAt, i),
    durationMin: opts.durationMin,
    meetLink: opts.meetLink,
    status: "scheduled",
    pingAt: null,
  }));
  update((d) => ({ ...d, aulas: [...d.aulas, ...created] }));
}

function patchAula(id: string, patch: Partial<Aula>) {
  update((d) => ({ ...d, aulas: d.aulas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
}

export function pingAula(id: string) {
  patchAula(id, { pingAt: Date.now() });
}

export function endAula(id: string) {
  patchAula(id, { status: "ended" });
}

export function deleteAula(id: string) {
  update((d) => ({ ...d, aulas: d.aulas.filter((a) => a.id !== id) }));
}

export function addTurma(t: Omit<Turma, "id">) {
  update((d) => ({ ...d, turmas: [...d.turmas, { ...t, id: newId("t") }] }));
}
