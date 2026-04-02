"use client";
import { useState } from "react";
import { Bot, Shield, ScrollText, Zap, CheckCircle2, AlertTriangle, Activity, Plus } from "lucide-react";
import Link from "next/link";

const AGENTS = [
  { id: "drift_agt_abc123", name: "travel-booking-agent", status: "active", actions: 342, successRate: 98.2, scopes: ["flights:book","hotels:book","card:charge"], lastSeen: "2 minutes ago" },
  { id: "drift_agt_def456", name: "finance-report-agent", status: "active", actions: 89, successRate: 100, scopes: ["reports:read","email:send"], lastSeen: "14 minutes ago" },
  { id: "drift_agt_ghi789", name: "onboarding-agent", status: "pending", actions: 0, successRate: 0, scopes: ["calendar:read","email:send"], lastSeen: "Never" },
];

export default function AgentsPage() {
  const [agents] = useState(AGENTS);
  return (
    <div className="min-h-screen bg-[#06060F] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 bg-[#06060F]/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF] shadow-lg shadow-[#6C47FF]/30"><Zap className="h-4 w-4 text-white"/></div>
            <span className="font-bold text-lg">Drift</span>
            <span className="text-white/30">/</span>
            <span className="text-white/60">Agents</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>Apex active</div>
            <Link href="/api/auth/logout" className="text-xs text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/[0.06]">Sign out</Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {label:"Total agents",value:"3",icon:Bot,color:"text-[#6C47FF]"},
            {label:"Active agents",value:"2",icon:Activity,color:"text-emerald-400"},
            {label:"Actions today",value:"431",icon:ScrollText,color:"text-blue-400"},
            {label:"Scope violations",value:"0",icon:Shield,color:"text-amber-400"},
          ].map(({label,value,icon:Icon,color})=>(
            <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{label}</span>
                <Icon className={`h-4 w-4 ${color}`}/>
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Apex status */}
        <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Zap className="h-5 w-5 text-emerald-400"/>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#06060F] animate-pulse"/>
            </div>
            <div>
              <p className="font-semibold text-white">Apex is watching</p>
              <p className="text-sm text-white/50">AI meta-agent monitoring all {agents.length} registered agents Â· 0 anomalies detected</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
              <span className="text-sm text-emerald-400 font-medium">All clear</span>
            </div>
          </div>
        </div>

        {/* Agents list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Registered Agents</h2>
            <a href="http://localhost:3001" className="flex items-center gap-2 rounded-xl bg-[#6C47FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a3acc] transition-colors">
              <Plus className="h-4 w-4"/>Watch demo
            </a>
          </div>
          <div className="space-y-3">
            {agents.map(agent=>(
              <div key={agent.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6C47FF]/10">
                    <Bot className="h-5 w-5 text-[#6C47FF]"/>
                    <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#06060F] ${agent.status==="active"?"bg-emerald-400":"bg-amber-400"}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-semibold text-white">{agent.name}</code>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${agent.status==="active"?"bg-emerald-500/10 text-emerald-400":"bg-amber-500/10 text-amber-400"}`}>{agent.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-white/40 mb-3">AgentID: <code className="text-white/50">{agent.id}</code> Â· Last seen: {agent.lastSeen}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.scopes.map(s=><span key={s} className={`text-[10px] font-mono rounded px-2 py-0.5 ${s==="card:charge"?"bg-amber-500/10 text-amber-300":"bg-[#6C47FF]/10 text-[#A78BFA]"}`}>{s}</span>)}
                    </div>
                    <div className="flex items-center gap-6 text-xs text-white/40">
                      <span>ðŸ“Š {agent.actions} actions</span>
                      {agent.successRate>0&&<span>âœ“ {agent.successRate}% success rate</span>}
                      <span className="flex items-center gap-1 text-emerald-400"><Zap className="h-3 w-3"/>Apex watching</span>
                    </div>
                  </div>
                  {agent.status==="active"&&<div className="flex items-center gap-1.5 text-xs text-emerald-400 shrink-0"><CheckCircle2 className="h-4 w-4"/>Healthy</div>}
                  {agent.status==="pending"&&<div className="flex items-center gap-1.5 text-xs text-amber-400 shrink-0"><AlertTriangle className="h-4 w-4"/>Pending</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ActionLedger preview */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
            <ScrollText className="h-4 w-4 text-white/40"/>
            <span className="font-semibold text-white">Recent ActionLedger entries</span>
            <span className="ml-auto text-xs text-[#6C47FF]">Live Â· updating in real-time</span>
          </div>
          {[
            {action:"card:charge",agent:"travel-booking-agent",result:"success",detail:"$1,414.50 charged Â· CIBA approved by user",time:"2m ago"},
            {action:"ciba:approved",agent:"travel-booking-agent",result:"success",detail:"Human approved Â· ConsentChain updated",time:"2m ago"},
            {action:"scope:check",agent:"travel-booking-agent",result:"pending_approval",detail:"card:charge â†’ STEP-UP REQUIRED",time:"3m ago"},
            {action:"hotels:search",agent:"travel-booking-agent",result:"success",detail:"London Â· Canary Wharf Marriott selected",time:"4m ago"},
            {action:"flights:search",agent:"travel-booking-agent",result:"success",detail:"LOS â†’ LHR Â· 3 results Â· Token Vault supplied credential",time:"5m ago"},
          ].map((e,i)=>(
            <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
              <span className={`h-2 w-2 rounded-full shrink-0 ${e.result==="success"?"bg-emerald-400":e.result==="pending_approval"?"bg-amber-400 animate-pulse":"bg-red-400"}`}/>
              <code className="text-xs font-mono text-white/70 w-40 shrink-0">{e.action}</code>
              <span className="text-xs text-white/40 truncate flex-1">{e.detail}</span>
              <span className="text-[10px] text-white/25 shrink-0">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
