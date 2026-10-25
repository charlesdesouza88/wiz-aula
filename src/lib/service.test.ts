import assert from "node:assert/strict";
import { test } from "node:test";
import { bannerText, isServerTrouble, troubleText } from "./service.ts";

test("network failures and server errors are trouble", () => {
  // What supabase-js returns when the request never reaches the server.
  assert.equal(isServerTrouble({ message: "TypeError: Failed to fetch", code: "", httpStatus: 0 }), true);
  assert.equal(isServerTrouble({ message: "TypeError: Load failed", code: "" }), true); // Safari
  assert.equal(isServerTrouble({ message: "NetworkError when attempting to fetch resource." }), true); // Firefox
  assert.equal(isServerTrouble({ name: "AuthRetryableFetchError", message: "x", status: 0 }), true);
  assert.equal(isServerTrouble({ message: "Project paused", httpStatus: 540 }), true);
  assert.equal(isServerTrouble({ message: "Bad gateway", status: 502 }), true);
  assert.equal(isServerTrouble({ code: "PGRST001", message: "Could not connect" }), true);
});

test("refusals are not trouble", () => {
  assert.equal(isServerTrouble({ message: "too_many_attempts", code: "P0001", httpStatus: 400 }), false);
  assert.equal(isServerTrouble({ message: "new row violates row-level security policy", code: "42501", httpStatus: 403 }), false);
  assert.equal(isServerTrouble({ name: "AuthApiError", message: "Anonymous sign-ins are disabled", status: 422 }), false);
  assert.equal(isServerTrouble(null), false);
  assert.equal(isServerTrouble("boom"), false);
});

test("messages name the real cause", () => {
  assert.match(troubleText("down", "salvar"), /^Não deu para salvar: o Wiz Aula está fora do ar/);
  assert.match(troubleText("offline", "entrar"), /sem internet/);
  assert.equal(troubleText("ok", "excluir"), "Não deu para excluir agora. Tente de novo.");
  assert.doesNotMatch(bannerText("down").text, /internet\.$/);
  assert.match(bannerText("down").text, /não é no seu aparelho nem na sua internet/);
  assert.equal(bannerText("offline").title, "Você está sem internet");
});
