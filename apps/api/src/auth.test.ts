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

test("POST /auth/register creates a user and sets a cookie", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "Alex@example.com", password: "password12" },
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.json(), {
    user: { id: response.json().user.id, email: "alex@example.com" },
  });
  assert.ok(response.cookies.some((cookie) => cookie.name === "access_token"));
});

test("POST /auth/register rejects a duplicate email", async () => {
  const payload = { email: "alex@example.com", password: "password12" };
  await app.inject({ method: "POST", url: "/auth/register", payload });

  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload,
  });

  assert.equal(response.statusCode, 409);
});

test("POST /auth/login accepts the password and rejects a bad one", async () => {
  await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "alex@example.com", password: "password12" },
  });

  const ok = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "alex@example.com", password: "password12" },
  });
  assert.equal(ok.statusCode, 200);

  const bad = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "alex@example.com", password: "wrong-pass" },
  });
  assert.equal(bad.statusCode, 401);
});

test("GET /auth/me returns the current user", async () => {
  const registered = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "alex@example.com", password: "password12" },
  });

  const me = await app.inject({
    method: "GET",
    url: "/auth/me",
    cookies: authCookie(registered),
  });

  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.email, "alex@example.com");
});
