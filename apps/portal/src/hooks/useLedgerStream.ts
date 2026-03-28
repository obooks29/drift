/**
 * Real-time ActionLedger WebSocket hook
 * Connects to the Drift API WebSocket stream and maintains a live feed
 */
"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export interface LiveLedgerEntry {
  id: string;
  agentId: string;
  action: string;
  resource: string;
  result: "success" | "failure" | "blocked" | "pending_approval";
  metadata?: Record<string, unknown>;
  durationMs?: number;
  timestamp: string;
}

interface UseLedgerStreamOpts {
  agentId?: string;
  maxEntries?: number;
  onEntry?: (entry: LiveLedgerEntry) => void;
}

export function useLedgerStream({ agentId, maxEntries = 100, onEntry }: UseLedgerStreamOpts = {}) {
  const [entries, setEntries] = useState<LiveLedgerEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectCount = useRef(0);

  const connect = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "ws://localhost:4000";
    const wsUrl = new URL(`${apiUrl.replace(/^http/, "ws")}/v1/ledger/stream`);
    if (agentId) wsUrl.searchParams.set("agentId", agentId);

    const socket = new WebSocket(wsUrl.toString());
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setError(null);
      reconnectCount.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as LiveLedgerEntry & { type?: string };
        if (data.type === "connected") return; // handshake message
        const entry = data as LiveLedgerEntry;
        setEntries((prev) => [entry, ...prev].slice(0, maxEntries));
        onEntry?.(entry);
      } catch { /* ignore parse errors */ }
    };

    socket.onclose = () => {
      setConnected(false);
      // Exponential back-off reconnect: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30_000);
      reconnectCount.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      setError("WebSocket connection failed — retrying…");
      socket.close();
    };
  }, [agentId, maxEntries, onEntry]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const clear = () => setEntries([]);

  return { entries, connected, error, clear };
}
