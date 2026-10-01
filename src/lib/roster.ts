import type { Role } from "./session";

// The admin's list of people: labels, filters and the text sent with a new code.

export type RosterEntry = {
  id: string;
  name: string;
  role: Role;
  /** Turmas the person is enrolled in (students). */
  turmaIds: string[];
  hasCode: boolean;
  /** Devices signed in with the code. */
  devices: number;
  /** Devices with alerts on. */
  alerts: number;
};

/** "all", "teachers", "no-turma" or a turma id. */
export type RosterFilter = string;

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Ainda não entrou" / "Entrou em 2 aparelhos · avisos ligados" / "Sem código". */
export function statusLabel(e: Pick<RosterEntry, "hasCode" | "devices" | "alerts">): string {
  if (!e.hasCode) return "Sem código";
  const parts = [e.devices === 0 ? "Ainda não entrou" : `Entrou em ${plural(e.devices, "aparelho", "aparelhos")}`];
  if (e.alerts > 0) parts.push("avisos ligados");
  return parts.join(" · ");
}

export function roleLabel(role: Role): string {
  return role === "student" ? "Aluno" : role === "teacher" ? "Professor" : "Secretaria";
}

/** Who to show for the chosen filter, sorted by name as a Brazilian reader expects. */
export function filterRoster(entries: RosterEntry[], filter: RosterFilter): RosterEntry[] {
  const shown = entries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "teachers") return e.role !== "student";
    if (filter === "no-turma") return e.role === "student" && e.turmaIds.length === 0;
    return e.turmaIds.includes(filter);
  });
  return shown.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}

/** The message sent with a new code (WhatsApp, e-mail…). */
export function codeMessage(name: string, code: string, appUrl: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return `Olá${first ? `, ${first}` : ""}! Seu código do Wiz Aula é ${code}. Abra ${appUrl} e digite o código para entrar nas aulas.`;
}

/** Most names one list may add; the database enforces the same limit. */
export const MAX_NAMES = 200;

/**
 * Names pasted from the roster spreadsheet, one per line. A line with several
 * cells (a whole row pasted) keeps its last cell, where the template has the
 * student's name. Blank lines and repeats are dropped.
 */
export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("\t").map((c) => c.trim().replace(/\s+/g, " ")).filter(Boolean);
    const name = cells[cells.length - 1];
    if (!name) continue;
    const key = name.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
