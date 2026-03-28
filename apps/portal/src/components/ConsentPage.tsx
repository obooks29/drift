"use client";
import { useState } from "react";
import { ShieldCheck, Link2, Clock, CheckCircle2, XCircle, AlertCircle, Smartphone } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_CIBA = [
  {
    id: "ciba_abc123",
    agentId: "travel-booking-agent",
    action: "card:charge",
    description: 'Travel agent wants to charge $847.50 to corporate card for flight LAX→LHR on Jun 12.',
    status: "pending" as const,
    bindingMessage: "DRIFT-7X4K",
    expiresAt: new Date(Date.now() + 240_000),
    metadata: { amount: 847.50, currency: "USD", merchant: "United Airlines" },
  },
];

const MOCK_CHAIN = [
  { id: "con_001", agentId: "travel-booking-agent", action: "register_agent",  approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 86400000 * 3), signature: "sha256:a1b2c3d4" },
  { id: "con_002", agentId: "travel-booking-agent", action: "grant_scope",     approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 86400000 * 3 + 5000), signature: "sha256:e5f6a7b8" },
  { id: "con_003", agentId: "finance-report-agent", action: "register_agent",  approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 86400000 * 1), signature: "sha256:c9d0e1f2" },
  { id: "con_004", agentId: "travel-booking-agent", action: "approve_action",  approvedBy: "tolu@company.com", timestamp: new Date(Date.now() - 3600000), signature: "sha256:a3b4c5d6" },
];

const actionLabel: Record<string, string> = {
  register_agent: "Agent registered",
  grant_scope:    "Scope granted",
  revoke_scope:   "Scope revoked",
  approve_action: "Action approved",
  reject_action:  "Action rejected",
  suspend_agent:  "Agent suspended",
};

const actionColor: Record<string, string> = {
  register_agent: "text-drift-400 bg-drift-500/10",
  grant_scope:    "text-emerald-400 bg-emerald-500/10",
  revoke_scope:   "text-orange-400 bg-orange-500/10",
  approve_action: "text-emerald-400 bg-emerald-500/10",
  reject_action:  "text-red-400 bg-red-500/10",
  suspend_agent:  "text-amber-400 bg-amber-500/10",
};

export default function ConsentPage() {
  const [cibaRequests, setCibaRequests] = useState(MOCK_CIBA);
  const [processing, setProcessing] = useState<string | null>(null);

  const resolve = async (id: string, decision: "approved" | "rejected") => {
    setProcessing(id);
    await new Promise((r) => setTimeout(r, 800));
    setCibaRequests((prev) => prev.filter((r) => r.id !== id));
    setProcessing(null);
    if (decision === "approved") {
      toast.success("Action approved — agent proceeding");
    } else {
      toast.error("Action rejected — agent notified");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Consent Chain</h1>
        <p className="mt-1 text-sm text-white/50">Immutable record of all human approvals · {MOCK_CHAIN.length} records</p>
      </div>

      {/* Pending CIBA requests */}
      {cibaRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">Pending approvals</h2>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{cibaRequests.length}</span>
          </div>

          {cibaRequests.map((req) => {
            const secondsLeft = Math.max(0, Math.floor((req.expiresAt.getTime() - Date.now()) / 1000));
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            return (
              <div key={req.id} className="rounded-2xl bg-amber-950/20 border border-amber-500/20 p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-white">{req.description}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-white/40 flex-wrap">
                          <span className="font-mono">{req.agentId}</span>
                          <span>·</span>
                          <span className="font-mono bg-white/[0.06] px-2 py-0.5 rounded">{req.action}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mins}:{secs.toString().padStart(2, "0")} left
                          </span>
                        </div>
                      </div>
                      {/* Binding message */}
                      <div className="shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center">
                        <p className="text-[9px] font-semibold text-amber-400/70 uppercase tracking-wider mb-0.5">Binding code</p>
                        <p className="text-sm font-mono font-bold text-amber-300">{req.bindingMessage}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    {req.metadata && (
                      <div className="mt-3 flex gap-3 text-xs flex-wrap">
                        {Object.entries(req.metadata).map(([k, v]) => (
                          <span key={k} className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-white/50">
                            <span className="text-white/30">{k}:</span> <span className="font-mono text-white/70">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Approve / Reject */}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => resolve(req.id, "approved")}
                        disabled={!!processing}
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-500/20"
                      >
                        {processing === req.id ? (
                          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => resolve(req.id, "rejected")}
                        disabled={!!processing}
                        className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                      <div className="ml-auto flex items-center gap-1.5 text-[10px] text-amber-400/60">
                        <Smartphone className="h-3 w-3" />
                        Check your phone — same code should appear
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chain integrity */}
      <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/15 p-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-white">Chain integrity verified</p>
          <p className="text-[10px] text-white/40">All {MOCK_CHAIN.length} records verified · No tampering detected · Last checked: just now</p>
        </div>
        <div className="ml-auto text-[10px] font-mono text-emerald-400/60 hidden sm:block">HMAC-SHA256</div>
      </div>

      {/* Consent chain timeline */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Consent chain</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.06]" />

          <div className="space-y-1">
            {[...MOCK_CHAIN].reverse().map((record, i) => (
              <div key={record.id} className="flex items-start gap-4 relative">
                {/* Node */}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-[#080812]",
                  actionColor[record.action] ?? "bg-white/[0.06]"
                )}>
                  <Link2 className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5 hover:bg-white/[0.04] transition-colors mb-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold", actionColor[record.action])}>
                        {actionLabel[record.action] ?? record.action}
                      </span>
                      <p className="mt-1 text-xs text-white/50 font-mono">{record.agentId}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-white/30">{formatDateTime(record.timestamp)}</p>
                      <p className="text-[10px] text-white/20 font-mono mt-0.5">{record.approvedBy}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-white/20">
                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-400/50" />
                    {record.signature}
                    {i > 0 && <span className="text-white/15">← chained to previous</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
