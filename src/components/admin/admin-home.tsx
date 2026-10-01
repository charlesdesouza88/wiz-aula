"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { loadRoster } from "@/lib/admin";
import { useData } from "@/lib/data";
import type { RosterEntry, RosterFilter } from "@/lib/roster";
import { useSession, type Person } from "@/lib/session";
import { AddPersonForm } from "./add-person-form";
import { BulkAddForm } from "./bulk-add-form";
import { CodeSheet, type Batch } from "./code-sheet";
import { CodeCard, type Issued } from "./code-card";
import { RosterList } from "./roster-list";

/** /alunos: only a school admin gets past the door. */
export function AdminPage() {
  const session = useSession();
  if (session.status === "loading") return <p className="text-muted">Carregando…</p>;
  if (session.status === "signed-out" || session.person.role !== "admin") {
    return (
      <div className="card desktop:max-w-[36rem]">
        <h1 className="text-[1.5rem] font-bold">Só para a secretaria</h1>
        <p className="text-muted">Esta página é para quem cuida dos alunos e dos códigos de acesso da escola.</p>
        <Link href="/" className="font-bold text-primary underline underline-offset-[3px]">
          Voltar para as aulas
        </Link>
      </div>
    );
  }
  return <AdminHome person={session.person} />;
}

function AdminHome({ person }: { person: Person }) {
  const { data, error } = useData(person);
  const turmas = data?.turmas ?? [];
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [filter, setFilter] = useState<RosterFilter>("all");

  // Bumped to reload the list: after every change and when the admin comes back to the app.
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await loadRoster();
        if (cancelled) return;
        setRoster(next);
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    // Devices and alerts change as people sign in.
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const filterTurma = turmas.some((t) => t.id === filter) ? filter : null;

  // Wait for the turmas, so nobody is added "Sem turma" just because the list was still loading.
  if (!data) {
    return (
      <p className={error ? "msg-err" : "text-muted"}>
        {error ? "Não deu para carregar as turmas. Confira a internet." : "Carregando…"}
      </p>
    );
  }

  return (
    <>
      <h1 className="text-[1.75rem] font-bold">Alunos e códigos</h1>
      <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-2 desktop:items-start desktop:gap-6">
        <div className="flex flex-col gap-4">
          {batch && <CodeSheet key={batch.people[0]?.code} batch={batch} onDone={() => setBatch(null)} />}
          {issued && !batch && <CodeCard key={issued.code} issued={issued} onDone={() => setIssued(null)} />}
          <AddPersonForm
            turmas={turmas}
            suggestedTurmaId={filterTurma}
            onAdded={(i) => {
              setBatch(null);
              setIssued(i);
              reload();
            }}
          />
          <BulkAddForm
            turmas={turmas}
            suggestedTurmaId={filterTurma}
            onAdded={(b) => {
              setIssued(null);
              setBatch(b);
              reload();
            }}
          />
        </div>
        <RosterList
          roster={roster}
          loadFailed={loadFailed}
          turmas={turmas}
          filter={filter}
          onFilter={setFilter}
          onIssued={(i) => {
            setBatch(null);
            setIssued(i);
          }}
          onRemoved={(id) => {
            setIssued((i) => (i?.personId === id ? null : i));
            setBatch((b) => (b ? { ...b, people: b.people.filter((p) => p.id !== id) } : b));
          }}
          onChanged={reload}
        />
      </div>
    </>
  );
}
