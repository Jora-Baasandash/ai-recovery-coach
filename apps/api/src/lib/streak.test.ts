import assert from "node:assert/strict";
import { test } from "node:test";
import { computeCheckInStreak } from "./streak.js";

test("streak is 0 when there are no check-ins", () => {
  assert.equal(computeCheckInStreak([], "2026-09-11"), 0);
});

test("streak is 0 when the last check-in is older than yesterday", () => {
  assert.equal(computeCheckInStreak(["2026-09-08"], "2026-09-11"), 0);
});

test("streak counts today and previous consecutive days", () => {
  assert.equal(
    computeCheckInStreak(["2026-09-11", "2026-09-10", "2026-09-09"], "2026-09-11"),
    3,
  );
});

test("streak still counts if today is missing but yesterday is present", () => {
  assert.equal(
    computeCheckInStreak(["2026-09-10", "2026-09-09"], "2026-09-11"),
    2,
  );
});

test("a gap breaks the streak", () => {
  assert.equal(
    computeCheckInStreak(["2026-09-11", "2026-09-09"], "2026-09-11"),
    1,
  );
});
