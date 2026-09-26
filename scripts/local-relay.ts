import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createRelayServer } from "../lib/ai/relay-server";

// Deliberately do not load .env.local: the bridge must never receive cloud keys.
process.env.AI_PROVIDER = "ollama";
process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
delete process.env.AI_API_KEY;
mkdirSync("work", { recursive: true });
const path = "work/relay-token.txt";
const token = existsSync(path)
  ? readFileSync(path, "utf8").trim()
  : randomBytes(32).toString("hex");
if (!existsSync(path)) writeFileSync(path, token, { mode: 0o600 });
const server = createRelayServer(token, "https://flirt-pilot-lake.vercel.app");
server.requestTimeout = 200000;
server.headersTimeout = 10000;
server.listen(8788, "127.0.0.1", () =>
  console.log(
    "Authenticated FlirtPilot bridge listening on loopback port 8788.",
  ),
);
