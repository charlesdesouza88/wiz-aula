import type { RosterEntry } from "./roster.ts";
import type { Role } from "./session";
import { supabase } from "./supabase";

// School admin actions. Each is a database function that checks the caller is
// an admin of the person's school; codes are only ever returned when created.

export type AdminError = "invalid" | "not-allowed" | "offline";

/** Maps a failed call to what the screen should say. */
export function adminError(err: unknown): AdminError {
  const code = (err as { code?: string } | null)?.code;
  if (code === "22023") return "invalid";
  if (code === "42501") return "not-allowed";
  return "offline";
}

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

export async function loadRoster(): Promise<RosterEntry[]> {
  const rows = check(await supabase().rpc("admin_roster")) ?? [];
  return rows.map((r) => ({
    id: r.person_id,
    name: r.name,
    role: r.role,
    turmaIds: r.turma_ids ?? [],
    hasCode: r.code_created_at !== null,
    devices: r.devices,
    alerts: r.alerts,
  }));
}

/** Adds a student (optionally to a turma) or a teacher; returns their first code. */
export async function addPerson(name: string, role: Role, turmaId: string | null): Promise<{ id: string; code: string }> {
  const rows = check(
    await supabase().rpc("admin_add_person", { name, role, ...(turmaId ? { turma: turmaId } : {}) }),
  );
  const row = rows?.[0];
  if (!row) throw new Error("no row");
  return { id: row.person_id, code: row.code };
}

/** Replaces the person's code and signs them out on every device. */
export async function newCode(personId: string): Promise<string> {
  const code = check(await supabase().rpc("admin_new_code", { person: personId }));
  if (!code) throw new Error("no code");
  return code;
}

/** Deletes the person with their code, devices, enrolments and attendance. */
export async function removePerson(personId: string): Promise<void> {
  check(await supabase().rpc("admin_remove_person", { person: personId }));
}
