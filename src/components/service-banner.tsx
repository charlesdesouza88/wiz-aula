"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshData } from "@/lib/data";
import { REFRESH_EVENT } from "@/lib/pull";
import { bannerText, troubleText } from "@/lib/service";
import { pingDatabase, reportOffline, reportOk, reportTrouble, useServiceStatus } from "@/lib/service-status";
import { refreshSession } from "@/lib/session";

const RETRY_MS = 30_000;

/**
 * Shown under the menu while Wiz Aula cannot be reached: says whether the
 * problem is the database ("fora do ar") or the device ("sem internet"),
 * retries every 30 seconds and disappears by itself when things work again.
 */
export function ServiceBanner() {
  const status = useServiceStatus();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const retry = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      if (await pingDatabase()) {
        reportOk();
        await Promise.all([refreshSession(), refreshData()]);
        window.dispatchEvent(new Event(REFRESH_EVENT));
      } else {
        await reportTrouble({ message: "Failed to fetch", httpStatus: 0 });
      }
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const onOnline = () => void retry();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", reportOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", reportOffline);
    };
  }, [retry]);

  useEffect(() => {
    if (status === "ok") return;
    const timer = setInterval(() => void retry(), RETRY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void retry();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, retry]);

  if (status === "ok") return null;
  const { title, text } = bannerText(status);
  return (
    <div role="alert" className="flex flex-col gap-2.5 rounded-2xl bg-err-bg p-4 text-err-ink tablet:flex-row tablet:items-center">
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-base">{text}</p>
      </div>
      <button type="button" className="btn-ghost flex-none bg-surface" onClick={() => void retry()} disabled={busy}>
        {busy ? "Tentando…" : "Tentar agora"}
      </button>
    </div>
  );
}

/** The main area while a signed-in device waits for Wiz Aula (the banner above says why). */
export function ServiceWait() {
  const status = useServiceStatus();
  return (
    <p className="text-muted">
      {status === "offline"
        ? "Suas aulas aparecem aqui quando a internet voltar."
        : "Suas aulas aparecem aqui assim que o Wiz Aula voltar."}
    </p>
  );
}

/** "Não deu para carregar as aulas: …" with the real cause, for a screen whose data did not load. */
export function LoadProblem({ what }: { what: string }) {
  const status = useServiceStatus();
  return <p className="msg-err">{troubleText(status, what)}</p>;
}
