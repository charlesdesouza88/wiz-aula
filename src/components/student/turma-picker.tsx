import type { Turma } from "@/lib/aulas";

// Mock-data stand-in: after access-code login (milestone 3) the turma comes from the student's enrolment.
export function TurmaPicker({ turmas, onPick }: { turmas: Turma[]; onPick: (id: string) => void }) {
  return (
    <div className="card desktop:max-w-[48rem]">
      <h1 className="text-[1.5rem] font-extrabold">Qual é a sua turma?</h1>
      <p className="text-muted">Toque na sua turma. Você só faz isso uma vez.</p>
      {turmas.length ? (
        <div className="flex flex-col gap-2.5 desktop:grid desktop:grid-cols-2">
          {turmas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              className="flex min-h-[72px] cursor-pointer flex-col items-start gap-0.5 rounded-2xl border-2 border-line bg-surface px-4.5 py-4 text-left hover:border-primary"
            >
              <strong className="font-display text-[1.3rem]">{t.name}</strong>
              <span className="text-[0.95rem] text-muted">
                {t.nivel} · {t.horario}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted">Nenhuma turma cadastrada ainda. Peça ao professor.</p>
      )}
    </div>
  );
}
