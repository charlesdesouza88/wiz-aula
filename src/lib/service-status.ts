import { useSyncExternalStore } from "react";
import { isServerTrouble, troubleText, type ServiceStatus } from "./service.ts";

// App-wide "is Wiz Aula reachable?" state. Data and session code report each
// call's outcome; ServiceBanner shows the result and retries.

let status: ServiceStatus = "ok";
const listeners = new Set<() => void>();

function set(next: ServiceStatus) {
  if (next === status) return;
  status = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useServiceStatus(): ServiceStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => "ok",
  );
}

/** A request to the database worked. */
export function reportOk() {
  set("ok");
}

/** The browser says the device just lost its connection. */
export function reportOffline() {
  set("offline");
}

// Our website is served by Vercel, the database by Supabase: if the website
// answers but the database does not, the problem is ours, not the device's.
// The service worker caches nothing, so this always goes to the network.
async function deviceOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    const res = await fetch("/manifest.webmanifest", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Works out why a request failed; refusals (a wrong code, a rule) leave the status as it is. */
export async function reportTrouble(err: unknown): Promise<ServiceStatus> {
  if (isServerTrouble(err)) set((await deviceOnline()) ? "down" : "offline");
  return status;
}

/** The message for a failed action, naming the real cause: "Não deu para salvar: …". */
export async function failureText(err: unknown, what: string): Promise<string> {
  return troubleText(await reportTrouble(err), what);
}

/** Whether the database answers at all: any reply below 500 means it is up. */
export async function pingDatabase(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key }, cache: "no-store" });
    return res.status < 500;
  } catch {
    return false;
  }
}

const SLOW_MS = 3000;

/**
 * Waits for `work`, but if it is still running after 3 seconds (the client
 * retries failed reads for about 8), checks the database directly so the
 * banner can explain the wait instead of leaving "Carregando…" on screen.
 */
export async function watchSlow<T>(work: Promise<T>): Promise<T> {
  let settled = false;
  const timer = setTimeout(async () => {
    if (settled || (await pingDatabase()) || settled) return;
    await reportTrouble({ message: "Failed to fetch", httpStatus: 0 });
  }, SLOW_MS);
  try {
    return await work;
  } finally {
    settled = true;
    clearTimeout(timer);
  }
}
