"use client";
import { useState } from "react";
import { Bot, Zap, Shield, ShieldOff, ScrollText, Link2, Copy, Check, ExternalLink, ChevronLeft, RotateCcw, Activity } from "lucide-react";
import { cn, agentStatusColor, formatDateTime, formatRelativeTime, actionResultColor, maskToken } from "@/lib/utils";
import { useLedgerStream } from "@/hooks/useLedgerStream";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Link from "next/link";

// Mock agent detail data — Phase 2 wires to real API
const getMockAgent = (id: string) => ({
  id,
  name: "travel-booking-agent",
  description: "Books flights and hotels, charges the corporate card for approved business trips.",
  status: "active",
  delegatedBy: "tolu@company.com",
  governedByApex: true,
  auth0ClientId: `auth0|${id.slice(-8)}m2m`,
  trustCertificate: `eyJhbGciOiJIUzI1NiIsInR5cCI6ImRyaWZ0K2p3dCJ9.${id}`,
  createdAt: new Date(Date.now() - 86400000 * 3),
  scopes: [
    { resource: "flights",  action: "book",   stepUpRequired: false, tokenVaultKey: "vault:usr_abc:amadeus" },
    { resource: "hotels",   action: "book",   stepUpRequired: false, tokenVaultKey: "vault:usr_abc:booking" },
    { resource: "card",     action: "charge", stepUpRequired: true,  tokenVaultKey: "vault:usr_abc:stripe" },
    { resource: "calendar", action: "read",   stepUpRequired: false, tokenVaultKey: "vault:usr_abc:google" },
  ],
  consentChain: [
    { id: "con_001", action: "register_agent", approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 86400000 * 3), signature: "sha256:a1b2c3d4e5f6" },
    { id: "con_002", action: "grant_scope",    approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 86400000 * 3 + 5000), signature: "sha256:b2c3d4e5f6a1" },
    { id: "con_003", action: "approve_action", approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 3600000), signature: "sha256:c3d4e5f6a1b2" },
  ],
  activityChart: [
    { hour: "00:00", count: 4 }, { hour: "04:00", count: 2 }, { hour: "08:00", count: 18 },
    { hour: "12:00", count: 34 }, { hour: "16:00", count: 51 }, { hour: "20:00", count: 28 }, { hour: "Now", count: 15 },
  ],
});

const actionColor: Record<string, string> = {
  register_agent: "text-drift-400 bg-drift-500/10",
  grant_scope:    "text-emerald-400 bg-emerald-500/10",
  approve_action: "text-emerald-400 bg-emerald-500/10",
  reject_action:  "text-red-400 bg-red-500/10",
  suspend_agent:  "text-amber-400 bg-amber-500/10",
};

export default function AgentDetailPage({ agentId }: { agentId: string }) {
  const agent = getMockAgent(agentId);
  const [tab, setTab] = useState<"overview" | "scopes" | "ledger" | "consent">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const { entries: liveEntries, connected } = useLedgerStream({ agentId, maxEntries: 50 });

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Copied");
  };

  const TABS = [
    { key: "overview", label: "Overview",      icon: Activity },
    { key: "scopes",   label: "Scope Graph",   icon: Shield },
    { key: "ledger",   label: "Live Ledger",   icon: ScrollText },
    { key: "consent",  label: "Consent Chain", icon: Link2 },
  ] as const;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Back + Header */}
      <div className="space-y-4">
        <Link href="/agents" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors w-fit">
          <ChevronLeft className="h-3.5 w-3.5" /> All agents
        </Link>

        <div className="flex items-start gap-4 flex-wrap">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-drift-500/10 ring-1 ring-drift-500/20">
            <Bot className="h-7 w-7 text-drift-400" />
            {agent.governedByApex && (
              <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-[#080812]">
                <Zap className="h-2.5 w-2.5 text-emerald-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-white font-mono">{agent.name}</h1>
              <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", agentStatusColor(agent.status))}>
                {agent.status}
              </span>
              {agent.governedByApex && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-md px-2 py-0.5 uppercase tracking-wide">Apex</span>
              )}
            </div>
            <p className="mt-1 text-sm text-white/50">{agent.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-white/30 flex-wrap">
              <span>Delegated by <span className="text-white/50">{agent.delegatedBy}</span></span>
              <span>·</span>
              <span>Created {formatRelativeTime(agent.createdAt)}</span>
              <span>·</span>
              <span>{agent.scopes.length} scope grants</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Rotate cert
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors">
              <ShieldOff className="h-3.5 w-3.5" /> Suspend
            </button>
          </div>
        </div>
      </div>

      {/* Identity card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Agent ID",        value: agent.id,             monospace: true },
          { label: "Auth0 Client ID", value: agent.auth0ClientId,  monospace: true },
          { label: "Trust cert",      value: maskToken(agent.trustCertificate), monospace: true },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-white/60 font-mono truncate flex-1">{value}</code>
              <button onClick={() => copy(value, label)} className="shrink-0 text-white/20 hover:text-white/60 transition-colors">
                {copied === label ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
              tab === key
                ? "border-drift-500 text-drift-300"
                : "border-transparent text-white/40 hover:text-white/70"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Chart */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Action volume (24h)</h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-400 animate-pulse-soft" : "bg-white/20")} />
                  <span className="text-white/40">{connected ? "Live" : "Offline"}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={agent.activityChart}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6C47FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 8, fontSize: 11 }} itemStyle={{ color: "#A78BFA" }} labelStyle={{ color: "rgba(255,255,255,0.5)" }} />
                  <Area type="monotone" dataKey="count" stroke="#6C47FF" strokeWidth={2} fill="url(#ag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total actions", value: "342" },
                { label: "Success rate",  value: "98.2%" },
                { label: "Step-up calls", value: "12" },
                { label: "Avg latency",   value: "187ms" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-xs text-white/40">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scope Graph */}
        {tab === "scopes" && (
          <div className="space-y-3">
            <p className="text-xs text-white/50">All scope grants for this agent. Amber = requires CIBA step-up before execution.</p>
            {agent.scopes.map((scope) => (
              <div key={`${scope.resource}:${scope.action}`} className={cn(
                "rounded-xl border p-4 flex items-center gap-4",
                scope.stepUpRequired
                  ? "bg-amber-950/20 border-amber-500/20"
                  : "bg-white/[0.02] border-white/[0.06]"
              )}>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  scope.stepUpRequired ? "bg-amber-500/10" : "bg-drift-500/10"
                )}>
                  {scope.stepUpRequired ? <Shield className="h-4 w-4 text-amber-400" /> : <Shield className="h-4 w-4 text-drift-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className={cn("text-sm font-mono font-semibold", scope.stepUpRequired ? "text-amber-300" : "text-drift-300")}>
                      {scope.resource}:{scope.action}
                    </code>
                    {scope.stepUpRequired && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">STEP-UP REQUIRED</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{maskToken(scope.tokenVaultKey)}</p>
                </div>
                <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded px-2 py-1">ACTIVE</div>
              </div>
            ))}
          </div>
        )}

        {/* Live Ledger */}
        {tab === "ledger" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">Real-time action stream via WebSocket</p>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-400 animate-pulse-soft" : "bg-white/20")} />
                <span className="text-white/40">{connected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              {liveEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/30">
                  <Activity className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">Waiting for live events…</p>
                  <p className="text-xs mt-1">Actions will appear here in real-time</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {liveEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors animate-fade-in">
                      <span className="text-xs font-mono text-white/60">{entry.action}</span>
                      <span className={cn("ml-auto text-xs font-medium", actionResultColor(entry.result))}>{entry.result}</span>
                      <span className="text-xs text-white/30 font-mono">{entry.durationMs}ms</span>
                      <span className="text-[10px] text-white/25">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consent Chain */}
        {tab === "consent" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-white/50">Chain integrity verified · {agent.consentChain.length} records</span>
            </div>
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.06]" />
              <div className="space-y-2">
                {[...agent.consentChain].reverse().map((record) => (
                  <div key={record.id} className="flex items-start gap-4">
                    <div className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-[#080812]", actionColor[record.action])}>
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5 mb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={cn("text-[10px] font-semibold rounded px-2 py-0.5", actionColor[record.action])}>
                          {record.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-white/30">{formatDateTime(record.timestamp)}</span>
                      </div>
                      <p className="mt-1.5 text-[10px] font-mono text-white/20">{record.signature}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
