import type { Metadata } from "next";
import { FAQ } from "@/content/guides";
import { GuideSteps } from "@/components/guide/guide-steps";

export const metadata: Metadata = { title: "Como instalar · Wiz Aula" };

export default function ComoInstalarPage() {
  return (
    <>
      <GuideSteps />
      <section className="card desktop:grid desktop:grid-cols-2 desktop:gap-x-8">
        <h2 className="eyebrow desktop:col-span-2">Problemas comuns</h2>
        {FAQ.map((item) => (
          <div key={item.q}>
            <h3 className="font-body text-[1.1rem] font-bold">{item.q}</h3>
            <p className="text-muted">{item.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}
