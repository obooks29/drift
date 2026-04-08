/**
 * Consent Service — Phase 2
 * Full CIBA flow + Prisma ConsentChain persistence
 */
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuth0Client } from "../lib/auth0-management";
import { signConsentRecord, verifyChain, getChainTip } from "../lib/consent-chain-crypto";
import { generateId } from "./helpers";
import { randomBytes } from "crypto";

/**
 * Safely coerce Record<string,unknown> to Prisma's JSON input type.
 * Prisma rejects `Record<string,unknown>` directly because `unknown` is
 * wider than `InputJsonValue`. Routing through `unknown` first is safe
 * here because we own the shape at every call site.
 */
function toJson(v: Record<string, unknown> | undefined | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (v === undefined || v === null) return Prisma.DbNull;
  return v as unknown as Prisma.InputJsonValue;
}

export class ConsentService {

  /** ── Initiate CIBA ───────────────────────────────── */
  async initiateCIBA(opts: {
    agentId: string;
    action: string;
    description: string;
    loginHint: string;
    metadata?: Record<string, unknown>;
  }) {
    const auth0 = getAuth0Client();
    const bindingMessage = `DRIFT-${randomBytes(2).toString("hex").toUpperCase()}`;

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
      authReqId = `ciba_dev_${generateId()}`;
      expiresIn = 300;
      interval = 5;
    }

    const id = generateId("ciba");
    const record = await prisma.cIBARequest.create({
      data: {
        id,
        agentId: opts.agentId,
        action: opts.action,
        description: opts.description,
        loginHint: opts.loginHint,
        metadata: toJson(opts.metadata),
        status: "pending",
        bindingMessage,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
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
      authReqId,
      interval,
    };
  }

  /** ── Poll CIBA ───────────────────────────────────── */
  async pollCIBA(requestId: string) {
    const record = await prisma.cIBARequest.findUnique({ where: { id: requestId } });
    if (!record) throw Object.assign(new Error("CIBA request not found"), { statusCode: 404 });

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
      const u = await tx.cIBARequest.update({
        where: { id: requestId },
        data: { status: decision, resolvedAt: new Date() },
      });

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
        const consentMeta: Record<string, unknown> = {
          cibaRequestId: requestId,
          originalAction: request.action,
          description: request.description,
          ...(request.metadata as Record<string, unknown> ?? {}),
        };
        const signed = signConsentRecord({
          id: consentId,
          agentId: request.agentId,
          action: "approve_action",
          approvedBy: resolvedBy,
          metadata: consentMeta,
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
            metadata: toJson(signed.metadata),
            cibaRequestId: requestId,
            signature: signed.signature,
            previousHash: signed.previousHash,
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

      try {
        const result = await auth0.pollCIBA(authReqId);
        if (result.status !== "pending") {
          await prisma.cIBARequest.update({
            where: { id: requestId },
            data: { status: result.status, resolvedAt: new Date() },
          });
          return {
            status: result.status as "approved" | "rejected" | "expired",
            accessToken: result.accessToken,
          };
        }
      } catch {
        // Fall through to DB poll (dev mode)
      }

      const dbRecord = await this.pollCIBA(requestId);
      if (dbRecord.status !== "pending") {
        return { status: dbRecord.status as "approved" | "rejected" | "expired" };
      }

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
    const agents = await prisma.agent.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const agentIds = agents.map((a) => a.id);

    return prisma.cIBARequest.findMany({
      where: { agentId: { in: agentIds }, status: "pending", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }
}