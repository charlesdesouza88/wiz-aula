import assert from "node:assert/strict";
import { test } from "node:test";
import { codeMessage, filterRoster, parseNames, roleLabel, statusLabel, type RosterEntry } from "./roster.ts";

const entry = (over: Partial<RosterEntry>): RosterEntry => ({
  id: "x",
  name: "X",
  role: "student",
  turmaIds: [],
  hasCode: true,
  devices: 0,
  alerts: 0,
  ...over,
});

test("status agrees in number and mentions alerts", () => {
  assert.equal(statusLabel({ hasCode: true, devices: 0, alerts: 0 }), "Ainda não entrou");
  assert.equal(statusLabel({ hasCode: true, devices: 1, alerts: 0 }), "Entrou em 1 aparelho");
  assert.equal(statusLabel({ hasCode: true, devices: 2, alerts: 1 }), "Entrou em 2 aparelhos · avisos ligados");
  assert.equal(statusLabel({ hasCode: false, devices: 0, alerts: 0 }), "Sem código");
});

test("role labels", () => {
  assert.equal(roleLabel("student"), "Aluno");
  assert.equal(roleLabel("teacher"), "Professor");
  assert.equal(roleLabel("admin"), "Secretaria");
});

test("filters by turma, staff and students without a turma, sorted by name", () => {
  const people = [
    entry({ id: "1", name: "Óscar", turmaIds: ["t1"] }),
    entry({ id: "2", name: "ana", turmaIds: ["t1", "t2"] }),
    entry({ id: "3", name: "Bia" }),
    entry({ id: "4", name: "Chuck", role: "teacher" }),
    entry({ id: "5", name: "Secretaria", role: "admin" }),
  ];
  const ids = (f: string) => filterRoster(people, f).map((e) => e.id);
  assert.deepEqual(ids("t1"), ["2", "1"]); // accents do not push Óscar to the end
  assert.deepEqual(ids("t2"), ["2"]);
  assert.deepEqual(ids("no-turma"), ["3"]);
  assert.deepEqual(ids("teachers"), ["4", "5"]);
  assert.deepEqual(ids("all"), ["2", "3", "4", "1", "5"]);
});

test("the code message greets by first name", () => {
  assert.equal(
    codeMessage("  Maria Souza ", "WIZ-7KQ9-M3XP", "https://wiz-aula.vercel.app"),
    "Olá, Maria! Seu código do Wiz Aula é WIZ-7KQ9-M3XP. Abra https://wiz-aula.vercel.app e digite o código para entrar nas aulas.",
  );
});

test("pasted names: one per line, blanks and repeats dropped, whole rows keep the name cell", () => {
  assert.deepEqual(parseNames("Maria  Souza\r\n\n  João\nmaria souza\n"), ["Maria Souza", "João"]);
  assert.deepEqual(parseNames("Chuck\tMasters\tAdults Book 4\t19:00\tAna Lima\t\n"), ["Ana Lima"]);
  assert.deepEqual(parseNames("   \n\t\n"), []);
});
