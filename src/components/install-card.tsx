"use client";

import { promptInstall, useCanInstall } from "@/lib/install";

/** One-tap install where the browser allows it (Chrome and Edge on Android and computers). */
export function InstallCard() {
  const canInstall = useCanInstall();
  if (!canInstall) return null;
  return (
    <div className="card">
      <b>Instale o Wiz Aula</b>
      <p className="text-[0.95rem] text-muted">Fica um ícone na tela, como um aplicativo. É só tocar nele na hora da aula.</p>
      <button type="button" className="btn" onClick={() => void promptInstall()}>
        Instalar
      </button>
    </div>
  );
}
