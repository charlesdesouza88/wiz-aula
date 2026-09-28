import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMeetLink, shortMeetLink } from "./meet.ts";

const CANONICAL = "https://meet.google.com/abc-defg-hij";

test("accepts every documented input form", () => {
  for (const input of [
    "https://meet.google.com/abc-defg-hij",
    "http://meet.google.com/abc-defg-hij",
    "meet.google.com/abc-defg-hij",
    "https://meet.google.com/abc-defg-hij?authuser=0&hs=122",
    "https://meet.google.com/abc-defg-hij#x",
    "https://meet.google.com/abc-defg-hij/",
    "abc-defg-hij",
    "abcdefghij",
    "ABC-DEFG-HIJ",
    "  abc-defg-hij \n",
  ]) {
    assert.equal(normalizeMeetLink(input), CANONICAL, input);
  }
});

test("rejects anything that is not a Meet code", () => {
  for (const input of [
    "",
    "abc-defg-hi",
    "abc-defg-hijk",
    "abc-d3fg-hij",
    "https://zoom.us/j/123",
    "https://meet.google.com/",
    "https://meet.google.com/lookup/abcdefghij",
    "https://evil.com/meet.google.com/abc-defg-hij",
    "https://meet.google.com.evil.com/abc-defg-hij",
  ]) {
    assert.equal(normalizeMeetLink(input), null, input);
  }
});

test("shortMeetLink drops the scheme", () => {
  assert.equal(shortMeetLink(CANONICAL), "meet.google.com/abc-defg-hij");
});
