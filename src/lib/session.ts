import { useSyncExternalStore } from "react";
import type { Database } from "./database.types";
import { supabase } from "./supabase";

// Who is signed in on this device. Each device signs in anonymously with
// Supabase Auth and is then linked to a person by redeem_access_code().

export type Role = Database["public"]["Enums"]["person_role"];
export type Person = { id: string; name: string; role: Role; schoolId: string };

export type Session =
  | { status: "loading" }
  | { status: "signed-out" }
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
  const { data } = await supabase().auth.getSession();
  if (!data.session) return null;
  const { data: login, error } = await supabase()
    .from("person_logins")
    .select("person:people(id, name, role, school_id)")
    .maybeSingle();
  if (error) throw error;
  const p = login?.person;
  return p ? { id: p.id, name: p.name, role: p.role, schoolId: p.school_id } : null;
}

async function refresh() {
  try {
    const person = await loadPerson();
    set(person ? { status: "signed-in", person } : { status: "signed-out" });
  } catch {
    // Offline or Supabase unreachable: keep what we had, or show the login.
    if (session.status === "loading") set({ status: "signed-out" });
  }
}

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

export type SignInResult = "ok" | "unknown-code" | "too-many" | "not-enabled" | "offline";

// Errors from redeem_access_code that mean the saved device session is no
// longer valid: rejected token, or its auth user no longer exists.
const STALE_SESSION = new Set(["PGRST301", "PGRST302", "PGRST303", "28000", "23503"]);

type Anonymous = "ok" | "not-enabled" | "offline";

async function signInAnonymously(): Promise<Anonymous> {
  const { error } = await supabase().auth.signInAnonymously();
  if (!error) return "ok";
  // The project must allow anonymous sign-ins (Authentication › Sign In / Providers).
  return error.code === "anonymous_provider_disabled" ? "not-enabled" : "offline";
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
    let { data: rows, error } = await supabase().rpc("redeem_access_code", { code });
    if (error && !fresh && STALE_SESSION.has(error.code)) {
      // The saved device session may be stale (its auth user was removed after
      // a long time unused). Start over with a new anonymous user, once.
      await auth.signOut({ scope: "local" });
      const anon = await signInAnonymously();
      if (anon !== "ok") return anon;
      ({ data: rows, error } = await supabase().rpc("redeem_access_code", { code }));
    }
    if (error) return error.message.includes("too_many_attempts") ? "too-many" : "offline";
    if (!rows?.length) return "unknown-code";
    await refresh();
    return session.status === "signed-in" ? "ok" : "offline";
  } catch {
    return "offline";
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
