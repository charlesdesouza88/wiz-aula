import assert from "node:assert/strict";
import { test } from "node:test";
import { isLive, isOver, lightningToReplace, studentView, teacherList, type Aula } from "./aulas.ts";

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

test("only live lightning classes of the same turma are replaced", () => {
  const aulas = [
    aula({ id: "l1", type: "lightning", status: "live" }),
    aula({ id: "l2", type: "lightning", status: "ended" }),
    aula({ id: "s1" }),
    aula({ id: "l3", type: "lightning", status: "live", turmaId: "t2" }),
  ];
  assert.deepEqual(
    lightningToReplace(aulas, "t1", T + MIN).map((a) => a.id),
    ["l1"],
  );
});

test("student view: latest live class wins, upcoming sorted", () => {
  const aulas = [
    aula({ id: "later", startAt: T + 7 * 24 * 60 * MIN }),
    aula({ id: "now", startAt: T }),
    aula({ id: "flash", type: "lightning", status: "live", startAt: T + 5 * MIN }),
    aula({ id: "soon", startAt: T + 2 * 24 * 60 * MIN }),
  ];
  const v = studentView(aulas, "t1", T + 6 * MIN);
  assert.equal(v.live?.id, "flash");
  assert.deepEqual(
    v.upcoming.map((a) => a.id),
    ["soon", "later"],
  );
  assert.deepEqual(studentView([], "t1", T), { live: null, upcoming: [] });
});

test("teacher list hides classes that ended more than a day ago", () => {
  const aulas = [aula({ id: "old", startAt: T - 2 * 24 * 60 * MIN }), aula({ id: "recent", startAt: T - 2 * 60 * MIN })];
  assert.deepEqual(
    teacherList(aulas, "t1", T).map((a) => a.id),
    ["recent"],
  );
});
