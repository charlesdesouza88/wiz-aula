// Pull to refresh: Home Screen apps on iPhone have no built-in gesture, so the
// app draws its own. Pure math here; the component lives in components/.

/** Fired on window after a pull, so screens with their own data can reload. */
export const REFRESH_EVENT = "wa:refresh";

/** How far the finger must pull, after resistance, to refresh. */
export const PULL_READY = 64;
const PULL_MAX = 96;

/** The indicator's offset for a finger that moved `dy` px down, and whether letting go refreshes. */
export function pullProgress(dy: number): { offset: number; ready: boolean } {
  if (dy <= 0) return { offset: 0, ready: false };
  // Resistance: the indicator moves half as far as the finger, up to a cap.
  const offset = Math.min(PULL_MAX, dy * 0.5);
  return { offset, ready: offset >= PULL_READY };
}
