import { useEffect, useState } from "react";
import { alertsState, base64UrlToBytes, type AlertsState } from "./alerts.ts";
import { detectDevice } from "./device.ts";
import type { Person } from "./session";
import { supabase } from "./supabase";

// Browser side of push alerts: the service worker, the permission prompt and
// the device's subscription row. The permission prompt only ever opens from a tap.

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function hasPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!hasPush()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

async function saveSubscription(person: Person, sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await supabase()
    .from("push_subscriptions")
    .upsert(
      {
        person_id: person.id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        platform: detectDevice(navigator.userAgent, navigator.maxTouchPoints || 0),
      },
      { onConflict: "endpoint" },
    );
  if (error) throw error;
}

/** The alerts card state for this device, plus the key needed to subscribe. */
export function useAlerts(person: Person) {
  const [state, setState] = useState<AlertsState | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: key } = await supabase().rpc("vapid_public_key");
      const sub = await currentSubscription();
      // Keep the server copy in step, e.g. after signing in again on this device.
      if (sub && Notification.permission === "granted") await saveSubscription(person, sub).catch(() => {});
      if (cancelled) return;
      setPublicKey(key ?? null);
      setState(
        alertsState({
          configured: Boolean(key),
          device: detectDevice(navigator.userAgent, navigator.maxTouchPoints || 0),
          standalone: isStandalone(),
          hasPush: hasPush(),
          permission: "Notification" in window ? Notification.permission : "unsupported",
          subscribed: Boolean(sub),
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [person]);

  /** Must run straight from a tap: the permission prompt is requested before anything is awaited. */
  async function enable(): Promise<"on" | "blocked" | "error"> {
    if (!publicKey) return "error";
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState(permission === "denied" ? "blocked" : "off");
      return permission === "denied" ? "blocked" : "error";
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }));
      await saveSubscription(person, sub);
      setState("on");
      return "on";
    } catch {
      return "error";
    }
  }

  return { state, enable };
}

/** On sign-out: stop alerts for the person who used this device. */
export async function removeDeviceSubscription() {
  try {
    const sub = await currentSubscription();
    if (!sub) return;
    await supabase().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  } catch {
    // Signing out still works; a stale subscription is removed on its first 404/410.
  }
}
