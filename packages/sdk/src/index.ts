/**
 * @drift-ai/sdk
 * The official Drift Agent Identity & Authorization Platform SDK.
 *
 * @example
 * import { Drift } from '@drift-ai/sdk';
 *
 * const drift = new Drift({ apiKey: '...', organizationId: '...' });
 *
 * const { agent } = await drift.agents.register({
 *   name: 'travel-booking-agent',
 *   scopes: [
 *     { resource: 'flights', action: 'book' },
 *     { resource: 'card', action: 'charge' },
 *   ],
 *   stepUp: ['card:charge'],
 *   delegatedBy: 'user@company.com',
 *   governedBy: 'apex',
 * });
 */

export * from "./types";
export { AgentRegistry } from "./agent-registry";
export { ScopeGraphEngine } from "./scope-graph";
export { ConsentChain } from "./consent-chain";
export { ActionLedger } from "./action-ledger";

import { createHttpClient } from "./client";
import { AgentRegistry } from "./agent-registry";
import { ScopeGraphEngine } from "./scope-graph";
import { ConsentChain } from "./consent-chain";
import { ActionLedger } from "./action-ledger";
import { DriftConfig } from "./types";

export class Drift {
  public readonly agents: AgentRegistry;
  public readonly scopes: ScopeGraphEngine;
  public readonly consent: ConsentChain;
  public readonly ledger: ActionLedger;

  static readonly Apex = "apex" as const;

  constructor(config: DriftConfig) {
    const http = createHttpClient(config);
    this.agents  = new AgentRegistry(http);
    this.scopes  = new ScopeGraphEngine(http);
    this.consent = new ConsentChain(http);
    this.ledger  = new ActionLedger(http);
  }
}

export default Drift;
