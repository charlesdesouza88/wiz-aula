import { useSyncExternalStore } from "react";
import { detectDevice, type Device } from "./device.ts";

// --- current time, refreshed every 15 seconds ---

const TICK_MS = 15_000;
let now = 0;
const clockListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      clockListeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getNow() {
  // Refresh a stale value when a page mounts after the clock was idle.
  // Only a stale value changes, so repeated calls within a render stay equal.
  if (Date.now() - now > TICK_MS) now = Date.now();
  return now;
}

/** Re-reads the clock now, e.g. after data changes, so a class started this second counts as started. */
export function refreshNow() {
  now = Date.now();
  clockListeners.forEach((l) => l());
}

/** Current time in ms, or null during server rendering and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeClock, getNow, () => null);
}

// --- per-device preferences in localStorage ---

const prefListeners = new Set<() => void>();

function subscribePrefs(listener: () => void) {
  prefListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    prefListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just is not remembered.
  }
  prefListeners.forEach((l) => l());
}

/** A remembered choice for this device. `undefined` until the client has hydrated. */
export function usePref(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribePrefs,
    () => readPref(key),
    () => undefined,
  );
}

// --- device ---

const noop = () => () => {};

export function useDevice(): Device | null {
  return useSyncExternalStore(
    noop,
    () => detectDevice(navigator.userAgent, navigator.maxTouchPoints || 0),
    () => null,
  );
}
