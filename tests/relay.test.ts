import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createRelayServer } from "../lib/ai/relay-server";
import { relayAddress } from "../lib/relay-address";

test("phone pairing rejects non-tunnel destinations and URL credentials", () => {
  assert.equal(
    relayAddress("https://example.trycloudflare.com/"),
    "https://example.trycloudflare.com",
  );
  for (const url of [
    "http://example.trycloudflare.com",
    "https://example.com",
    "https://example.trycloudflare.com.evil.com",
    "https://user:pass@example.trycloudflare.com",
    "https://example.trycloudflare.com/api/chat",
    "https://example.trycloudflare.com/?token=secret",
  ])
    assert.throws(() => relayAddress(url));
});

test("laptop bridge requires auth, validates input, blocks raw Ollama, and serializes inference", async () => {
  const token = "a".repeat(64),
    origin = "https://flirt-pilot-lake.vercel.app";
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = "ollama";
  const server = createRelayServer(token, origin, async () => {
    calls++;
    await gate;
    return { status: "boundary", message: "Respect their boundary." };
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Origin: origin,
    "Content-Type": "application/json",
  };
  try {
    assert.equal(
      (await fetch(url + "/api/reply", { method: "POST" })).status,
      401,
    );
    assert.equal(
      (
        await fetch(url + "/api/reply", {
          method: "POST",
          headers: { ...headers, Origin: "https://evil.com" },
        })
      ).status,
      403,
    );
    assert.equal(
      (await fetch(url + "/api/chat", { method: "POST", headers })).status,
      404,
    );
    const cors = await fetch(url + "/api/reply", {
      method: "OPTIONS",
      headers: { Origin: origin },
    });
    assert.equal(cors.status, 204);
    assert.equal(cors.headers.get("access-control-allow-origin"), origin);
    for (const body of [
      "invalid",
      JSON.stringify({ message: "hey", adultConfirmed: false, context: {} }),
    ])
      assert.equal(
        (await fetch(url + "/api/reply", { method: "POST", headers, body }))
          .status,
        400,
      );
    assert.equal(
      (
        await fetch(url + "/api/reply", {
          method: "POST",
          headers,
          body: "a".repeat(13000),
        })
      ).status,
      413,
    );
    const body = JSON.stringify({
      message: "hey",
      adultConfirmed: true,
      context: {},
    });
    const pending = fetch(url + "/api/reply", {
      method: "POST",
      headers,
      body,
    });
    while (calls === 0) await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(
      (await fetch(url + "/api/reply", { method: "POST", headers, body }))
        .status,
      429,
    );
    release();
    assert.equal((await pending).status, 200);
    assert.equal(calls, 1);
  } finally {
    release();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (previous === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = previous;
  }
});
