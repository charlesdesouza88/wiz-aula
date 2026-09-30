"use client";

import Link from "next/link";
import { useState } from "react";
import { ShareIcon } from "@/components/icons";
import { useAlerts } from "@/lib/push";
import type { Person } from "@/lib/session";

/** "Ativar avisos", or what to do first on this device. */
export function AlertsCard({ person, device }: { person: Person; device: "android" | "iphone" | "ipad" | "pc" }) {
  const { state, enable } = useAlerts(person);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!state || state === "not-configured") return null;

  if (state === "on") {
    return (
      <div className="card">
        <p className="font-bold text-ok">✓ Avisos ligados</p>
        <p className="text-[0.95rem] text-muted">
          Você recebe um aviso quando a aula começar e 10 minutos antes das aulas marcadas.
        </p>
      </div>
    );
  }

  if (state === "install-first") {
    const where = device === "ipad" ? "em cima, à direita, ao lado do endereço" : "embaixo, no meio da tela";
    return (
      <div className="card border-gold bg-gold-soft">
        <b>Para receber avisos, instale o Wiz Aula</b>
        <p className="text-[0.95rem]">
          Toque em{" "}
          <span className="kbd">
            <ShareIcon />
            Compartilhar
          </span>{" "}
          ({where}), depois em <span className="kbd">Adicionar à Tela de Início</span>. Depois abra o Wiz Aula pelo
          ícone novo e entre com seu código.
        </p>
        <Link href="/como-instalar" className="font-bold text-primary underline underline-offset-[3px]">
          Ver o passo a passo
        </Link>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="card">
        <b>Os avisos estão desligados</b>
        <p className="text-[0.95rem] text-muted">
          Para ligar, abra os ajustes do aparelho, procure <b>Wiz Aula</b> (ou o navegador) e permita as notificações.
        </p>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="card">
        <b>Este aparelho não recebe avisos</b>
        <p className="text-[0.95rem] text-muted">
          {device === "iphone" || device === "ipad"
            ? "Os avisos precisam do iOS 16.4 ou mais novo (Ajustes › Geral › Sobre). Até lá, abra o Wiz Aula na hora da aula."
            : "Abra o Wiz Aula na hora da aula para ver o botão amarelo."}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <b>Avisos da aula</b>
      <p className="text-[0.95rem] text-muted">Receba um aviso neste aparelho quando a aula começar.</p>
      {failed && <p className="msg-err">Não deu para ligar os avisos agora. Confira a internet e tente de novo.</p>}
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          const result = await enable();
          setBusy(false);
          setFailed(result === "error");
        }}
      >
        Ativar avisos
      </button>
    </div>
  );
}
