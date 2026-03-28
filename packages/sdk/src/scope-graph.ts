import { AxiosInstance } from "axios";
import { Scope, ScopeGrant, ScopeGraph, ScopeViolationError } from "./types";

export class ScopeGraphEngine {
  constructor(private readonly http: AxiosInstance) {}

  async get(agentId: string): Promise<ScopeGraph> {
    const { data } = await this.http.get<ScopeGraph>(`/agents/${agentId}/scope-graph`);
    return data;
  }

  async addScope(agentId: string, grant: Omit<ScopeGrant, "tokenVaultKey"> & { service: string; oauthToken: string }): Promise<ScopeGraph> {
    const { data } = await this.http.post<ScopeGraph>(`/agents/${agentId}/scope-graph/grants`, grant);
    return data;
  }

  async removeScope(agentId: string, resource: string, action: string): Promise<ScopeGraph> {
    const { data } = await this.http.delete<ScopeGraph>(`/agents/${agentId}/scope-graph/grants/${resource}/${action}`);
    return data;
  }

  async denyScope(agentId: string, scope: Scope): Promise<ScopeGraph> {
    const { data } = await this.http.post<ScopeGraph>(`/agents/${agentId}/scope-graph/deny`, scope);
    return data;
  }

  async check(agentId: string, action: string, resource: string): Promise<{ allowed: boolean; requiresStepUp: boolean; grant?: ScopeGrant }> {
    const { data } = await this.http.post<{ allowed: boolean; requiresStepUp: boolean; grant?: ScopeGrant }>(
      `/agents/${agentId}/scope-graph/check`,
      { action, resource }
    );
    return data;
  }

  async assertAllowed(agentId: string, action: string, resource: string): Promise<ScopeGrant> {
    const result = await this.check(agentId, action, resource);
    if (!result.allowed) throw new ScopeViolationError(action, resource);
    if (!result.grant) throw new ScopeViolationError(action, resource);
    return result.grant;
  }
}
