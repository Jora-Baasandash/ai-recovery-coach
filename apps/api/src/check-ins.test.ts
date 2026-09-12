import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import "./test/setup.js";
import { shiftUtcDate, utcToday } from "./lib/dates.js";
import { authCookie, createTestApp, resetDatabase } from "./test/app-harness.js";

const app = await createTestApp();

beforeEach(async () => {
  await resetDatabase(app);
});

after(async () => {
  await app.close();
});

async function register() {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "alex@example.com", password: "password12" },
  });
  return authCookie(response);
}

test("POST /check-ins requires auth", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/check-ins",
    payload: { urgeIntensity: 4, actedOnUrge: false },
  });

  assert.equal(response.statusCode, 401);
});

test("POST /check-ins stores one row and rejects a second for the same day", async () => {
  const cookies = await register();

  const created = await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: {
      occurredOn: "2026-09-11",
      urgeIntensity: 4,
      actedOnUrge: false,
      trigger: "late night",
    },
  });

  assert.equal(created.statusCode, 201);
  assert.equal(created.json().occurredOn, "2026-09-11");
  assert.equal(created.json().urgeIntensity, 4);
  assert.equal(created.json().actedOnUrge, false);

  const duplicate = await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: {
      occurredOn: "2026-09-11",
      urgeIntensity: 1,
      actedOnUrge: true,
    },
  });

  assert.equal(duplicate.statusCode, 409);
});

test("GET /check-ins returns only the current user's rows", async () => {
  const cookies = await register();
  await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: { occurredOn: "2026-09-10", urgeIntensity: 2, actedOnUrge: false },
  });

  const other = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "other@example.com", password: "password12" },
  });

  const list = await app.inject({
    method: "GET",
    url: "/check-ins",
    cookies,
  });

  assert.equal(list.statusCode, 200);
  assert.equal(list.json().checkIns.length, 1);
  assert.equal(list.json().checkIns[0].occurredOn, "2026-09-10");
  assert.ok(other.statusCode === 201);
});

test("GET /check-ins/stats uses SQL aggregates and a check-in streak", async () => {
  const cookies = await register();
  const today = utcToday();
  const yesterday = shiftUtcDate(today, -1);
  const outsideWindow = shiftUtcDate(today, -8);

  await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: { occurredOn: today, urgeIntensity: 4, actedOnUrge: false },
  });
  await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: { occurredOn: yesterday, urgeIntensity: 6, actedOnUrge: true },
  });
  await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: { occurredOn: outsideWindow, urgeIntensity: 10, actedOnUrge: true },
  });

  const response = await app.inject({
    method: "GET",
    url: "/check-ins/stats",
    cookies,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    totalCheckIns: 3,
    checkInStreak: 2,
    last7AverageUrge: 5,
    last7ActedOnUrge: 1,
    last7DidNotAct: 1,
  });
});
