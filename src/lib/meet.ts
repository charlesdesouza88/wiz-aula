const MEET_URL = /^(?:https?:\/\/)?meet\.google\.com\/([a-z]{3}-?[a-z]{4}-?[a-z]{3})(?:[/?#].*)?$/i;
const MEET_CODE = /^([a-z]{3}-?[a-z]{4}-?[a-z]{3})$/i;

/**
 * Normalises a Google Meet link to https://meet.google.com/xxx-yyyy-zzz.
 * Accepts a full URL, a URL with a query string or fragment, or the bare
 * 10-letter code with or without hyphens. Returns null for anything else.
 */
export function normalizeMeetLink(input: string): string | null {
  const s = input.trim();
  const m = MEET_URL.exec(s) ?? MEET_CODE.exec(s);
  if (!m) return null;
  const code = m[1].toLowerCase().replace(/-/g, "");
  return `https://meet.google.com/${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7)}`;
}

/** Link without the scheme, for display and for pre-filling inputs. */
export function shortMeetLink(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export const MEET_LINK_ERROR =
  "Esse link não parece do Google Meet. Ele deve ser assim: meet.google.com/abc-defg-hij";
