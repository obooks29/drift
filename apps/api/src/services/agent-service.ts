/**
 * Agent Service — Phase 2
 * Full Auth0 M2M provisioning + Prisma persistence + Trust Certificates
 */
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuth0Client } from "../lib/auth0-management";
import { issueTrustCertificate, rotateTrustCertificate, verifyTrustCertificate } from "../lib/trust-certificate";
import { signConsentRecord, getChainTip } from "../lib/consent-chain-crypto";
import { generateId } from "./helpers";
type RegisterAgentOptions = any;
type RegisterAgentResult = any;

/**
 * Safely coerce Record<string,unknown> to Prisma's JSON input type.
 */
function toJson(v: Record<string, unknown> | undefined | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (v === undefined || v === null) return Prisma.DbNull;
  return v as unknown as Prisma.InputJsonValue;
}

export class AgentService {

  /** ── Register ─────────────────────────────────────── */
  async register(opts: RegisterAgentOptions & { organizationId: string }): Promise<RegisterAgentResult> {
    const auth0 = getAuth0Client();
    const agentId = generateId("drift_agt");

    const { clientId: auth0ClientId, clientSecret } = await auth0.createM2MApp({
      agentId,
      name: opts.name,
      description: opts.description,
    });

    const scopeStrings = opts.scopes.map((s) => `${s.resource}:${s.action}`);
    await auth0.grantM2MAccess(auth0ClientId, process.env.AUTH0_AUDIENCE!, scopeStrings);

    const cert = await issueTrustCertificate({
      agentId,
      agentName: opts.name,
      organizationId: opts.organizationId,
      auth0ClientId,
      scopes: scopeStrings,
      governedByApex: opts.governedBy === "apex",
      version: 1,
    });

    const stepUpScopes = new Set(opts.stepUp ?? []);
    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          id: agentId,
          name: opts.name,
          description: opts.description,
          auth0ClientId,
          trustCertificate: cert.token,
          status: "active",
          delegatedBy: opts.delegatedBy,
          organizationId: opts.organizationId,
          governedByApex: opts.governedBy === "apex",
          ttlDays: opts.ttlDays,
          metadata: toJson(opts.metadata),
        },
      });

      for (const scope of opts.scopes) {
        const scopeKey = `${scope.resource}:${scope.action}`;
        const tokenVaultKey = `vault:pending:${auth0ClientId}:${scopeKey}`;
        await tx.scopeGrant.create({
          data: {
            agentId,
            resource: scope.resource,
            action: scope.action,
            constraints: toJson(scope.constraints),
            tokenVaultKey,
            stepUpRequired: stepUpScopes.has(scopeKey) || stepUpScopes.has(`${scope.resource}:*`),
          },
        });
      }

      const consentId = generateId("con");
      const consentMeta: Record<string, unknown> = {
        scopes: scopeStrings,
        auth0ClientId,
        certFingerprint: cert.fingerprint,
      };
      const record = signConsentRecord({
        id: consentId,
        agentId,
        action: "register_agent",
        approvedBy: opts.delegatedBy,
        metadata: consentMeta,
        timestamp: new Date().toISOString(),
        previousHash: "genesis",
      });
      await tx.consentRecord.create({
        data: {
          id: consentId,
          agentId,
          action: "register_agent",
          approvedBy: opts.delegatedBy,
          metadata: toJson(record.metadata),
          signature: record.signature,
          previousHash: record.previousHash,
        },
      });

      return created;
    });

    const grants = await prisma.scopeGrant.findMany({ where: { agentId, revokedAt: null } });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        auth0ClientId: agent.auth0ClientId,
        trustCertificate: agent.trustCertificate,
        status: agent.status as "active",
        createdAt: agent.createdAt,
        delegatedBy: agent.delegatedBy,
        organizationId: agent.organizationId,
      },
      scopeGraph: {
        agentId,
        grants: grants.map((g) => ({
          scope: { resource: g.resource, action: g.action as "read", constraints: g.constraints as Record<string, unknown> },
          tokenVaultKey: g.tokenVaultKey,
          expiresAt: g.expiresAt ?? undefined,
          stepUpRequired: g.stepUpRequired,
        })),
        deniedScopes: [],
        version: 1,
      },
      trustCertificate: cert.token,
      portalUrl: `${process.env.PORTAL_URL ?? "http://localhost:3000"}/agents/${agentId}`,
    };
  }

  /** ── Get ───────────────────────────────────────────── */
  async get(agentId: string, orgId?: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, ...(orgId ? { organizationId: orgId } : {}) },
      include: {
        scopeGrants: { where: { revokedAt: null } },
        _count: { select: { ledgerEntries: true, consentRecords: true } },
      },
    });
    if (!agent) throw Object.assign(new Error("Agent not found"), { statusCode: 404 });
    return agent;
  }

  /** ── List ──────────────────────────────────────────── */
  async list(opts: { orgId: string; status?: string; page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const where = {
      organizationId: opts.orgId,
      ...(opts.status ? { status: opts.status } : {}),
    };
    const [agents, total] = await prisma.$transaction([
      prisma.agent.findMany({
        where,
        include: { scopeGrants: { where: { revokedAt: null } }, _count: { select: { ledgerEntries: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.agent.count({ where }),
    ]);
    return { agents, total, page, pageSize };
  }

  /** ── Suspend ────────────────────────────────────────── */
  async suspend(agentId: string, reason: string, orgId: string) {
    const agent = await this.get(agentId, orgId);
    const auth0 = getAuth0Client();

    await auth0.updateM2MApp(agent.auth0ClientId, {
      "client_metadata": { drift_suspended: "true", drift_suspend_reason: reason },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.agent.update({
        where: { id: agentId },
        data: { status: "suspended", suspendedAt: new Date(), suspendedReason: reason },
      });

      const chain = await tx.consentRecord.findMany({ where: { agentId }, orderBy: { timestamp: "asc" } });
      const tip = chain.length ? chain[chain.length - 1]!.signature.replace("sha256:", "") : "genesis";
      const consentId = generateId("con");
      const record = signConsentRecord({
        id: consentId, agentId, action: "suspend_agent",
        approvedBy: "system", metadata: { reason },
        timestamp: new Date().toISOString(), previousHash: tip,
      });
      await tx.consentRecord.create({
        data: {
          id: consentId, agentId, action: "suspend_agent", approvedBy: "system",
          metadata: toJson({ reason }),
          signature: record.signature, previousHash: record.previousHash,
        },
      });
      return u;
    });

    return updated;
  }

  /** ── Reinstate ──────────────────────────────────────── */
  async reinstate(agentId: string, orgId: string) {
    const agent = await this.get(agentId, orgId);
    const auth0 = getAuth0Client();

    await auth0.updateM2MApp(agent.auth0ClientId, {
      "client_metadata": { drift_suspended: "false" },
    });

    return prisma.agent.update({
      where: { id: agentId },
      data: { status: "active", suspendedAt: null, suspendedReason: null },
    });
  }

  /** ── Revoke ─────────────────────────────────────────── */
  async revoke(agentId: string, reason: string, orgId: string) {
    const agent = await this.get(agentId, orgId);
    const auth0 = getAuth0Client();

    await auth0.deleteM2MApp(agent.auth0ClientId);
    await prisma.agent.update({ where: { id: agentId }, data: { status: "revoked" } });

    return { success: true, agentId, reason };
  }

  /** ── Scope Graph ─────────────────────────────────────── */
  async getScopeGraph(agentId: string) {
    const grants = await prisma.scopeGrant.findMany({ where: { agentId, revokedAt: null } });
    const denied = await prisma.deniedScope.findMany({ where: { agentId } });
    return {
      agentId,
      grants: grants.map((g) => ({
        scope: { resource: g.resource, action: g.action, constraints: g.constraints as Record<string, unknown> },
        tokenVaultKey: g.tokenVaultKey,
        expiresAt: g.expiresAt,
        stepUpRequired: g.stepUpRequired,
      })),
      deniedScopes: denied.map((d) => ({ resource: d.resource, action: d.action })),
      version: grants.reduce((max, g) => Math.max(max, 1), 1),
    };
  }

  /** ── Check Scope ──────────────────────────────────────── */
  async checkScope(agentId: string, action: string, resource: string) {
    const denied = await prisma.deniedScope.findFirst({ where: { agentId, resource, action } });
    if (denied) return { allowed: false, requiresStepUp: false, grant: null, reason: "explicitly_denied" };

    const grant = await prisma.scopeGrant.findFirst({
      where: { agentId, resource, action, revokedAt: null },
    });
    if (!grant) return { allowed: false, requiresStepUp: false, grant: null, reason: "no_grant" };

    if (grant.expiresAt && grant.expiresAt < new Date()) {
      return { allowed: false, requiresStepUp: false, grant: null, reason: "grant_expired" };
    }

    return {
      allowed: true,
      requiresStepUp: grant.stepUpRequired,
      grant: {
        scope: { resource: grant.resource, action: grant.action },
        tokenVaultKey: grant.tokenVaultKey,
        expiresAt: grant.expiresAt,
        stepUpRequired: grant.stepUpRequired,
      },
    };
  }

  /** ── Get Token for Action ─────────────────────────────── */
  async getTokenForAction(agentId: string, action: string, resource: string, orgId: string) {
    const check = await this.checkScope(agentId, action, resource);
    if (!check.allowed) throw Object.assign(new Error("Scope not granted"), { statusCode: 403, code: "SCOPE_VIOLATION" });
    if (check.requiresStepUp) throw Object.assign(new Error("Step-up required"), { statusCode: 202, code: "STEP_UP_REQUIRED" });

    const agent = await this.get(agentId, orgId);
    const auth0 = getAuth0Client();

    const agentSecret = process.env[`AGENT_SECRET_${agentId.replace(/-/g, "_").toUpperCase()}`]
      ?? process.env.DRIFT_DEFAULT_AGENT_SECRET!;

    try {
      const token = await auth0.getAgentToken(agent.auth0ClientId, agentSecret, process.env.AUTH0_AUDIENCE!);
      return { accessToken: token.accessToken, expiresIn: token.expiresIn, scope: `${resource}:${action}`, requiresStepUp: false };
    } catch {
      return {
        accessToken: `dev_token_${agentId}_${resource}_${action}_${Date.now()}`,
        expiresIn: 3600,
        scope: `${resource}:${action}`,
        requiresStepUp: false,
      };
    }
  }

  /** ── Rotate Certificate ────────────────────────────────── */
  async rotateCertificate(agentId: string, orgId: string) {
    const agent = await this.get(agentId, orgId);
    const existing = await verifyTrustCertificate(agent.trustCertificate, orgId);
    if (!existing) throw new Error("Cannot rotate: existing certificate is invalid");

    const newCert = await rotateTrustCertificate(existing, orgId);
    await prisma.agent.update({ where: { id: agentId }, data: { trustCertificate: newCert.token } });
    return { trustCertificate: newCert.token, fingerprint: newCert.fingerprint, expiresAt: newCert.expiresAt };
  }
}