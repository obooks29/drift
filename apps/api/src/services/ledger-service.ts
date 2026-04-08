/**
 * Ledger Service — Phase 2
 * Full Prisma persistence + WebSocket broadcasting
 */
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { ledgerBroadcaster } from "../lib/websocket-ledger";
import { generateId } from "./helpers";

type ActionResult = any;

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

function toJson(v: Record<string, unknown> | undefined | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (v === undefined || v === null) return Prisma.DbNull;
  return v as unknown as Prisma.InputJsonValue;
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
        metadata: toJson(entry.metadata),
        tokenUsed: entry.tokenUsed ? this.maskToken(entry.tokenUsed) : null,
        scopeMatched: entry.scopeMatched,
        cibaApprovalId: entry.cibaApprovalId,
        durationMs: entry.durationMs,
      },
    });

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
    const agentWhere = opts.agentId
      ? { agentId: opts.agentId }
      : { agent: { organizationId: opts.orgId } };

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
    const from = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch raw results and aggregate in application code to avoid
    // Prisma's self-referential `having` type which causes TS2615 with
    // TypeScript ≥5.4 + Prisma 5.x groupBy.
    const entries = await prisma.ledgerEntry.findMany({
      where: { agentId: { in: agentIds }, timestamp: { gte: from } },
      select: { result: true, action: true },
    });

    const total = entries.length;

    const byResult: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    for (const e of entries) {
      byResult[e.result] = (byResult[e.result] ?? 0) + 1;
      actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1;
    }

    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    return { total, byResult, topActions, since: from };
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