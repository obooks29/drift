import { AxiosInstance } from "axios";
import {
  RegisterAgentOptions, RegisterAgentResult,
  AgentID, AgentStatus
} from "./types";

export class AgentRegistry {
  constructor(private readonly http: AxiosInstance) {}

  async register(opts: RegisterAgentOptions): Promise<RegisterAgentResult> {
    const { data } = await this.http.post<RegisterAgentResult>("/agents/register", opts);
    return data;
  }

  async get(agentId: string): Promise<AgentID> {
    const { data } = await this.http.get<AgentID>(`/agents/${agentId}`);
    return data;
  }

  async list(filters?: { status?: AgentStatus; page?: number; pageSize?: number }): Promise<{ agents: AgentID[]; total: number; page: number }> {
    const { data } = await this.http.get("/agents", { params: filters });
    return data;
  }

  async suspend(agentId: string, reason: string): Promise<AgentID> {
    const { data } = await this.http.post<AgentID>(`/agents/${agentId}/suspend`, { reason });
    return data;
  }

  async reinstate(agentId: string): Promise<AgentID> {
    const { data } = await this.http.post<AgentID>(`/agents/${agentId}/reinstate`);
    return data;
  }

  async revoke(agentId: string, reason: string): Promise<void> {
    await this.http.delete(`/agents/${agentId}`, { data: { reason } });
  }

  async rotateCertificate(agentId: string): Promise<{ trustCertificate: string }> {
    const { data } = await this.http.post<{ trustCertificate: string }>(`/agents/${agentId}/rotate-cert`);
    return data;
  }
}
