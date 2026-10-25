import { useSyncExternalStore } from "react";
import type { Database } from "./database.types";
import { reportOk, reportTrouble, watchSlow } from "./service-status.ts";
import { supabase } from "./supabase";

// Who is signed in on this device. Each device signs in anonymously with
// Supabase Auth and is then linked to a person by redeem_access_code().

export type Role = Database["public"]["Enums"]["person_role"];
export type Person = { id: string; name: string; role: Role; schoolId: string };

export type Session =
  | { status: "loading" }
  | { status: "signed-out" }
  // Signed in on this device, but Wiz Aula cannot be reached to say as whom.
  | { status: "unavailable" }
  | { status: "signed-in"; person: Person };

const LOADING: Session = { status: "loading" };
let session: Session = LOADING;
let started = false;
const listeners = new Set<() => void>();

function set(next: Session) {
  session = next;
  listeners.forEach((l) => l());
}

async function loadPerson(): Promise<Person | null> {
  const { data, error: authError } = await supabase().auth.getSession();
  // A saved session whose token could not be renewed (the server did not answer).
  if (authError) throw authError;
  if (!data.session) return null;
  const { data: login, error, status } = await supabase()
    .from("person_logins")
    .select("person:people(id, name, role, school_id)")
    .maybeSingle();
  if (error) throw Object.assign(error, { httpStatus: status });
  reportOk();
  const p = login?.person;
  return p ? { id: p.id, name: p.name, role: p.role, schoolId: p.school_id } : null;
}

async function refresh() {
  try {
    const person = await watchSlow(loadPerson());
    set(person ? { status: "signed-in", person } : { status: "signed-out" });
  } catch (err) {
    const service = await reportTrouble(err);
    // Keep showing who is signed in; never send a signed-in device back to the
    // code screen just because Wiz Aula or the internet is down.
    if (session.status === "signed-in") return;
    set(service === "ok" ? { status: "signed-out" } : { status: "unavailable" });
  }
}

/** Re-reads who is signed in on this device (pull to refresh). */
export const refreshSession = refresh;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refresh();
  }
  return () => {
    listeners.delete(listener);
  };
}

/** The signed-in person, or loading / signed-out. Always "loading" on the server. */
export function useSession(): Session {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => LOADING,
  );
}

export type SignInResult = "ok" | "unknown-code" | "too-many" | "not-enabled" | "offline" | "down" | "failed";

// Errors from redeem_access_code that mean the saved device session is no
// longer valid: rejected token, or its auth user no longer exists.
const STALE_SESSION = new Set(["PGRST301", "PGRST302", "PGRST303", "28000", "23503"]);

/** Why a sign-in step failed: Wiz Aula down, no internet, or something else. */
async function troubleResult(err: unknown): Promise<"down" | "offline" | "failed"> {
  const service = await reportTrouble(err);
  return service === "ok" ? "failed" : service;
}

type Anonymous = "ok" | "not-enabled" | "offline" | "down" | "failed";

async function signInAnonymously(): Promise<Anonymous> {
  const { error } = await supabase().auth.signInAnonymously();
  if (!error) return "ok";
  // The project must allow anonymous sign-ins (Authentication › Sign In / Providers).
  if (error.code === "anonymous_provider_disabled") return "not-enabled";
  return troubleResult(error);
}

/** Signs this device in with a school-issued access code. */
export async function signIn(code: string): Promise<SignInResult> {
  try {
    const auth = supabase().auth;
    const { data } = await auth.getSession();
    // Only create an anonymous user when someone actually submits a code.
    const fresh = !data.session;
    if (fresh) {
      const anon = await signInAnonymously();
      if (anon !== "ok") return anon;
    }
    let { data: rows, error, status } = await supabase().rpc("redeem_access_code", { code });
    if (error && !fresh && STALE_SESSION.has(error.code)) {
      // The saved device session may be stale (its auth user was removed after
      // a long time unused). Start over with a new anonymous user, once.
      await auth.signOut({ scope: "local" });
      const anon = await signInAnonymously();
      if (anon !== "ok") return anon;
      ({ data: rows, error, status } = await supabase().rpc("redeem_access_code", { code }));
    }
    if (error) {
      if (error.message.includes("too_many_attempts")) return "too-many";
      return troubleResult(Object.assign(error, { httpStatus: status }));
    }
    reportOk();
    if (!rows?.length) return "unknown-code";
    await refresh();
    if (session.status === "signed-in") return "ok";
    return session.status === "unavailable" ? troubleResult({ httpStatus: 0 }) : "failed";
  } catch (err) {
    return troubleResult(err);
  }
}

export async function signOut() {
  try {
    const { data } = await supabase().auth.getSession();
    if (data.session) {
      await supabase().from("person_logins").delete().eq("auth_user_id", data.session.user.id);
    }
    await supabase().auth.signOut();
  } finally {
    set({ status: "signed-out" });
  }
}
