"use client";
import { Bot, ShieldCheck, ScrollText, Zap, TrendingUp, Activity, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockActivity = [
  { time: "00:00", actions: 12 }, { time: "04:00", actions: 8 },
  { time: "08:00", actions: 34 }, { time: "12:00", actions: 67 },
  { time: "16:00", actions: 89 }, { time: "20:00", actions: 45 },
  { time: "Now",   actions: 52 },
];

const mockAgents = [
  { name: "travel-booking-agent", status: "active",  actions: 342, lastSeen: "2m ago" },
  { name: "finance-report-agent", status: "active",  actions: 89,  lastSeen: "14m ago" },
  { name: "onboarding-agent",     status: "pending", actions: 0,   lastSeen: "never" },
];

const mockLedger = [
  { agent: "travel-booking-agent", action: "flights:book", result: "success",          time: "2m ago" },
  { agent: "travel-booking-agent", action: "card:charge",  result: "pending_approval", time: "2m ago" },
  { agent: "finance-report-agent", action: "reports:read", result: "success",          time: "14m ago" },
  { agent: "travel-booking-agent", action: "hotels:book",  result: "success",          time: "18m ago" },
];

const resultStyle: Record<string, string> = {
  success:          "text-emerald-400",
  failure:          "text-red-400",
  blocked:          "text-orange-400",
  pending_approval: "text-amber-400",
};

export default function OverviewPage({ user }: { user: { name?: string | null } }) {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-white/50">Here's what Apex is watching today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active agents",    value: "2",    delta: "+1 this week",  icon: Bot,         color: "text-drift-400 bg-drift-500/10" },
          { label: "Actions today",    value: "431",  delta: "+12% vs yesterday", icon: Activity, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Approvals pending",value: "1",    delta: "requires attention", icon: ShieldCheck, color: "text-amber-400 bg-amber-500/10" },
          { label: "Scope violations", value: "0",    delta: "all clear",     icon: Lock,        color: "text-emerald-400 bg-emerald-500/10" },
        ].map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-xs text-white/40">{delta}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart + agents */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Action volume</h2>
              <p className="text-xs text-white/40">Today · all agents</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+12%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockActivity}>
              <defs>
                <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                itemStyle={{ color: "#A78BFA" }}
              />
              <Area type="monotone" dataKey="actions" stroke="#6C47FF" strokeWidth={2} fill="url(#driftGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agents */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Registered agents</h2>
            <a href="/agents" className="text-xs text-drift-400 hover:text-drift-300">View all</a>
          </div>
          <div className="space-y-3">
            {mockAgents.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 rounded-xl p-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-drift-500/10">
                  <Bot className="h-4 w-4 text-drift-400" />
                  <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#080812]",
                    agent.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white/80">{agent.name}</p>
                  <p className="text-[10px] text-white/40">{agent.actions} actions · {agent.lastSeen}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent ledger */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Recent actions</h2>
          <a href="/ledger" className="text-xs text-drift-400 hover:text-drift-300">View ledger</a>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {mockLedger.map((entry, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", resultStyle[entry.result]?.replace("text-", "bg-") || "bg-white/40")} />
              <span className="text-xs font-mono text-white/60 truncate w-48">{entry.agent}</span>
              <span className="text-xs font-mono bg-white/[0.04] px-2 py-0.5 rounded text-white/70">{entry.action}</span>
              <span className={cn("ml-auto text-xs font-medium", resultStyle[entry.result])}>{entry.result}</span>
              <span className="text-[10px] text-white/30 w-16 text-right">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Apex status */}
      <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/15 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Apex is active</h3>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            </div>
            <p className="mt-1 text-xs text-white/50">Monitoring 2 agents · 0 anomalies detected · Last sweep: 30 seconds ago</p>
            <div className="mt-3 flex gap-4 text-xs">
              {[
                { label: "ScopeGraph checks", value: "431" },
                { label: "CIBA requests",     value: "1" },
                { label: "Tokens rotated",    value: "0" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-white/30">{label}: </span>
                  <span className="text-emerald-400 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>All clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}
