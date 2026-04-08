/**
 * Consent Service — Phase 2
 * Full CIBA flow + Prisma ConsentChain persistence
 */
import prisma from "../lib/prisma";
import { getAuth0Client } from "../lib/auth0-management";
import { signConsentRecord, verifyChain, getChainTip } from "../lib/consent-chain-crypto";
import { generateId } from "./helpers";
import { randomBytes } from "crypto";

export class ConsentService {

  /** ── Initiate CIBA ───────────────────────────────── */
  async initiateCIBA(opts: {
    agentId: string;
    action: string;
    description: string;
    loginHint: string;           // User email
    metadata?: Record<string, unknown>;
  }) {
    const auth0 = getAuth0Client();
    const bindingMessage = `DRIFT-${randomBytes(2).toString("hex").toUpperCase()}`;

    // Call Auth0 CIBA endpoint
    let authReqId: string;
    let expiresIn: number;
    let interval: number;

    try {
      const ciba = await auth0.initiateCIBA({
        loginHint: opts.loginHint,
        scope: `openid approve:action`,
        bindingMessage,
        requestedExpiry: 300,
      });
      authReqId = ciba.authReqId;
      expiresIn = ciba.expiresIn;
      interval = ciba.interval;
    } catch {
      // Fallback: generate a local CIBA request ID for dev/testing
      authReqId = `ciba_dev_${generateId()}`;
      expiresIn = 300;
      interval = 5;
    }

    // Persist to DB
    const id = generateId("ciba");
    const record = await prisma.cIBARequest.create({
      data: {
        id,
        agentId: opts.agentId,
        action: opts.action,
        description: opts.description,
        loginHint: opts.loginHint,
        metadata: opts.metadata as object,
        status: "pending",
        bindingMessage,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        // Store Auth0 auth_req_id in metadata for polling
      },
    });

    return {
      requestId: id,
      agentId: opts.agentId,
      action: opts.action,
      description: opts.description,
      metadata: opts.metadata,
      status: "pending" as const,
      bindingMessage,
      expiresAt: record.expiresAt,
      authReqId,             // Return to caller for polling
      interval,
    };
  }

  /** ── Poll CIBA ───────────────────────────────────── */
  async pollCIBA(requestId: string) {
    const record = await prisma.cIBARequest.findUnique({ where: { id: requestId } });
    if (!record) throw Object.assign(new Error("CIBA request not found"), { statusCode: 404 });

    // Check if expired
    if (record.expiresAt < new Date() && record.status === "pending") {
      await prisma.cIBARequest.update({ where: { id: requestId }, data: { status: "expired", resolvedAt: new Date() } });
      return { ...record, status: "expired" as const };
    }

    return record;
  }

  /** ── Resolve CIBA (approve/reject) ──────────────── */
  async resolveCIBA(requestId: string, decision: "approved" | "rejected", resolvedBy: string) {
    const request = await this.pollCIBA(requestId);
    if (request.status !== "pending") throw Object.assign(new Error(`Request already ${request.status}`), { statusCode: 409 });

    const updated = await prisma.$transaction(async (tx) => {
      // Update CIBA request status
      const u = await tx.cIBARequest.update({
        where: { id: requestId },
        data: { status: decision, resolvedAt: new Date() },
      });

      // If approved, write to consent chain
      if (decision === "approved") {
        const chain = await tx.consentRecord.findMany({
          where: { agentId: request.agentId },
          orderBy: { timestamp: "asc" },
        });
        const tip = getChainTip(chain.map((c) => ({
          id: c.id, agentId: c.agentId, action: c.action,
          approvedBy: c.approvedBy, metadata: c.metadata as Record<string, unknown>,
          timestamp: c.timestamp.toISOString(), previousHash: c.previousHash,
          cibaRequestId: c.cibaRequestId ?? undefined, signature: c.signature,
        })));

        const consentId = generateId("con");
        const record = signConsentRecord({
          id: consentId,
          agentId: request.agentId,
          action: "approve_action",
          approvedBy: resolvedBy,
          metadata: {
            cibaRequestId: requestId,
            originalAction: request.action,
            description: request.description,
            ...(request.metadata as Record<string, unknown> ?? {}),
          },
          timestamp: new Date().toISOString(),
          cibaRequestId: requestId,
          previousHash: tip,
        });

        await tx.consentRecord.create({
          data: {
            id: consentId,
            agentId: request.agentId,
            action: "approve_action",
            approvedBy: resolvedBy,
            metadata: record.metadata,
            cibaRequestId: requestId,
            signature: record.signature,
            previousHash: record.previousHash,
          },
        });
      }

      return u;
    });

    return updated;
  }

  /** ── Wait for CIBA (long-poll) ───────────────────── */
  async waitForCIBA(authReqId: string, requestId: string, intervalSeconds = 5): Promise<{
    status: "approved" | "rejected" | "expired";
    accessToken?: string;
  }> {
    const auth0 = getAuth0Client();
    const deadline = Date.now() + 300_000;
    let pollInterval = intervalSeconds * 1000;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, pollInterval));

      // Poll Auth0 first (real CIBA)
      try {
        const result = await auth0.pollCIBA(authReqId);
        if (result.status !== "pending") {
          // Sync back to DB
          await prisma.cIBARequest.update({
            where: { id: requestId },
            data: { status: result.status, resolvedAt: new Date() },
          });
          return result;
        }
      } catch {
        // Fall through to DB poll (dev mode)
      }

      // Check DB (for manual resolution via portal)
      const dbRecord = await this.pollCIBA(requestId);

      // Narrow: we already know it passed the "pending" gate above,
      // so only return when it has settled into a terminal state.
      if (dbRecord.status !== "pending") {
        const terminalStatus = dbRecord.status as "approved" | "rejected" | "expired";
        return { status: terminalStatus };
      }

      // Back-off: increase interval slightly (max 10s)
      pollInterval = Math.min(pollInterval * 1.1, 10_000);
    }

    await prisma.cIBARequest.update({ where: { id: requestId }, data: { status: "expired", resolvedAt: new Date() } });
    return { status: "expired" };
  }

  /** ── Consent Chain ────────────────────────────────── */
  async getChain(agentId: string) {
    const records = await prisma.consentRecord.findMany({
      where: { agentId },
      orderBy: { timestamp: "asc" },
    });

    const chain = records.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      action: r.action,
      approvedBy: r.approvedBy,
      metadata: r.metadata as Record<string, unknown>,
      timestamp: r.timestamp.toISOString(),
      cibaRequestId: r.cibaRequestId ?? undefined,
      previousHash: r.previousHash,
      signature: r.signature,
    }));

    const { valid, brokenAt, brokenReason } = verifyChain(chain);
    return { agentId, records: chain, verified: valid, brokenAt, brokenReason };
  }

  /** ── Pending CIBA requests ───────────────────────── */
  async getPending(orgId: string) {
    // Get all agents for this org
    const agents = await prisma.agent.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const agentIds = agents.map((a) => a.id);

    const requests = await prisma.cIBARequest.findMany({
      where: { agentId: { in: agentIds }, status: "pending", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return requests;
  }
}