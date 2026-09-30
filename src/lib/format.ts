import { MINUTE, SCHOOL_TZ, dayKey } from "./time.ts";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SCHOOL_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const longDayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: SCHOOL_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "19:00" */
export function formatTime(ts: number): string {
  return timeFormatter.format(ts);
}

/** "Hoje", "Amanhã" or "Terça-feira, 30 de setembro" */
export function formatDay(ts: number, now: number): string {
  const key = dayKey(ts);
  const today = dayKey(now);
  if (key === today) return "Hoje";
  const [y, m, d] = today.split("-").map(Number);
  if (key === new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)) return "Amanhã";
  return capitalize(longDayFormatter.format(ts));
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Falta 1 minuto", "Faltam 2 horas e 5 minutos", "Faltam 3 dias e 1 hora" */
export function formatCountdown(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / MINUTE));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  const verb = (lead: number) => (lead === 1 ? "Falta " : "Faltam ");
  if (days > 0) return verb(days) + plural(days, "dia", "dias") + (hours ? " e " + plural(hours, "hora", "horas") : "");
  if (hours > 0)
    return verb(hours) + plural(hours, "hora", "horas") + (minutes ? " e " + plural(minutes, "minuto", "minutos") : "");
  return verb(minutes) + plural(minutes, "minuto", "minutos");
}
