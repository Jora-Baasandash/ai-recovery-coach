import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import "./test/setup.js";
import { authCookie, createTestApp, resetDatabase } from "./test/app-harness.js";

const app = await createTestApp();

beforeEach(async () => {
  await resetDatabase(app);
});

after(async () => {
  await app.close();
});

async function registerAndCheckIn() {
  const registered = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "alex@example.com", password: "password12" },
  });
  const cookies = authCookie(registered);
  const checkIn = await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: {
      occurredOn: "2026-09-12",
      urgeIntensity: 4,
      actedOnUrge: false,
      trigger: "late night",
      note: "this note must not be required by the LLM",
    },
  });

  return { cookies, checkInId: checkIn.json().id as string };
}

test("POST /check-ins/:id/insight returns a structured fake insight", async () => {
  const { cookies, checkInId } = await registerAndCheckIn();

  const response = await app.inject({
    method: "POST",
    url: `/check-ins/${checkInId}/insight`,
    cookies,
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().promptVersion, "insight-v1");
  assert.equal(response.json().model, "fake-insight");
  assert.ok(response.json().output.pattern);
  assert.ok(response.json().output.suggestedAction);
  assert.ok(response.json().disclaimer.includes("not medical"));
});

test("POST /check-ins/:id/insight is idempotent for a successful insight", async () => {
  const { cookies, checkInId } = await registerAndCheckIn();

  const first = await app.inject({
    method: "POST",
    url: `/check-ins/${checkInId}/insight`,
    cookies,
  });
  const second = await app.inject({
    method: "POST",
    url: `/check-ins/${checkInId}/insight`,
    cookies,
  });

  assert.equal(first.statusCode, 201);
  assert.equal(second.statusCode, 200);
  assert.equal(second.json().id, first.json().id);
});

test("GET /insights/latest returns the newest successful insight", async () => {
  const { cookies, checkInId } = await registerAndCheckIn();
  await app.inject({
    method: "POST",
    url: `/check-ins/${checkInId}/insight`,
    cookies,
  });

  const latest = await app.inject({
    method: "GET",
    url: "/insights/latest",
    cookies,
  });

  assert.equal(latest.statusCode, 200);
  assert.equal(latest.json().sourceCheckInId, checkInId);
});

test("POST /check-ins/:id/insight skips the LLM when crisis language is present", async () => {
  const registered = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "sam@example.com", password: "password12" },
  });
  const cookies = authCookie(registered);
  const checkIn = await app.inject({
    method: "POST",
    url: "/check-ins",
    cookies,
    payload: {
      occurredOn: "2026-09-13",
      urgeIntensity: 9,
      actedOnUrge: false,
      trigger: "want to die",
    },
  });

  const response = await app.inject({
    method: "POST",
    url: `/check-ins/${checkIn.json().id}/insight`,
    cookies,
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().status, "skipped_safety");
  assert.equal(response.json().model, "none");
  assert.ok(response.json().output.suggestedAction.includes("988"));
});
