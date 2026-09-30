import assert from "node:assert/strict";
import { test } from "node:test";
import { alertsState, base64UrlToBytes, type AlertsEnv } from "./alerts.ts";

const ready: AlertsEnv = {
  configured: true,
  device: "android",
  standalone: false,
  hasPush: true,
  permission: "default",
  subscribed: false,
};

test("android in the browser can turn alerts on straight away", () => {
  assert.equal(alertsState(ready), "off");
  assert.equal(alertsState({ ...ready, permission: "granted", subscribed: true }), "on");
  assert.equal(alertsState({ ...ready, permission: "granted", subscribed: false }), "off", "re-subscribe after a reinstall");
  assert.equal(alertsState({ ...ready, permission: "denied" }), "blocked");
});

test("iPhone and iPad must be opened from the Home Screen icon first", () => {
  for (const device of ["iphone", "ipad"] as const) {
    assert.equal(alertsState({ ...ready, device, standalone: false }), "install-first");
    assert.equal(alertsState({ ...ready, device, standalone: true }), "off");
    // iOS older than 16.4, even when installed.
    assert.equal(alertsState({ ...ready, device, standalone: true, hasPush: false, permission: "unsupported" }), "unsupported");
  }
});

test("nothing is offered before push is configured", () => {
  assert.equal(alertsState({ ...ready, configured: false }), "not-configured");
});

test("computers without push support are told so", () => {
  assert.equal(alertsState({ ...ready, device: "pc", hasPush: false, permission: "unsupported" }), "unsupported");
});

test("VAPID keys decode from base64url", () => {
  assert.deepEqual([...base64UrlToBytes("AQID_-8")], [1, 2, 3, 255, 239]);
});
