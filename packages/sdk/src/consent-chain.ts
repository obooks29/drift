import { AxiosInstance } from "axios";
import { ConsentRecord, CIBARequest, StepUpRequiredError } from "./types";

export class ConsentChain {
  constructor(private readonly http: AxiosInstance) {}

  async getChain(agentId: string, opts?: { limit?: number; from?: Date }): Promise<ConsentRecord[]> {
    const { data } = await this.http.get<ConsentRecord[]>(`/agents/${agentId}/consent-chain`, { params: opts });
    return data;
  }

  async initiateCIBA(agentId: string, opts: {
    action: string;
    description: string;
    loginHint: string;
    metadata?: Record<string, unknown>;
  }): Promise<CIBARequest> {
    const { data } = await this.http.post<CIBARequest>(`/agents/${agentId}/consent-chain/ciba`, opts);
    return data;
  }

  async pollCIBAStatus(agentId: string, requestId: string): Promise<CIBARequest> {
    const { data } = await this.http.get<CIBARequest>(`/agents/${agentId}/consent-chain/ciba/${requestId}`);
    return data;
  }

  async waitForApproval(agentId: string, requestId: string, timeoutMs = 300_000): Promise<CIBARequest> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const req = await this.pollCIBAStatus(agentId, requestId);
      if (req.status === "approved") return req;
      if (req.status === "rejected") throw new Error(`CIBA request rejected by user`);
      if (req.status === "expired") throw new Error(`CIBA request expired`);
      await new Promise((r) => setTimeout(r, 3_000));
    }
    throw new Error(`CIBA approval timed out after ${timeoutMs}ms`);
  }

  async requireApproval(agentId: string, action: string, description: string, loginHint: string, metadata?: Record<string, unknown>): Promise<void> {
    const cibaReq = await this.initiateCIBA(agentId, { action, description, loginHint, metadata });
    throw new StepUpRequiredError(cibaReq);
  }

  async verifyChainIntegrity(agentId: string): Promise<{ valid: boolean; brokenAt?: string }> {
    const { data } = await this.http.get<{ valid: boolean; brokenAt?: string }>(`/agents/${agentId}/consent-chain/verify`);
    return data;
  }
}
