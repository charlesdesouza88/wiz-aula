"use client";

import { useEffect, useRef, useState } from "react";
import { refreshData } from "@/lib/data";
import { PULL_READY, REFRESH_EVENT, pullProgress } from "@/lib/pull";
import { refreshSession } from "@/lib/session";

type Phase = "idle" | "pulling" | "refreshing";

/**
 * Swipe down from the top of the page to reload the screen. Home Screen apps
 * on iPhone have no gesture of their own; on phones that do, it is turned off
 * in globals.css so this one is the same everywhere.
 */
export function PullToRefresh() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [offset, setOffset] = useState(0);
  const [ready, setReady] = useState(false);
  const startY = useRef<number | null>(null);
  const startX = useRef(0);
  const readyRef = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    async function refresh() {
      busy.current = true;
      setPhase("refreshing");
      setOffset(PULL_READY);
      const minimum = new Promise((r) => setTimeout(r, 600));
      try {
        await Promise.all([refreshSession(), refreshData()]);
        window.dispatchEvent(new Event(REFRESH_EVENT));
      } finally {
        await minimum;
        busy.current = false;
        setPhase("idle");
        setOffset(0);
        setReady(false);
        readyRef.current = false;
      }
    }

    function reset() {
      startY.current = null;
      readyRef.current = false;
      setOffset(0);
      setReady(false);
      setPhase("idle");
    }
    function onStart(e: TouchEvent) {
      if (busy.current) return;
      // Only a one-finger pull that starts with the page at the very top. A second
      // finger (pinch to zoom) cancels a pull in progress.
      if (e.touches.length !== 1 || window.scrollY > 0) {
        if (startY.current !== null) reset();
        return;
      }
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
    }
    function onMove(e: TouchEvent) {
      if (startY.current === null || busy.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;
      // The page scrolled, or the finger is mostly moving sideways: not a pull.
      if (window.scrollY > 0 || (dy < 24 && Math.abs(dx) > Math.abs(dy))) {
        reset();
        return;
      }
      const p = pullProgress(dy);
      readyRef.current = p.ready;
      setOffset(p.offset);
      setReady(p.ready);
      setPhase(p.offset > 0 ? "pulling" : "idle");
    }
    function onEnd() {
      if (startY.current === null || busy.current) return;
      startY.current = null;
      if (readyRef.current) void refresh();
      else reset();
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const label = phase === "refreshing" ? "Atualizando…" : ready ? "Solte para atualizar" : "Puxe para atualizar";

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[env(safe-area-inset-top,0px)] left-1/2 z-20 flex flex-col items-center gap-1.5"
        style={{
          transform: `translate(-50%, ${offset - 56}px)`,
          opacity: phase === "idle" ? 0 : 1,
          transition: phase === "pulling" ? "none" : "transform .2s ease, opacity .2s ease",
        }}
      >
        <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-primary shadow-card">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-6 ${phase === "refreshing" ? "pull-spin" : ""}`}
            style={{ transform: phase !== "refreshing" && ready ? "rotate(180deg)" : undefined, transition: "transform .15s" }}
          >
            {phase === "refreshing" ? <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
          </svg>
        </span>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-[0.85rem] font-bold text-muted shadow-card">
          {label}
        </span>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === "refreshing" ? "Atualizando…" : ""}
      </p>
    </>
  );
}
