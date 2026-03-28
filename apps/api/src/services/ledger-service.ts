/**
 * Ledger Service — Phase 2
 * Full Prisma persistence + WebSocket broadcasting
 */
import prisma from "../lib/prisma";
import { ledgerBroadcaster } from "../lib/websocket-ledger";
import { generateId } from "./helpers";
import type { ActionResult } from "@drift-ai/sdk";

interface WriteEntry {
  agentId: string;
  organizationId: string;
  action: string;
  resource: string;
  result: ActionResult;
  metadata?: Record<string, unknown>;
  tokenUsed?: string;
  scopeMatched?: string;
  cibaApprovalId?: string;
  durationMs?: number;
}

export class LedgerService {

  /** ── Write an entry ──────────────────────────────── */
  async write(entry: WriteEntry) {
    const id = generateId("led");
    const created = await prisma.ledgerEntry.create({
      data: {
        id,
        agentId: entry.agentId,
        action: entry.action,
        resource: entry.resource,
        result: entry.result,
        metadata: entry.metadata as object,
        tokenUsed: entry.tokenUsed ? this.maskToken(entry.tokenUsed) : null,
        scopeMatched: entry.scopeMatched,
        cibaApprovalId: entry.cibaApprovalId,
        durationMs: entry.durationMs,
      },
    });

    // Broadcast to WebSocket subscribers
    ledgerBroadcaster.broadcast(entry.organizationId, entry.agentId, {
      ...created,
      timestamp: created.timestamp.toISOString(),
    });

    return created;
  }

  /** ── Query entries ───────────────────────────────── */
  async query(opts: {
    orgId: string;
    agentId?: string;
    action?: string;
    result?: ActionResult;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    // Verify agent belongs to org
    const agentWhere = opts.agentId
      ? { agentId: opts.agentId }
      : {
          agent: { organizationId: opts.orgId }
        };

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 50;

    const where = {
      ...agentWhere,
      ...(opts.action ? { action: { contains: opts.action } } : {}),
      ...(opts.result ? { result: opts.result } : {}),
      ...(opts.from || opts.to ? {
        timestamp: {
          ...(opts.from ? { gte: opts.from } : {}),
          ...(opts.to ? { lte: opts.to } : {}),
        },
      } : {}),
    };

    const [entries, total] = await prisma.$transaction([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return { entries, total, page, pageSize };
  }

  /** ── Stats for dashboard ────────────────────────── */
  async stats(orgId: string, since?: Date) {
    const agents = await prisma.agent.findMany({
      where: { organizationId: orgId },
      select: { id: true },
    });
    const agentIds = agents.map((a) => a.id);

    const from = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

    const [total, byResult, topActions] = await prisma.$transaction([
      prisma.ledgerEntry.count({ where: { agentId: { in: agentIds }, timestamp: { gte: from } } }),
      prisma.ledgerEntry.groupBy({
        by: ["result"],
        where: { agentId: { in: agentIds }, timestamp: { gte: from } },
        _count: { result: true },
      }),
      prisma.ledgerEntry.groupBy({
        by: ["action"],
        where: { agentId: { in: agentIds }, timestamp: { gte: from } },
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
        take: 5,
      }),
    ]);

    return {
      total,
      byResult: Object.fromEntries(byResult.map((r) => [r.result, r._count.result])),
      topActions: topActions.map((a) => ({ action: a.action, count: a._count.action })),
      since: from,
    };
  }

  /** ── Export CSV ──────────────────────────────────── */
  async exportCSV(agentId: string, orgId: string, from: Date, to: Date): Promise<string> {
    const { entries } = await this.query({ orgId, agentId, from, to, pageSize: 10_000 });
    const header = "id,agentId,action,resource,result,durationMs,timestamp\n";
    const rows = entries.map((e) =>
      `${e.id},${e.agentId},${e.action},${e.resource},${e.result},${e.durationMs ?? ""},${e.timestamp.toISOString()}`
    ).join("\n");
    return header + rows;
  }

  /** ── Hourly buckets for chart ───────────────────── */
  async getHourlyBuckets(orgId: string, hours = 24): Promise<Array<{ hour: string; count: number }>> {
    const agents = await prisma.agent.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const agentIds = agents.map((a) => a.id);
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);

    const entries = await prisma.ledgerEntry.findMany({
      where: { agentId: { in: agentIds }, timestamp: { gte: from } },
      select: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    // Group by hour
    const buckets = new Map<string, number>();
    for (let h = 0; h < hours; h++) {
      const t = new Date(from.getTime() + h * 60 * 60 * 1000);
      const key = `${t.getHours().toString().padStart(2, "0")}:00`;
      buckets.set(key, 0);
    }
    for (const e of entries) {
      const key = `${e.timestamp.getHours().toString().padStart(2, "0")}:00`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([hour, count]) => ({ hour, count }));
  }

  private maskToken(token: string): string {
    if (token.length < 12) return "••••••••";
    return token.slice(0, 8) + "••••••••" + token.slice(-4);
  }
}
