"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboardStats() {
  const { data: stats, isLoading: statsLoading } = useSWR("/api/ledger/stats", fetcher, { refreshInterval: 15_000 });
  const { data: chart, isLoading: chartLoading } = useSWR("/api/ledger/chart", fetcher, { refreshInterval: 60_000 });
  const { data: apexStatus } = useSWR("/api/apex/status", fetcher, { refreshInterval: 30_000 });
  const { data: pendingCIBA } = useSWR("/api/consent/pending", fetcher, { refreshInterval: 10_000 });

  return {
    stats: stats ?? { total: 0, byResult: {}, topActions: [] },
    chartData: chart?.buckets ?? [],
    apexStatus: apexStatus ?? { apex: "active", agentsMonitored: 0, anomaliesLastHour: 0 },
    pendingCIBA: pendingCIBA ?? [],
    isLoading: statsLoading || chartLoading,
  };
}
