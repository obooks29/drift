/**
 * WebSocket Ledger broadcaster
 * Keeps a registry of open WebSocket connections per org/agent.
 * When a ledger entry is written, it fans out to all subscribers.
 */

type Subscriber = {
  agentId?: string;          // undefined = subscribe to all agents in org
  orgId: string;
  send: (data: string) => void;
  close: () => void;
};

class LedgerBroadcaster {
  private subscribers = new Map<string, Subscriber>();   // key = connId

  subscribe(connId: string, sub: Subscriber): void {
    this.subscribers.set(connId, sub);
  }

  unsubscribe(connId: string): void {
    this.subscribers.delete(connId);
  }

  broadcast(orgId: string, agentId: string, entry: unknown): void {
    const payload = JSON.stringify(entry);
    for (const [, sub] of this.subscribers) {
      if (sub.orgId !== orgId) continue;
      if (sub.agentId && sub.agentId !== agentId) continue;
      try { sub.send(payload); } catch { /* connection may be closed */ }
    }
  }

  size(): number { return this.subscribers.size; }
}

export const ledgerBroadcaster = new LedgerBroadcaster();
