import { useEffect, useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { DEFAULT_DURATION_MIN, type Aula, type Turma } from "./aulas.ts";
import type { Database } from "./database.types";
import { refreshNow } from "./hooks.ts";
import type { Person } from "./session";
import { supabase } from "./supabase";
import { DAY, addWeeks } from "./time.ts";

// Turmas and classes the signed-in person may see (row-level security decides),
// kept fresh by Supabase Realtime, a one-minute poll and a reload whenever the
// app comes back to the foreground.

export type Data = { turmas: Turma[]; aulas: Aula[] };

type AulaRow = Database["public"]["Tables"]["aulas"]["Row"];
type TurmaRow = Database["public"]["Tables"]["turmas"]["Row"];

const POLL_MS = 60_000;
/** Classes older than this are not loaded. */
const HISTORY_MS = 2 * DAY;

let data: Data | null = null;
let loadError = false;
let personId: string | null = null;
let channel: RealtimeChannel | null = null;
let poll: ReturnType<typeof setInterval> | undefined;
let pending: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  refreshNow();
  listeners.forEach((l) => l());
}

function toAula(r: AulaRow): Aula {
  return {
    id: r.id,
    turmaId: r.turma_id,
    type: r.type,
    title: r.title,
    startAt: Date.parse(r.start_at),
    durationMin: r.duration_min,
    meetLink: r.meet_link,
    status: r.status,
    pingAt: r.ping_at ? Date.parse(r.ping_at) : null,
  };
}

function toTurma(r: TurmaRow, names: Map<string, string>): Turma {
  return {
    id: r.id,
    name: r.name,
    nivel: r.nivel,
    horario: r.horario,
    teacherId: r.teacher_id,
    teacher: (r.teacher_id && names.get(r.teacher_id)) || "",
    meetLink: r.meet_link,
  };
}

async function load() {
  const since = new Date(Date.now() - HISTORY_MS).toISOString();
  const db = supabase();
  const [turmas, aulas, people] = await Promise.all([
    db.from("turmas").select("*").order("name"),
    db.from("aulas").select("*").gte("start_at", since).order("start_at"),
    db.from("people").select("id, name"),
  ]);
  const error = turmas.error ?? aulas.error ?? people.error;
  if (error) {
    loadError = true;
    emit();
    return;
  }
  const names = new Map((people.data ?? []).map((p) => [p.id, p.name]));
  data = { turmas: (turmas.data ?? []).map((t) => toTurma(t, names)), aulas: (aulas.data ?? []).map(toAula) };
  loadError = false;
  emit();
}

/** Coalesces bursts of realtime events into one reload. */
function reloadSoon() {
  clearTimeout(pending);
  pending = setTimeout(() => void load(), 300);
}

function onVisible() {
  if (document.visibilityState === "visible") void load();
}

function start(person: Person) {
  if (personId === person.id) return;
  stop();
  personId = person.id;
  void load();
  channel = supabase()
    .channel("aulas-turmas")
    .on("postgres_changes", { event: "*", schema: "public", table: "aulas" }, reloadSoon)
    .on("postgres_changes", { event: "*", schema: "public", table: "turmas" }, reloadSoon)
    .subscribe();
  poll = setInterval(() => void load(), POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible);
}

function stop() {
  if (channel) void supabase().removeChannel(channel);
  channel = null;
  clearInterval(poll);
  clearTimeout(pending);
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("online", onVisible);
  personId = null;
  data = null;
  loadError = false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type DataState = { data: Data | null; error: boolean };
let state: DataState = { data: null, error: false };
function getState(): DataState {
  if (state.data !== data || state.error !== loadError) state = { data, error: loadError };
  return state;
}
const SERVER_STATE: DataState = { data: null, error: false };

/** Turmas and classes for the signed-in person; `data` is null until the first load. */
export function useData(person: Person): DataState {
  useEffect(() => start(person), [person]);
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

/** Stops syncing, e.g. after signing out. */
export function resetData() {
  stop();
  emit();
}

// --- actions (row-level security checks each one) ---

function check<T extends { error: unknown }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}

export async function startLightning(person: Person, turma: Turma, meetLink: string, saveAsTurmaLink: boolean) {
  const db = supabase();
  if (saveAsTurmaLink) check(await db.from("turmas").update({ meet_link: meetLink }).eq("id", turma.id));
  const now = new Date().toISOString();
  // The database ends the turma's previous live lightning class in the same statement.
  check(
    await db.from("aulas").insert({
      turma_id: turma.id,
      type: "lightning",
      start_at: now,
      duration_min: DEFAULT_DURATION_MIN,
      meet_link: meetLink,
      status: "live",
      ping_at: now,
      created_by: person.id,
    }),
  );
  await load();
}

export async function scheduleAulas(
  person: Person,
  turma: Turma,
  opts: { startAt: number; durationMin: number; title: string; meetLink: string; weeks: number },
) {
  const rows = Array.from({ length: opts.weeks }, (_, i) => ({
    turma_id: turma.id,
    type: "scheduled" as const,
    title: opts.title,
    start_at: new Date(addWeeks(opts.startAt, i)).toISOString(),
    duration_min: opts.durationMin,
    meet_link: opts.meetLink,
    status: "scheduled" as const,
    created_by: person.id,
  }));
  check(await supabase().from("aulas").insert(rows));
  await load();
}

export async function pingAula(id: string) {
  check(await supabase().from("aulas").update({ ping_at: new Date().toISOString() }).eq("id", id));
  await load();
}

export async function endAula(id: string) {
  check(await supabase().from("aulas").update({ status: "ended" }).eq("id", id));
  await load();
}

export async function deleteAula(id: string) {
  check(await supabase().from("aulas").delete().eq("id", id));
  await load();
}

export async function addTurma(
  person: Person,
  t: { name: string; nivel: string; horario: string; meetLink: string | null },
) {
  check(
    await supabase().from("turmas").insert({
      school_id: person.schoolId,
      teacher_id: person.id,
      name: t.name,
      nivel: t.nivel,
      horario: t.horario,
      meet_link: t.meetLink,
    }),
  );
  await load();
}

/** Attendance: fire and forget when a student taps "Entrar na aula". */
export function recordJoin(person: Person, aulaId: string) {
  void supabase().from("join_events").insert({ aula_id: aulaId, person_id: person.id });
}
