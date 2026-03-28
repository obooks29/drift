/**
 * Authentication Middleware
 * Validates JWT from Auth0 on all protected routes.
 * Also validates Drift API keys for SDK usage.
 */
import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../lib/prisma";
import { verifyTrustCertificate } from "../lib/trust-certificate";

/** Extract org ID from API key */
async function resolveOrgFromApiKey(apiKey: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({ where: { apiKey } });
  return org?.id ?? null;
}

/** Main auth hook — supports Bearer JWT (portal) and API Key (SDK) */
export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({ error: "Missing Authorization header", code: "MISSING_AUTH" });
  }

  // API Key auth: "Bearer drift_pk_..."
  if (authHeader.startsWith("Bearer drift_")) {
    const apiKey = authHeader.replace("Bearer ", "");
    const orgId = await resolveOrgFromApiKey(apiKey);
    if (!orgId) return reply.code(401).send({ error: "Invalid API key", code: "INVALID_API_KEY" });
    (request as FastifyRequest & { orgId: string }).orgId = orgId;
    return;
  }

  // Auth0 JWT auth — verify via jwt plugin
  try {
    await request.jwtVerify();
    // Extract org from JWT claims
    const payload = request.user as Record<string, string>;
    const orgId = payload["drift/org_id"] ?? payload.sub;
    (request as FastifyRequest & { orgId: string }).orgId = orgId;
  } catch {
    return reply.code(401).send({ error: "Invalid token", code: "INVALID_TOKEN" });
  }
}

/** Agent trust certificate validation */
export async function validateTrustCert(request: FastifyRequest, reply: FastifyReply) {
  const certHeader = request.headers["x-drift-trust-cert"] as string | undefined;
  const agentIdParam = (request.params as Record<string, string>).id;

  if (!certHeader || !agentIdParam) return; // Optional check

  const orgId = (request as FastifyRequest & { orgId?: string }).orgId;
  if (!orgId) return;

  const payload = await verifyTrustCertificate(certHeader, orgId);
  if (!payload || payload.agentId !== agentIdParam) {
    return reply.code(403).send({ error: "Invalid trust certificate", code: "INVALID_TRUST_CERT" });
  }
}

/** Log stream webhook validation */
export async function validateWebhookSignature(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers["x-drift-webhook-signature"] as string;
  const expected = process.env.DRIFT_WEBHOOK_SECRET;
  if (!expected || signature !== expected) {
    return reply.code(401).send({ error: "Invalid webhook signature" });
  }
}
