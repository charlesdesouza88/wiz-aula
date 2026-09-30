import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCountdown, formatDay, formatTime } from "./format.ts";

const MIN = 60_000;

test("countdown agrees in number", () => {
  assert.equal(formatCountdown(1 * MIN), "Falta 1 minuto");
  assert.equal(formatCountdown(5 * MIN), "Faltam 5 minutos");
  assert.equal(formatCountdown(10_000), "Falta 1 minuto"); // rounds up, never "0 minutos"
  assert.equal(formatCountdown(-5 * MIN), "Falta 1 minuto");
  assert.equal(formatCountdown(60 * MIN), "Falta 1 hora");
  assert.equal(formatCountdown(125 * MIN), "Faltam 2 horas e 5 minutos");
  assert.equal(formatCountdown(61 * MIN), "Falta 1 hora e 1 minuto");
  assert.equal(formatCountdown(24 * 60 * MIN), "Falta 1 dia");
  assert.equal(formatCountdown(3 * 24 * 60 * MIN + 60 * MIN), "Faltam 3 dias e 1 hora");
});

test("time is shown in São Paulo time", () => {
  assert.equal(formatTime(Date.parse("2026-10-01T22:00:00Z")), "19:00");
});

test("day labels", () => {
  const now = Date.parse("2026-09-29T01:00:00Z"); // 22:00 Monday 28 Sep in São Paulo
  assert.equal(formatDay(Date.parse("2026-09-29T02:30:00Z"), now), "Hoje");
  assert.equal(formatDay(Date.parse("2026-09-29T22:00:00Z"), now), "Amanhã");
  assert.equal(formatDay(Date.parse("2026-10-01T22:00:00Z"), now), "Quinta-feira, 1 de outubro");
});
