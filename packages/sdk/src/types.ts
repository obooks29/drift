/**
 * Drift SDK — Core Type Definitions
 */

export type AgentStatus = "active" | "suspended" | "pending" | "revoked";

export interface AgentID {
  id: string;
  name: string;
  auth0ClientId: string;
  trustCertificate: string;
  status: AgentStatus;
  createdAt: Date;
  delegatedBy: string;
  organizationId: string;
}

export type ScopeAction = "read" | "write" | "delete" | "execute" | "charge" | "send" | "book" | "submit" | "approve";

export interface Scope {
  resource: string;
  action: ScopeAction;
  constraints?: Record<string, unknown>;
}

export interface ScopeGrant {
  scope: Scope;
  tokenVaultKey: string;
  expiresAt?: Date;
  stepUpRequired: boolean;
}

export interface ScopeGraph {
  agentId: string;
  grants: ScopeGrant[];
  deniedScopes: Scope[];
  version: number;
}

export type ConsentAction = "grant_scope" | "revoke_scope" | "approve_action" | "reject_action" | "register_agent" | "suspend_agent";

export interface ConsentRecord {
  id: string;
  agentId: string;
  action: ConsentAction;
  approvedBy: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  cibaRequestId?: string;
  signature: string;
  previousHash: string;
}

export interface CIBARequest {
  requestId: string;
  agentId: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt: Date;
  bindingMessage: string;
}

export type ActionResult = "success" | "failure" | "blocked" | "pending_approval";

export interface LedgerEntry {
  id: string;
  agentId: string;
  action: string;
  resource: string;
  result: ActionResult;
  metadata: Record<string, unknown>;
  timestamp: Date;
  tokenUsed?: string;
  scopeMatched?: string;
  cibaApprovalId?: string;
  durationMs?: number;
}

export interface RegisterAgentOptions {
  name: string;
  description?: string;
  scopes: Scope[];
  stepUp?: string[];
  delegatedBy: string;
  governedBy?: "apex";
  ttlDays?: number;
  metadata?: Record<string, unknown>;
}

export interface RegisterAgentResult {
  agent: AgentID;
  scopeGraph: ScopeGraph;
  trustCertificate: string;
  portalUrl: string;
}

export interface DriftConfig {
  apiKey: string;
  apiUrl?: string;
  organizationId: string;
  timeout?: number;
  retries?: number;
}

export class DriftError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "DriftError";
  }
}

export class ScopeViolationError extends DriftError {
  constructor(action: string, resource: string) {
    super(`Agent is not authorized to perform "${action}" on "${resource}"`, "SCOPE_VIOLATION", 403);
    this.name = "ScopeViolationError";
  }
}

export class StepUpRequiredError extends DriftError {
  constructor(public readonly cibaRequest: CIBARequest) {
    super("This action requires human approval. A CIBA request has been sent.", "STEP_UP_REQUIRED", 202);
    this.name = "StepUpRequiredError";
  }
}
