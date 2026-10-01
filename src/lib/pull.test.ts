import assert from "node:assert/strict";
import { test } from "node:test";
import { PULL_READY, pullProgress } from "./pull.ts";

test("pulling up or not at all does nothing", () => {
  assert.deepEqual(pullProgress(0), { offset: 0, ready: false });
  assert.deepEqual(pullProgress(-40), { offset: 0, ready: false });
});

test("a short pull moves the indicator with resistance but does not refresh", () => {
  assert.deepEqual(pullProgress(60), { offset: 30, ready: false });
  assert.equal(pullProgress(PULL_READY * 2 - 2).ready, false);
});

test("a long enough pull refreshes, and the indicator stops at a cap", () => {
  assert.equal(pullProgress(PULL_READY * 2).ready, true);
  assert.deepEqual(pullProgress(1000), { offset: 96, ready: true });
});
