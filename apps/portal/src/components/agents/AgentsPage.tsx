"use client";
import { useState } from "react";
import { Bot, Plus, Search, MoreHorizontal, Shield, ShieldOff, Trash2, RefreshCw, ExternalLink, Zap, Copy, Check } from "lucide-react";
import { cn, agentStatusColor, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import RegisterAgentModal from "./RegisterAgentModal";

const MOCK_AGENTS = [
  {
    id: "drift_agt_abc123",
    name: "travel-booking-agent",
    description: "Books flights, hotels, and charges the corporate card for business trips.",
    status: "active",
    delegatedBy: "tolu@company.com",
    governedByApex: true,
    createdAt: new Date(Date.now() - 86400000 * 3),
    actions: 342,
    lastSeen: new Date(Date.now() - 120000),
    scopes: [
      { resource: "flights", action: "book", stepUpRequired: false },
      { resource: "hotels",  action: "book", stepUpRequired: false },
      { resource: "card",    action: "charge", stepUpRequired: true },
    ],
  },
  {
    id: "drift_agt_def456",
    name: "finance-report-agent",
    description: "Generates financial reports and sends summaries to Slack.",
    status: "active",
    delegatedBy: "tolu@company.com",
    governedByApex: true,
    createdAt: new Date(Date.now() - 86400000 * 1),
    actions: 89,
    lastSeen: new Date(Date.now() - 840000),
    scopes: [
      { resource: "reports", action: "read",  stepUpRequired: false },
      { resource: "slack",   action: "send",  stepUpRequired: false },
    ],
  },
  {
    id: "drift_agt_ghi789",
    name: "onboarding-agent",
    description: "Guides new employees through onboarding tasks.",
    status: "pending",
    delegatedBy: "tolu@company.com",
    governedByApex: false,
    createdAt: new Date(Date.now() - 3600000),
    actions: 0,
    lastSeen: null,
    scopes: [],
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.delegatedBy.toLowerCase().includes(search.toLowerCase())
  );

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Agent ID copied");
  };

  const suspendAgent = (id: string) => {
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: "suspended" } : a));
    toast.success("Agent suspended");
  };

  const reinstateAgent = (id: string) => {
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: "active" } : a));
    toast.success("Agent reinstated");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="mt-1 text-sm text-white/50">{agents.length} registered · {agents.filter(a => a.status === "active").length} active</p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 rounded-xl bg-drift-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-drift-600 transition-colors shadow-lg shadow-drift-500/20"
        >
          <Plus className="h-4 w-4" />
          Register agent
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
        />
      </div>

      {/* Agent cards */}
      <div className="space-y-3">
        {filtered.map((agent) => (
          <div key={agent.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/10 transition-colors">
            {/* Card header */}
            <div
              className="flex items-center gap-4 p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
            >
              {/* Icon */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-drift-500/10 ring-1 ring-drift-500/20">
                <Bot className="h-5 w-5 text-drift-400" />
                {agent.governedByApex && (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
                    <Zap className="h-2.5 w-2.5 text-emerald-400" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-medium text-sm text-white">{agent.name}</span>
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", agentStatusColor(agent.status))}>
                    {agent.status}
                  </span>
                  {agent.governedByApex && (
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 uppercase tracking-wide">
                      Apex
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                  <span>{agent.delegatedBy}</span>
                  <span>·</span>
                  <span>{agent.actions} actions</span>
                  {agent.lastSeen && (
                    <>
                      <span>·</span>
                      <span>{formatRelativeTime(agent.lastSeen)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); copyId(agent.id); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-mono text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                >
                  {copiedId === agent.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {agent.id.slice(0, 18)}…
                </button>
                {agent.status === "active" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); suspendAgent(agent.id); }}
                    className="rounded-lg p-2 text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Suspend agent"
                  >
                    <ShieldOff className="h-4 w-4" />
                  </button>
                ) : agent.status === "suspended" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); reinstateAgent(agent.id); }}
                    className="rounded-lg p-2 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Reinstate agent"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Expanded: scope grants */}
            {expandedId === agent.id && (
              <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 animate-fade-in">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wide mb-3">Scope grants</p>
                {agent.scopes.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No scopes granted yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {agent.scopes.map((s) => (
                      <div
                        key={`${s.resource}:${s.action}`}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono",
                          s.stepUpRequired
                            ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
                            : "bg-drift-500/10 text-drift-300 ring-1 ring-drift-500/20"
                        )}
                      >
                        {s.stepUpRequired && <Shield className="h-3 w-3 text-amber-400" />}
                        {s.resource}:{s.action}
                        {s.stepUpRequired && <span className="text-[9px] font-sans font-medium text-amber-400/80 ml-0.5">step-up</span>}
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-white/30">{agent.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showRegister && <RegisterAgentModal onClose={() => setShowRegister(false)} onCreated={(a) => {
        setAgents((prev) => [...prev, a as any]);
        setShowRegister(false);
        toast.success(`Agent "${a.name}" registered`);
      }} />}
    </div>
  );
}
