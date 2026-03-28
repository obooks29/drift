"use client";
import { useState, useMemo } from "react";
import { ScrollText, Filter, Download, Search, ChevronDown, RefreshCw, CheckCircle2, XCircle, Clock, ShieldX } from "lucide-react";
import { cn, formatDateTime, actionResultColor } from "@/lib/utils";

const RESULTS = ["success", "failure", "blocked", "pending_approval"] as const;
type Result = typeof RESULTS[number];

const MOCK_ENTRIES = Array.from({ length: 60 }, (_, i) => {
  const agents = ["travel-booking-agent", "finance-report-agent"];
  const actions = [
    { action: "flights:book",   resource: "flights" },
    { action: "hotels:book",    resource: "hotels" },
    { action: "card:charge",    resource: "card" },
    { action: "reports:read",   resource: "reports" },
    { action: "slack:send",     resource: "slack" },
    { action: "calendar:read",  resource: "calendar" },
  ];
  const results: Result[] = ["success","success","success","success","failure","pending_approval","blocked"];
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
  const actionObj = pick(actions);
  return {
    id: `led_${Math.random().toString(36).slice(2, 9)}`,
    agentId: pick(agents),
    action: actionObj.action,
    resource: actionObj.resource,
    result: pick(results),
    metadata: { ip: "10.0.0.1", userAgent: "DriftSDK/0.1" },
    timestamp: new Date(Date.now() - i * 1000 * 60 * (2 + Math.random() * 8)),
    durationMs: Math.floor(80 + Math.random() * 400),
    tokenUsed: `tvt_${Math.random().toString(36).slice(2, 12)}`,
  };
});

const resultIcon = (r: string) => {
  switch (r) {
    case "success":          return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "failure":          return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    case "blocked":          return <ShieldX className="h-3.5 w-3.5 text-orange-400" />;
    case "pending_approval": return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    default:                 return null;
  }
};

const PAGE_SIZE = 20;

export default function LedgerPage() {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<Result | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const agents = useMemo(() => [...new Set(MOCK_ENTRIES.map((e) => e.agentId))], []);

  const filtered = useMemo(() =>
    MOCK_ENTRIES.filter((e) =>
      (resultFilter === "all" || e.result === resultFilter) &&
      (agentFilter === "all" || e.agentId === agentFilter) &&
      (search === "" || e.action.includes(search) || e.agentId.includes(search) || e.id.includes(search))
    ),
  [search, resultFilter, agentFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const stats = useMemo(() => ({
    success:          MOCK_ENTRIES.filter((e) => e.result === "success").length,
    failure:          MOCK_ENTRIES.filter((e) => e.result === "failure").length,
    blocked:          MOCK_ENTRIES.filter((e) => e.result === "blocked").length,
    pending_approval: MOCK_ENTRIES.filter((e) => e.result === "pending_approval").length,
  }), []);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Action Ledger</h1>
          <p className="mt-1 text-sm text-white/50">Append-only audit trail · {MOCK_ENTRIES.length} total entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...RESULTS] as const).map((r) => {
          const count = r === "all" ? MOCK_ENTRIES.length : stats[r];
          const colors: Record<string, string> = {
            all:              "text-white/60 bg-white/[0.06] ring-white/10",
            success:          "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
            failure:          "text-red-400 bg-red-500/10 ring-red-500/20",
            blocked:          "text-orange-400 bg-orange-500/10 ring-orange-500/20",
            pending_approval: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
          };
          const label = r === "pending_approval" ? "pending" : r;
          return (
            <button
              key={r}
              onClick={() => { setResultFilter(r); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all",
                colors[r],
                resultFilter === r ? "ring-2 scale-105" : "opacity-70 hover:opacity-100"
              )}
            >
              {r !== "all" && resultIcon(r)}
              {label}
              <span className="font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by action, agent, entry ID…"
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={agentFilter}
            onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.08] pl-3.5 pr-8 py-2 text-sm text-white/70 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
          >
            <option value="all" className="bg-[#0F0F24]">All agents</option>
            {agents.map((a) => <option key={a} value={a} className="bg-[#0F0F24]">{a}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          {["Action", "Agent", "Result", "Duration", "Timestamp"].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <ScrollText className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No entries match your filters</p>
            </div>
          ) : (
            paginated.map((entry) => (
              <div key={entry.id}>
                <div
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <span className="text-xs font-mono text-white/70 truncate">{entry.action}</span>
                  <span className="text-[10px] font-mono text-white/40 truncate max-w-[140px]">{entry.agentId.replace("-agent", "")}</span>
                  <div className="flex items-center gap-1.5">
                    {resultIcon(entry.result)}
                    <span className={cn("text-xs font-medium hidden sm:block", actionResultColor(entry.result))}>
                      {entry.result === "pending_approval" ? "pending" : entry.result}
                    </span>
                  </div>
                  <span className="text-xs text-white/30 font-mono">{entry.durationMs}ms</span>
                  <span className="text-[10px] text-white/30">{formatDateTime(entry.timestamp)}</span>
                </div>

                {/* Expanded detail */}
                {expanded === entry.id && (
                  <div className="px-5 pb-4 bg-white/[0.015] border-t border-white/[0.04] animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                      {[
                        { label: "Entry ID",    value: entry.id },
                        { label: "Agent",       value: entry.agentId },
                        { label: "Resource",    value: entry.resource },
                        { label: "Token used",  value: entry.tokenUsed ?? "—" },
                        { label: "Duration",    value: `${entry.durationMs}ms` },
                        { label: "Timestamp",   value: formatDateTime(entry.timestamp) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-xs font-mono text-white/60 truncate">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, page - 3), Math.min(totalPages, page + 2)
            ).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                  p === page ? "bg-drift-500 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.06]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
