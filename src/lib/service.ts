// Telling "the Wiz Aula database is down" apart from "this device has no
// internet", so people are never told to check their internet when the problem
// is on our side. Pure logic; the browser side is in service-status.ts.

export type ServiceStatus = "ok" | "offline" | "down";

type ErrorLike = { name?: unknown; message?: unknown; code?: unknown; status?: unknown; httpStatus?: unknown };

/**
 * Whether a failed Supabase call means the service could not be reached or
 * failed on its side, as opposed to a refusal (a wrong code, a rule saying no).
 * Network failures come back as HTTP status 0; a paused or broken project as 5xx.
 */
export function isServerTrouble(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as ErrorLike;
  const status = typeof e.httpStatus === "number" ? e.httpStatus : typeof e.status === "number" ? e.status : null;
  if (status !== null && (status === 0 || status >= 500)) return true;
  if (e.name === "AuthRetryableFetchError") return true;
  // PostgREST could not reach the database (PGRST000-PGRST003).
  if (typeof e.code === "string" && /^PGRST00[0-3]$/.test(e.code)) return true;
  const message = typeof e.message === "string" ? e.message : "";
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed|timed? ?out/i.test(message);
}

/** "Não deu para salvar: o Wiz Aula está fora do ar agora…" for a failed action. */
export function troubleText(status: ServiceStatus, what: string): string {
  if (status === "down") return `Não deu para ${what}: o Wiz Aula está fora do ar agora. Tente de novo em alguns minutos.`;
  if (status === "offline") return `Não deu para ${what}: você está sem internet. Confira o Wi-Fi ou os dados móveis.`;
  return `Não deu para ${what} agora. Tente de novo.`;
}

/** Title and text of the banner shown while something is wrong. */
export function bannerText(status: Exclude<ServiceStatus, "ok">): { title: string; text: string } {
  return status === "down"
    ? {
        title: "O Wiz Aula está fora do ar",
        text: "O problema não é no seu aparelho nem na sua internet. A página tenta de novo sozinha.",
      }
    : {
        title: "Você está sem internet",
        text: "Confira o Wi-Fi ou os dados móveis. A página volta sozinha quando a internet voltar.",
      };
}
