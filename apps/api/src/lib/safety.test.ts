import assert from "node:assert/strict";
import { test } from "node:test";
import { looksLikeCrisis } from "./safety.js";

test("ordinary check-in text is not treated as crisis", () => {
  assert.equal(looksLikeCrisis("late night", "felt restless"), false);
});

test("empty text is not treated as crisis", () => {
  assert.equal(looksLikeCrisis(null, undefined, ""), false);
});

test("crisis language in trigger or note is detected", () => {
  assert.equal(looksLikeCrisis("want to die"), true);
  assert.equal(looksLikeCrisis(null, "thoughts of suicide"), true);
});
