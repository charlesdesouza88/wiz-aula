// Timestamps are stored and passed around as UTC epoch milliseconds.
// Everything the user sees is shown in the school's time zone.
export const SCHOOL_TZ = "America/Sao_Paulo";

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHOOL_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function zonedParts(ts: number): ZonedParts {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    partsFormatter.formatToParts(ts).find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

/** UTC timestamp for a wall-clock time in the school's time zone. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Offset of the zone at the guessed instant; a second pass settles DST edges.
  let ts = guess;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(ts);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    ts = guess - (asUtc - ts);
  }
  return ts;
}

/** Calendar-day key (YYYY-MM-DD) in the school's time zone. */
export function dayKey(ts: number): string {
  const p = zonedParts(ts);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Parses the values of <input type="date"> and <input type="time"> as school-zone wall time. */
export function parseDateTimeInput(date: string, time: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [year, month, day, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const ts = zonedTimeToUtc(year, month, day, hour, minute);
  // Reject dates that roll over, such as 31 February.
  return dayKey(ts) === date ? ts : null;
}

/** Same wall-clock time, `weeks` weeks later, in the school's time zone. */
export function addWeeks(ts: number, weeks: number): number {
  const p = zonedParts(ts);
  const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day + 7 * weeks));
  return zonedTimeToUtc(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), p.hour, p.minute);
}

/** Value for <input type="date"> for the day after `ts`, in the school's time zone. */
export function tomorrowInputValue(ts: number): string {
  const p = zonedParts(ts);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return d.toISOString().slice(0, 10);
}
