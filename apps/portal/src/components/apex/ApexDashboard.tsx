"use client";
import { useState } from "react";
import { Zap, Shield, AlertTriangle, CheckCircle2, Bot, RotateCcw, Eye } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import toast from "react-hot-toast";

const ANOMALIES_INIT = [
  { id: "a1", agentId: "travel-booking-agent", issue: "Unusual spike: 47 actions in 10 min", severity: "medium" as const, detectedAt: new Date(Date.now() - 300000) },
  { id: "a2", agentId: "finance-report-agent",  issue: "Certificate expires in 3 days",       severity: "low"    as const, detectedAt: new Date(Date.now() - 900000) },
];
const GOVERNED = [
  { id: "drift_agt_abc", name: "travel-booking-agent", status: "active",  actions24h: 342, successRate: 98.2, lastSeen: new Date(Date.now()-120000), anomalies: 1 },
  { id: "drift_agt_def", name: "finance-report-agent", status: "active",  actions24h: 89,  successRate: 100,  lastSeen: new Date(Date.now()-840000), anomalies: 1 },
  { id: "drift_agt_ghi", name: "onboarding-agent",     status: "pending", actions24h: 0,   successRate: 0,    lastSeen: null,                        anomalies: 0 },
];
const RADAR = [
  { metric: "Scope compliance", value: 98 }, { metric: "Cert validity", value: 85 },
  { metric: "Action success", value: 99 },   { metric: "Step-up coverage", value: 100 },
  { metric: "Chain integrity", value: 100 },
];
const SWEEP_DATA = [
  { time: "06:00", v: 0 }, { time: "08:00", v: 0 }, { time: "10:00", v: 1 },
  { time: "12:00", v: 0 }, { time: "14:00", v: 2 }, { time: "16:00", v: 1 }, { time: "Now", v: 2 },
];

export default function ApexDashboard() {
  const [sweeping, setSweeping] = useState(false);
  const [anomalies, setAnomalies] = useState(ANOMALIES_INIT);

  const runSweep = async () => {
    setSweeping(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSweeping(false);
    toast.success("Apex sweep complete — 2 anomalies detected");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080812] animate-pulse-soft" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Apex</h1>
            <p className="text-sm text-white/50">Meta-agent · governing {GOVERNED.length} agents</p>
          </div>
        </div>
        <button onClick={runSweep} disabled={sweeping} className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60">
          <RotateCcw className={cn("h-4 w-4", sweeping && "animate-spin")} />
          {sweeping ? "Sweeping…" : "Run sweep"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Agents monitored",   value: "3",    sub: "2 active",        icon: Bot,           color: "text-drift-400 bg-drift-500/10" },
          { label: "Anomalies",          value: String(anomalies.length), sub: "last sweep", icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10" },
          { label: "Scope violations",   value: "0",    sub: "all time",        icon: Shield,        color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Chain integrity",    value: "100%", sub: "all valid",       icon: CheckCircle2,  color: "text-emerald-400 bg-emerald-500/10" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-white/30">{sub}</p>
              </div>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", color)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {anomalies.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Active anomalies
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{anomalies.length}</span>
          </h2>
          <div className="space-y-2">
            {anomalies.map((a) => (
              <div key={a.id} className={cn("flex items-start gap-4 rounded-xl p-4 border", a.severity === "medium" ? "bg-amber-950/20 border-amber-500/20" : "bg-white/[0.02] border-white/[0.06]")}>
                <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5", a.severity === "medium" ? "text-amber-400" : "text-white/30")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono text-white/70">{a.agentId}</code>
                    <span className={cn("text-[10px] font-semibold rounded px-1.5 py-0.5 uppercase", a.severity === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-white/[0.06] text-white/40")}>{a.severity}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{a.issue}</p>
                  <p className="text-[10px] text-white/25 mt-1">{formatRelativeTime(a.detectedAt)}</p>
                </div>
                <button onClick={() => setAnomalies((x) => x.filter((y) => y.id !== a.id))} className="text-xs text-white/30 hover:text-white/60 transition-colors shrink-0">Dismiss</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Security health radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              <Radar name="Health" dataKey="value" stroke="#6C47FF" fill="#6C47FF" fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Anomalies over time (today)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SWEEP_DATA}>
              <defs>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#FCD34D" }} />
              <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="url(#ag2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-400" />
          Governed agents
        </h2>
        <div className="space-y-2">
          {GOVERNED.map((agent) => (
            <div key={agent.id} className="flex items-center gap-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 hover:bg-white/[0.04] transition-colors">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-drift-500/10">
                <Bot className="h-4 w-4 text-drift-400" />
                <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#080812]", agent.status === "active" ? "bg-emerald-400" : "bg-amber-400")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 font-mono truncate">{agent.name}</p>
                <p className="text-xs text-white/40">
                  {agent.actions24h} actions · {agent.successRate > 0 ? `${agent.successRate}% success` : "no activity"}
                  {agent.lastSeen && <> · {formatRelativeTime(agent.lastSeen)}</>}
                </p>
              </div>
              {agent.anomalies > 0 && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded px-2 py-0.5">{agent.anomalies} anomaly</span>}
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Zap className="h-3 w-3" />
                <span className="hidden sm:block">Watching</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
