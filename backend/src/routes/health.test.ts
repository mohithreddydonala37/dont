import assert from "node:assert/strict";
import test from "node:test";

test("GET /api/health returns an ok status", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../server.js");
  const app = createApp();
  const server = app.listen();

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
