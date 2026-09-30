"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/session";
import { FormMessage, type Message } from "./form-message";

const ERRORS = {
  "unknown-code": "Não encontramos esse código. Confira as letras e os números e tente de novo.",
  "too-many": "Foram muitas tentativas. Espere 10 minutos e tente de novo.",
  "not-enabled": "A entrada com código ainda não foi ligada. Avise a escola.",
  offline: "Não deu para entrar agora. Confira a internet e tente de novo.",
} as const;

export function LoginForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setMessage({ kind: "err", text: "Digite o código de acesso que a escola te deu." });
    setBusy(true);
    setMessage(null);
    const result = await signIn(code);
    setBusy(false);
    if (result !== "ok") setMessage({ kind: "err", text: ERRORS[result] });
  }

  return (
    <form className="card desktop:max-w-[36rem]" onSubmit={submit} noValidate>
      <h1 className="text-[1.75rem] font-extrabold">Entre com seu código</h1>
      <p className="text-muted">Digite o código de acesso que a escola te deu. Você só faz isso uma vez neste aparelho.</p>
      <div className="field">
        <label htmlFor="accessCode">Código de acesso</label>
        <input
          id="accessCode"
          className="input font-display text-[1.4rem] tracking-[0.08em] uppercase"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="WIZ-7KQ9-M3XP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <FormMessage message={message} />
      <button className="btn btn-gold" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-[0.95rem] text-muted">
        Não tem código? Peça à escola.{" "}
        <Link href="/como-instalar" className="font-bold text-primary underline underline-offset-[3px]">
          Como instalar o app
        </Link>
      </p>
    </form>
  );
}
