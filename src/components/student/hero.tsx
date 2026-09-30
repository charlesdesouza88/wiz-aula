import type { Aula, Turma } from "@/lib/aulas";
import type { Device } from "@/lib/device";
import { formatCountdown, formatDay, formatTime } from "@/lib/format";
import { CameraIcon } from "@/components/icons";

type Props = {
  turma: Turma;
  /** Name the turma when the student is in more than one. */
  showTurma: boolean;
  live: Aula | null;
  next: Aula | null;
  now: number;
  device: Device;
  onJoin: (aula: Aula) => void;
};

/** The one primary action on the student screen: the next class and the join button. */
export function Hero({ turma, showTurma, live, next, now, device, onJoin }: Props) {
  const base = "flex flex-col gap-3.5 rounded-3xl border px-5 py-6 shadow-card tablet:px-7 tablet:py-8";

  if (live) {
    const early = now < live.startAt;
    return (
      <section className={`${base} border-gold bg-gold-soft`}>
        <span className="inline-flex items-center gap-2 text-[0.9rem] font-bold tracking-[0.06em] text-live-ink uppercase">
          <span className="live-dot" aria-hidden="true" />
          {early ? "Pode entrar" : "Aula ao vivo agora"}
        </span>
        <h1 className="text-[2rem] font-extrabold">
          {live.type === "lightning" ? "Aula relâmpago" : live.title || "Aula de inglês"}
        </h1>
        <p className="text-muted">
          {showTurma && `${turma.name} · `}
          {turma.teacher && `Com o professor ${turma.teacher} · `}
          {early ? "começa" : "começou"} às {formatTime(live.startAt)}
        </p>
        <a
          href={live.meetLink}
          target="_blank"
          rel="noopener"
          onClick={() => onJoin(live)}
          className="join flex min-h-[84px] items-center justify-center gap-3 rounded-[20px] bg-gold px-4 text-center font-display text-[1.7rem] font-extrabold text-on-gold no-underline hover:brightness-105"
        >
          <CameraIcon className="size-8 flex-none" />
          Entrar na aula
        </a>
        <p className="text-base text-muted">
          {device === "pc" ? (
            <>
              O Google Meet abre numa nova aba. Clique em <b>Permitir</b> para câmera e microfone e depois em{" "}
              <b>Participar agora</b>.
            </>
          ) : (
            <>
              O Google Meet vai abrir. Toque em <b>Pedir para participar</b> ou <b>Participar agora</b>.
            </>
          )}
        </p>
      </section>
    );
  }

  if (next) {
    return (
      <section className={`${base} border-line bg-surface`}>
        <p className="eyebrow">Próxima aula</p>
        <div>
          <p className="font-display text-[2.4rem] leading-none font-extrabold tabular-nums">
            {formatTime(next.startAt)}
          </p>
          <h1 className="mt-1 text-[1.5rem] font-extrabold">{formatDay(next.startAt, now)}</h1>
        </div>
        <p className="text-muted">
          {formatCountdown(next.startAt - now)}
          {showTurma && ` · ${turma.name}`}
          {next.title && ` · ${next.title}`}
        </p>
        <p
          className="flex min-h-[84px] items-center justify-center rounded-[20px] bg-surface-2 px-4 text-center font-display text-[1.2rem] font-extrabold text-muted"
        >
          O botão acende 10 minutos antes
        </p>
      </section>
    );
  }

  return (
    <section className={`${base} border-line bg-surface`}>
      <p className="eyebrow">Nenhuma aula marcada</p>
      <h1 className="text-[1.5rem] font-extrabold">Tudo tranquilo por aqui</h1>
      <p className="text-muted">
        Quando o professor começar uma aula, você recebe um aviso e o botão amarelo aparece aqui.
      </p>
    </section>
  );
}
