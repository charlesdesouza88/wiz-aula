"use client";

import { usePref, writePref } from "@/lib/hooks";
import { PREF } from "@/lib/pref-keys";

const LABELS = ["A+", "A++", "A"];

/** Cycles the text size through 100 → 112.5 → 125 %. */
export function SizeButton() {
  const pref = usePref(PREF.size);
  const size = pref === "1" ? 1 : pref === "2" ? 2 : 0;

  function cycle() {
    const next = (size + 1) % 3;
    const root = document.documentElement;
    root.classList.remove("wa-size-1", "wa-size-2");
    if (next) root.classList.add(`wa-size-${next}`);
    writePref(PREF.size, next ? String(next) : null);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={size === 2 ? "Voltar ao tamanho normal das letras" : "Aumentar o tamanho das letras"}
      className="min-h-14 min-w-14 cursor-pointer rounded-xl border border-line bg-surface px-3 py-2 font-bold hover:border-primary"
    >
      {LABELS[size]}
    </button>
  );
}
