import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";

// dotenv removed: Vercel injects env vars automatically in all environments.
// For local dev, use a .env file loaded by your dev script (e.g. dotenv-cli or
// `node --env-file=.env`), or keep dotenv in devDependencies and load it only
// outside of the Vercel runtime (see bottom of this file).

import { agentsRouter } from "./routes/agents";
import { ledgerRouter } from "./routes/ledger";
import { consentRouter } from "./routes/consent";
import { apexRouter } from "./routes/apex";
import { authHook } from "./middleware/auth";

// Build the Fastify app once and reuse it across warm invocations.
// We do NOT call app.listen() here — Vercel is serverless and has no persistent port.
const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  trustProxy: true,
});

async function buildApp() {
  await app.register(cors, {
    origin: [
      process.env.PORTAL_URL ?? "http://localhost:3000",
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(jwt, {
    secret: process.env.DRIFT_ENCRYPTION_KEY ?? "dev-secret",
  });

  await app.register(websocket);

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
  });

  app.addHook("preHandler", async (req, reply) => {
    if (
      req.url.startsWith("/health") ||
      req.url.includes("/webhook/") ||
      req.method === "OPTIONS"
    ) return;
    await authHook(req, reply);
  });

  await app.register(agentsRouter,  { prefix: "/v1/agents" });
  await app.register(ledgerRouter,  { prefix: "/v1/ledger" });
  await app.register(consentRouter, { prefix: "/v1/consent" });
  await app.register(apexRouter,    { prefix: "/v1/apex" });

  app.get("/health", async () => ({
    status: "ok",
    version: "0.2.0",
    timestamp: new Date().toISOString(),
  }));

  app.setErrorHandler((error, _req, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const code = (error as { code?: string }).code ?? "INTERNAL_ERROR";
    reply.code(statusCode).send({ error: error.message, code, statusCode });
  });

  return app;
}

// ─── Vercel serverless handler ───────────────────────────────────────────────
// Vercel calls this export for every incoming request.
// `app.ready()` is idempotent — safe to call on every warm invocation.

let ready = false;

export default async function handler(
  req: Parameters<typeof app.server.emit>[1],
  res: Parameters<typeof app.server.emit>[2]
) {
  if (!ready) {
    await buildApp();
    await app.ready();
    ready = true;
  }
  app.server.emit("request", req, res);
}

// ─── Local development ───────────────────────────────────────────────────────
// `vercel dev` sets VERCEL=1, so this block is skipped there too.

if (!process.env.VERCEL) {
  // Load .env only in local Node — keep dotenv in devDependencies.
  // If dotenv isn't installed, this silently continues without it.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv/config");
  } catch { /* not installed — env vars must be set manually */ }

  buildApp().then(async (server) => {
    await server.ready();
    const port = parseInt(process.env.PORT ?? "4000");
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`⬡ Drift API v0.2.0 — port ${port}`);
    console.log(`  Apex: active`);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}