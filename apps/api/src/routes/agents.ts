import type { FastifyPluginAsync } from "fastify";
import { AgentService } from "../services/agent-service";
import { z } from "zod";

const svc = new AgentService();

const ScopeSchema = z.object({
  resource: z.string().min(1).max(64),
  action: z.enum(["read","write","delete","execute","charge","send","book","submit","approve"]),
  constraints: z.record(z.unknown()).optional(),
});

const RegisterSchema = z.object({
  name: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "Name must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(256).optional(),
  scopes: z.array(ScopeSchema).min(1, "At least one scope is required"),
  stepUp: z.array(z.string()).optional(),
  delegatedBy: z.string().email(),
  governedBy: z.enum(["apex","none"]).default("apex"),
  ttlDays: z.number().int().positive().max(365).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentsRouter: FastifyPluginAsync = async (app) => {

  // List agents
  app.get("/", async (req) => {
    const q = req.query as Record<string, string>;
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.list({ orgId, status: q.status, page: parseInt(q.page ?? "1") });
  });

  // Register agent
  app.post("/register", async (req, reply) => {
    const orgId = (req as typeof req & { orgId: string }).orgId;
    const body = RegisterSchema.parse(req.body);
    const result = await svc.register({ ...body, organizationId: orgId });
    return reply.code(201).send(result);
  });

  // Get agent
  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.get(id, orgId);
  });

  // Suspend
  app.post("/:id/suspend", async (req) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.suspend(id, reason, orgId);
  });

  // Reinstate
  app.post("/:id/reinstate", async (req) => {
    const { id } = req.params as { id: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.reinstate(id, orgId);
  });

  // Revoke
  app.delete("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.revoke(id, reason, orgId);
  });

  // Scope graph
  app.get("/:id/scope-graph", async (req) => {
    const { id } = req.params as { id: string };
    return svc.getScopeGraph(id);
  });

  // Check scope
  app.post("/:id/scope-graph/check", async (req) => {
    const { id } = req.params as { id: string };
    const { action, resource } = req.body as { action: string; resource: string };
    return svc.checkScope(id, action, resource);
  });

  // Get token for action (Token Vault retrieval)
  app.post("/:id/token", async (req) => {
    const { id } = req.params as { id: string };
    const { action, resource } = req.body as { action: string; resource: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.getTokenForAction(id, action, resource, orgId);
  });

  // Rotate trust certificate
  app.post("/:id/rotate-cert", async (req) => {
    const { id } = req.params as { id: string };
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.rotateCertificate(id, orgId);
  });
};
