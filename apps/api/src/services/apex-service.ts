/**
 * Apex Service — Phase 2
 * Claude-powered meta-agent with real anomaly detection + DB integration
 */
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../lib/prisma";
import { LedgerService } from "./ledger-service";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ledgerSvc = new LedgerService();

interface ApexEvaluation {
  decision: "allow" | "deny" | "escalate";
  reason: string;
  confidence: number;
  suggestedAction?: string;
}

export class ApexService {

  /** ── Status ──────────────────────────────────────── */
  async getStatus() {
    const [activeAgents, pendingCIBA, recentViolations] = await prisma.$transaction([
      prisma.agent.count({ where: { status: "active", governedByApex: true } }),
      prisma.cIBARequest.count({ where: { status: "pending", expiresAt: { gt: new Date() } } }),
      prisma.ledgerEntry.count({
        where: {
          result: "blocked",
          timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
        },
      }),
    ]);

    return {
      apex: "active",
      agentsMonitored: activeAgents,
      pendingApprovals: pendingCIBA,
      anomaliesLastHour: recentViolations,
      lastSweep: new Date(),
      uptime: process.uptime(),
      version: "0.2.0",
    };
  }

  /** ── Evaluate an action ──────────────────────────── */
  async evaluate(opts: {
    agentId: string;
    action: string;
    resource: string;
    context: Record<string, unknown>;
  }): Promise<ApexEvaluation> {
    // Fetch recent activity for this agent (context for Claude)
    const recentEntries = await prisma.ledgerEntry.findMany({
      where: { agentId: opts.agentId },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { action: true, resource: true, result: true, timestamp: true, durationMs: true },
    });

    const agent = await prisma.agent.findUnique({
      where: { id: opts.agentId },
      include: { scopeGrants: { where: { revokedAt: null } } },
    });

    const systemPrompt = `You are Apex, the meta-agent governing all AI agents in the Drift authorization platform.

Your role: evaluate whether an agent action is safe, within policy, and should proceed.

Rules:
- "allow": action is normal, within scope, no anomalies detected
- "deny": action violates scope, policy, or shows suspicious patterns  
- "escalate": action is unusual but might be legitimate — needs human review

Be concise. Respond ONLY with valid JSON:
{ "decision": "allow"|"deny"|"escalate", "reason": string (max 80 chars), "confidence": 0.0-1.0, "suggestedAction": string|null }`;

    const userMessage = `Agent: ${opts.agentId}
Action requested: ${opts.action} on ${opts.resource}
Context: ${JSON.stringify(opts.context, null, 2)}

Agent's granted scopes: ${agent?.scopeGrants.map((g) => `${g.resource}:${g.action}`).join(", ") ?? "none"}

Recent activity (last 10):
${recentEntries.map((e) => `- ${e.action} → ${e.result} (${e.timestamp.toISOString().slice(11, 19)})`).join("\n")}

Is this action safe and within policy?`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";
      // Strip markdown fences if present
      const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(clean) as ApexEvaluation;
      return { decision: parsed.decision ?? "escalate", reason: parsed.reason ?? "Unknown", confidence: parsed.confidence ?? 0.5 };
    } catch (err) {
      console.error("Apex eval error:", err);
      return { decision: "escalate", reason: "Apex could not evaluate — defaulting to human review", confidence: 0 };
    }
  }

  /** ── Sweep ───────────────────────────────────────── */
  async runSweep() {
    const agents = await prisma.agent.findMany({
      where: { status: "active", governedByApex: true },
      include: { scopeGrants: { where: { revokedAt: null } }, _count: { select: { ledgerEntries: true } } },
    });

    const anomalies: Array<{ agentId: string; issue: string; severity: "low" | "medium" | "high" }> = [];

    for (const agent of agents) {
      // Check 1: expiring certificates
      const cert = agent.trustCertificate;
      // Simplified check — in production would decode JWT
      if (!cert) {
        anomalies.push({ agentId: agent.id, issue: "Missing trust certificate", severity: "high" });
      }

      // Check 2: agents with no activity in 7 days
      const lastEntry = await prisma.ledgerEntry.findFirst({
        where: { agentId: agent.id },
        orderBy: { timestamp: "desc" },
      });
      if (!lastEntry) continue;
      const daysSinceLastActivity = (Date.now() - lastEntry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity > 7) {
        anomalies.push({ agentId: agent.id, issue: `No activity for ${Math.floor(daysSinceLastActivity)} days`, severity: "low" });
      }

      // Check 3: high failure rate in last hour
      const [recentTotal, recentFailed] = await prisma.$transaction([
        prisma.ledgerEntry.count({ where: { agentId: agent.id, timestamp: { gte: new Date(Date.now() - 3600000) } } }),
        prisma.ledgerEntry.count({ where: { agentId: agent.id, result: "failure", timestamp: { gte: new Date(Date.now() - 3600000) } } }),
      ]);
      if (recentTotal > 10 && recentFailed / recentTotal > 0.5) {
        anomalies.push({ agentId: agent.id, issue: `High failure rate: ${Math.round(recentFailed / recentTotal * 100)}%`, severity: "medium" });
      }
    }

    return { swept: agents.length, anomalies, completedAt: new Date() };
  }

  /** ── Token Vault audit ───────────────────────────── */
  async auditTokenVault(orgId: string) {
    const expiredGrants = await prisma.scopeGrant.findMany({
      where: {
        agent: { organizationId: orgId },
        expiresAt: { lt: new Date() },
        revokedAt: null,
      },
      include: { agent: { select: { name: true } } },
    });

    return {
      expiredGrants: expiredGrants.length,
      grants: expiredGrants.map((g) => ({
        agentId: g.agentId,
        agentName: g.agent.name,
        scope: `${g.resource}:${g.action}`,
        expiredAt: g.expiresAt,
      })),
    };
  }
}
