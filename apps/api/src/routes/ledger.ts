import type { FastifyPluginAsync } from "fastify";
import { LedgerService } from "../services/ledger-service";
import { ledgerBroadcaster } from "../lib/websocket-ledger";
import { validateWebhookSignature } from "../middleware/auth";
import { randomBytes } from "crypto";

const svc = new LedgerService();

export const ledgerRouter: FastifyPluginAsync = async (app) => {

  // Query ledger entries
  app.get("/", async (req) => {
    const q = req.query as Record<string, string>;
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.query({
      orgId,
      agentId: q.agentId,
      action: q.action,
      result: q.result as "success" | "failure" | "blocked" | "pending_approval" | undefined,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
      page: parseInt(q.page ?? "1"),
      pageSize: parseInt(q.pageSize ?? "50"),
    });
  });

  // Write ledger entry
  app.post("/", async (req, reply) => {
    const orgId = (req as typeof req & { orgId: string }).orgId;
    const entry = req.body as Record<string, unknown>;
    // Cast through unknown — body shape is validated at runtime by svc.write
    const created = await svc.write({
      ...(entry as unknown as Parameters<typeof svc.write>[0]),
      organizationId: orgId,
    });
    return reply.code(201).send(created);
  });

  // Hourly chart data
  app.get("/chart", async (req) => {
    const orgId = (req as typeof req & { orgId: string }).orgId;
    const q = req.query as Record<string, string>;
    return svc.getHourlyBuckets(orgId, parseInt(q.hours ?? "24"));
  });

  // Dashboard stats
  app.get("/stats", async (req) => {
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.stats(orgId);
  });

  // Export CSV
  app.get("/:agentId/export", async (req, reply) => {
    const { agentId } = req.params as { agentId: string };
    const q = req.query as Record<string, string>;
    const orgId = (req as typeof req & { orgId: string }).orgId;
    const csv = await svc.exportCSV(agentId, orgId, new Date(q.from!), new Date(q.to!));
    return reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", `attachment; filename="ledger-${agentId}-${Date.now()}.csv"`)
      .send(csv);
  });

  // Auth0 log stream webhook → ActionLedger
  app.post("/webhook/auth0", { preHandler: [validateWebhookSignature] }, async (req, reply) => {
    const lines = (req.body as string).split("\n").filter(Boolean);
    let written = 0;
    const orgId = (req as typeof req & { orgId?: string }).orgId ?? "webhook";

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as Record<string, unknown>;
        const eventType = event.type as string;

        // Map Auth0 log events to ledger actions
        const actionMap: Record<string, string> = {
          "s":   "auth:login:success",
          "f":   "auth:login:failure",
          "sapi":"api:call:success",
          "fapi":"api:call:failure",
          "mgmt":"management:action",
        };

        await svc.write({
          agentId: (event.client_id as string) ?? "auth0-system",
          organizationId: orgId,
          action: actionMap[eventType] ?? `auth0:${eventType}`,
          resource: "auth0",
          result: eventType.startsWith("f") ? "failure" : "success",
          metadata: event,
          durationMs: typeof event.elapsed_milliseconds === "number" ? event.elapsed_milliseconds : undefined,
        });
        written++;
      } catch { /* skip malformed lines */ }
    }

    return reply.send({ processed: written });
  });

  // Real-time WebSocket stream
  app.get("/stream", { websocket: true }, (socket, req) => {
    const q = (req.query as Record<string, string>);
    const orgId = (req as typeof req & { orgId?: string }).orgId ?? q.orgId ?? "unknown";
    const agentId = q.agentId;
    const connId = randomBytes(8).toString("hex");

    ledgerBroadcaster.subscribe(connId, {
      orgId,
      agentId,
      send: (data) => socket.send(data),
      close: () => socket.close(),
    });

    socket.on("close", () => ledgerBroadcaster.unsubscribe(connId));
    socket.send(JSON.stringify({ type: "connected", connId, subscribers: ledgerBroadcaster.size() }));
  });
};