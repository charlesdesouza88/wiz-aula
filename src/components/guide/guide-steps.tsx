"use client";

import { GUIDES, GUIDE_TABS, type GuideId } from "@/content/guides";
import { DEVICE_NAME } from "@/lib/device";
import { useDevice, usePref, writePref } from "@/lib/hooks";
import { PREF } from "@/lib/pref-keys";

function isGuideId(v: string | null | undefined): v is GuideId {
  return GUIDE_TABS.some((t) => t.id === v);
}

export function GuideSteps() {
  const device = useDevice();
  const saved = usePref(PREF.guide);
  const current: GuideId = isGuideId(saved) ? saved : (device ?? "android");
  const guide = GUIDES[current];

  return (
    <>
      <div className="card">
        <h1 className="text-[1.75rem] font-bold">Como deixar tudo pronto</h1>
        <p className="text-muted">Faça uma vez só, com calma. Depois é só tocar no aviso.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Escolha o aparelho">
          {GUIDE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === current}
              onClick={() => writePref(PREF.guide, t.id)}
              className={`min-h-14 cursor-pointer rounded-full border-2 px-4 py-2.5 font-bold hover:border-primary ${
                t.id === current ? "border-primary bg-surface-2" : "border-line bg-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {device && (
          <p className="text-[0.95rem] text-muted">
            Parece que você está usando {DEVICE_NAME[device]}. Se não for, escolha o seu aparelho acima.
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-3 desktop:grid desktop:grid-cols-[repeat(2,minmax(0,1fr))]">
        {guide.steps.map((step, i) => (
          <li
            key={step.title}
            className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3.5 rounded-2xl border border-line bg-surface p-4"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-full bg-primary font-display text-[1.4rem] font-bold text-on-primary"
            >
              {i + 1}
            </span>
            <div>
              <b className="block">{step.title}</b>
              {step.body}
            </div>
          </li>
        ))}
      </ol>

      {guide.warning && <p className="rounded-[14px] bg-gold-soft px-3.5 py-3 text-base">{guide.warning}</p>}
    </>
  );
}
