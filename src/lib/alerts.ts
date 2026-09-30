import type { Device } from "./device.ts";

// What the "Avisos" card should show on this device. Pure, so it can be tested.

export type AlertsState =
  /** Push is not set up on the server yet: show nothing. */
  | "not-configured"
  /** iPhone/iPad in a Safari tab: push only works from the Home Screen icon. */
  | "install-first"
  /** This browser or OS version cannot receive push (for example iOS older than 16.4). */
  | "unsupported"
  /** The person said no; it can only be undone in the device settings. */
  | "blocked"
  /** Ready: show the "Ativar avisos" button. */
  | "off"
  | "on";

export type AlertsEnv = {
  configured: boolean;
  device: Device;
  standalone: boolean;
  hasPush: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

export function alertsState(env: AlertsEnv): AlertsState {
  if (!env.configured) return "not-configured";
  const ios = env.device === "iphone" || env.device === "ipad";
  if (ios && !env.standalone) return "install-first";
  if (!env.hasPush || env.permission === "unsupported") return "unsupported";
  if (env.permission === "denied") return "blocked";
  if (env.permission === "granted" && env.subscribed) return "on";
  return "off";
}

/** VAPID public key (base64url) to the byte array PushManager.subscribe expects. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
