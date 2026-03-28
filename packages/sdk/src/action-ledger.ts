import { AxiosInstance } from "axios";
import { LedgerEntry, ActionResult } from "./types";

export class ActionLedger {
  constructor(private readonly http: AxiosInstance) {}

  async log(entry: Omit<LedgerEntry, "id" | "timestamp">): Promise<LedgerEntry> {
    const { data } = await this.http.post<LedgerEntry>(`/agents/${entry.agentId}/ledger`, entry);
    return data;
  }

  async query(agentId: string, opts?: {
    from?: Date;
    to?: Date;
    action?: string;
    result?: ActionResult;
    limit?: number;
    page?: number;
  }): Promise<{ entries: LedgerEntry[]; total: number }> {
    const { data } = await this.http.get<{ entries: LedgerEntry[]; total: number }>(
      `/agents/${agentId}/ledger`, { params: opts }
    );
    return data;
  }

  async getEntry(agentId: string, entryId: string): Promise<LedgerEntry> {
    const { data } = await this.http.get<LedgerEntry>(`/agents/${agentId}/ledger/${entryId}`);
    return data;
  }

  async exportCSV(agentId: string, from: Date, to: Date): Promise<string> {
    const { data } = await this.http.get<string>(`/agents/${agentId}/ledger/export`, {
      params: { from: from.toISOString(), to: to.toISOString(), format: "csv" },
      responseType: "text",
    });
    return data;
  }

  subscribe(agentId: string, onEntry: (entry: LedgerEntry) => void, onError?: (err: Error) => void): () => void {
    const baseUrl = this.http.defaults.baseURL ?? "http://localhost:4000/v1";
    const wsUrl = baseUrl.replace(/^http/, "ws") + `/agents/${agentId}/ledger/stream`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (e) => { try { onEntry(JSON.parse(e.data as string) as LedgerEntry); } catch { /* noop */ } };
    ws.onerror = (e) => onError?.(new Error(`WebSocket error: ${JSON.stringify(e)}`));
    return () => ws.close();
  }
}
