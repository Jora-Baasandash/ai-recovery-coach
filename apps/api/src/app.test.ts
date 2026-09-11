import assert from "node:assert/strict";
import { after, test } from "node:test";
import "./test/setup.js";
import { createTestApp } from "./test/app-harness.js";

const app = await createTestApp();

after(async () => {
  await app.close();
});

test("GET /health returns ok", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok", service: "api" });
});
