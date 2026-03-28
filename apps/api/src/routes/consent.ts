import type { FastifyPluginAsync } from "fastify";
import { ConsentService } from "../services/consent-service";
import { validateWebhookSignature } from "../middleware/auth";

const svc = new ConsentService();

export const consentRouter: FastifyPluginAsync = async (app) => {

  // Get pending CIBA requests for org
  app.get("/pending", async (req) => {
    const orgId = (req as typeof req & { orgId: string }).orgId;
    return svc.getPending(orgId);
  });

  // Initiate CIBA
  app.post("/ciba", async (req, reply) => {
    const body = req.body as {
      agentId: string; action: string; description: string;
      loginHint: string; metadata?: Record<string, unknown>;
    };
    const result = await svc.initiateCIBA(body);
    return reply.code(201).send(result);
  });

  // Poll CIBA status
  app.get("/ciba/:id", async (req) => {
    const { id } = req.params as { id: string };
    return svc.pollCIBA(id);
  });

  // Resolve CIBA (approve/reject via portal)
  app.post("/ciba/:id/resolve", async (req) => {
    const { id } = req.params as { id: string };
    const { decision, resolvedBy } = req.body as { decision: "approved" | "rejected"; resolvedBy: string };
    return svc.resolveCIBA(id, decision, resolvedBy);
  });

  // Wait for CIBA (long-poll, SDK usage)
  app.post("/ciba/:id/wait", async (req) => {
    const { id } = req.params as { id: string };
    const { authReqId } = req.body as { authReqId: string };
    return svc.waitForCIBA(authReqId, id);
  });

  // Get consent chain for agent
  app.get("/chain/:agentId", async (req) => {
    const { agentId } = req.params as { agentId: string };
    return svc.getChain(agentId);
  });
};
