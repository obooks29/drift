import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import "dotenv/config";

import { agentsRouter } from "./routes/agents";
import { ledgerRouter } from "./routes/ledger";
import { consentRouter } from "./routes/consent";
import { apexRouter } from "./routes/apex";
import { authHook } from "./middleware/auth";

async function main() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    trustProxy: true,
  });

  await app.register(cors, {
    origin: [
      process.env.PORTAL_URL ?? "http://localhost:3000",
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
    reply.code(statusCode).send({
      error: error.message,
      code,
      statusCode,
    });
  });

  const port = parseInt(process.env.PORT ?? "4000");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`⬡ Drift API v0.2.0 — port ${port}`);
  console.log(`  Apex: active`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});