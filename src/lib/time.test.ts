import assert from "node:assert/strict";
import { test } from "node:test";
import { addWeeks, dayKey, parseDateTimeInput, tomorrowInputValue, zonedParts } from "./time.ts";

test("date and time inputs are read as São Paulo wall time", () => {
  assert.equal(parseDateTimeInput("2026-10-01", "19:00"), Date.parse("2026-10-01T22:00:00Z"));
  assert.equal(parseDateTimeInput("2026-12-31", "23:30"), Date.parse("2027-01-01T02:30:00Z"));
});

test("invalid dates and times are rejected", () => {
  assert.equal(parseDateTimeInput("2026-02-31", "19:00"), null);
  assert.equal(parseDateTimeInput("2026-13-01", "19:00"), null);
  assert.equal(parseDateTimeInput("2026-10-01", "24:00"), null);
  assert.equal(parseDateTimeInput("", "19:00"), null);
  assert.equal(parseDateTimeInput("2026-10-01", ""), null);
});

test("zonedParts and dayKey use the school's calendar day", () => {
  const lateEvening = Date.parse("2026-09-29T02:30:00Z"); // 23:30 on 28 Sep in São Paulo
  assert.equal(dayKey(lateEvening), "2026-09-28");
  const p = zonedParts(lateEvening);
  assert.deepEqual([p.hour, p.minute, p.weekday], [23, 30, 1]);
});

test("addWeeks keeps the wall-clock time", () => {
  const start = Date.parse("2026-10-01T22:00:00Z");
  assert.equal(addWeeks(start, 0), start);
  assert.equal(addWeeks(start, 3), Date.parse("2026-10-22T22:00:00Z"));
  // Across a month and year boundary.
  assert.equal(addWeeks(Date.parse("2026-12-24T22:00:00Z"), 2), Date.parse("2027-01-07T22:00:00Z"));
});

test("tomorrow follows the São Paulo date, not UTC", () => {
  assert.equal(tomorrowInputValue(Date.parse("2026-09-29T02:30:00Z")), "2026-09-29");
  assert.equal(tomorrowInputValue(Date.parse("2026-12-31T12:00:00Z")), "2027-01-01");
});
