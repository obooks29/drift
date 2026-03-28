import type { FastifyPluginAsync } from "fastify";
import { ApexService } from "../services/apex-service";

export const apexRouter: FastifyPluginAsync = async (app) => {
  const apex = new ApexService();
  app.get("/status", async () => apex.getStatus());
  app.post("/sweep", async () => apex.runSweep());
  app.post("/evaluate", async (req) => {
    return apex.evaluate(req.body as { agentId: string; action: string; resource: string; context: Record<string, unknown> });
  });
};
