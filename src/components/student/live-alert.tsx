"use client";

import { useEffect, useState } from "react";
import type { Aula, Turma } from "@/lib/aulas";
import { playChime } from "@/lib/chime";
import { BrandMark } from "@/components/icons";

const HIDE_AFTER_MS = 12_000;

function alertKey(a: Aula | null): string | null {
  return a ? `${a.id}:${a.pingAt ?? 0}` : null;
}

/**
 * On-screen alert when a class opens (or the teacher re-sends the alert) while
 * the app is open. A class that was already open when the screen loaded does not alert.
 * Push notifications (milestone 5) cover the app-closed case.
 */
export function LiveAlert({ turma, live, sound }: { turma: Turma; live: Aula | null; sound: boolean }) {
  const key = alertKey(live);
  const [seenKey, setSeenKey] = useState(key);
  const show = live !== null && key !== seenKey;

  useEffect(() => {
    if (!show) return;
    if (sound) playChime();
    const t = setTimeout(() => setSeenKey(key), HIDE_AFTER_MS);
    return () => clearTimeout(t);
    // Chime once per new alert, not when the sound toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, key]);

  return (
    <div role="status" aria-live="polite" className="contents">
      {show && (
        <a
          href={live.meetLink}
          target="_blank"
          rel="noopener"
          onClick={() => setSeenKey(key)}
          className="fixed top-[calc(12px+env(safe-area-inset-top,0px))] left-1/2 z-10 flex w-[min(30rem,calc(100%-24px))] -translate-x-1/2 items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5 text-ink no-underline shadow-[0_10px_40px_rgb(0_0_0/0.25)] desktop:top-24 desktop:right-6 desktop:left-auto desktop:w-96 desktop:translate-x-0"
        >
          <BrandMark size={40} />
          <span>
            <small className="block text-[0.8rem] text-muted">Wiz Aula · agora</small>
            <b className="block">{live.type === "lightning" ? "Aula relâmpago começou!" : "Sua aula vai começar!"}</b>
            <span className="block text-[0.95rem]">{turma.name} · Toque para entrar.</span>
          </span>
        </a>
      )}
    </div>
  );
}
