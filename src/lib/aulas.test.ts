import assert from "node:assert/strict";
import { test } from "node:test";
import { isLive, isOver, resolveOverlaps, studentView, teacherList, type Aula } from "./aulas.ts";

const MIN = 60_000;
const T = Date.parse("2026-10-01T22:00:00Z");

function aula(p: Partial<Aula>): Aula {
  return {
    id: "a",
    turmaId: "t1",
    type: "scheduled",
    title: "",
    startAt: T,
    durationMin: 60,
    meetLink: "https://meet.google.com/abc-defg-hij",
    status: "scheduled",
    pingAt: null,
    ...p,
  };
}

test("scheduled class opens 10 minutes before and closes at the end", () => {
  const a = aula({});
  assert.equal(isLive(a, T - 10 * MIN - 1), false);
  assert.equal(isLive(a, T - 10 * MIN), true);
  assert.equal(isLive(a, T + 59 * MIN), true);
  assert.equal(isLive(a, T + 60 * MIN), false);
  assert.equal(isOver(a, T + 60 * MIN), true);
});

test("lightning class is live from its start, not before", () => {
  const a = aula({ type: "lightning", status: "live" });
  assert.equal(isLive(a, T - MIN), false);
  assert.equal(isLive(a, T), true);
});

test("an ended class is never live", () => {
  const a = aula({ status: "ended" });
  assert.equal(isLive(a, T), false);
  assert.equal(isOver(a, T - 30 * MIN), true);
});

test("a scheduled class opening ends a live lightning class of the same turma", () => {
  const aulas = [
    aula({ id: "flash", type: "lightning", status: "live", startAt: T - 15 * MIN }),
    aula({ id: "sched", startAt: T }),
    aula({ id: "other", type: "lightning", status: "live", startAt: T - 15 * MIN, turmaId: "t2" }),
  ];
  const before = resolveOverlaps(aulas, T - 10 * MIN - 1);
  assert.equal(before.find((a) => a.id === "flash")?.status, "live");
  const after = resolveOverlaps(aulas, T - 10 * MIN);
  assert.equal(after.find((a) => a.id === "flash")?.status, "ended");
  assert.equal(after.find((a) => a.id === "other")?.status, "live", "other turmas are untouched");
  assert.equal(studentView(aulas.slice(0, 2), T - 5 * MIN).live?.id, "sched", "the student sees one button");
});

test("a lightning class started after the scheduled class opened stays live", () => {
  const aulas = [aula({ id: "sched", startAt: T }), aula({ id: "flash", type: "lightning", status: "live", startAt: T + 5 * MIN })];
  assert.equal(resolveOverlaps(aulas, T + 6 * MIN).find((a) => a.id === "flash")?.status, "live");
  assert.equal(studentView(aulas, T + 6 * MIN).live?.id, "flash", "the newest class wins");
});

test("teacher list hides classes that ended more than a day ago", () => {
  const aulas = [aula({ id: "old", startAt: T - 2 * 24 * 60 * MIN }), aula({ id: "recent", startAt: T - 2 * 60 * MIN })];
  assert.deepEqual(
    teacherList(aulas, "t1", T).map((a) => a.id),
    ["recent"],
  );
});
