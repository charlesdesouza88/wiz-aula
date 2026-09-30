"use client";

import { useEffect, useState } from "react";

/** Two taps for destructive actions: the first asks for confirmation for a few seconds. */
export function ConfirmButton({
  label,
  confirmLabel = "Toque para confirmar",
  onConfirm,
  className = "btn-ghost",
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <button
      type="button"
      className={className}
      aria-live="polite"
      onClick={() => {
        if (confirming) {
          setConfirming(false);
          onConfirm();
        } else {
          setConfirming(true);
        }
      }}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}
