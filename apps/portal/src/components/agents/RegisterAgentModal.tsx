"use client";
import { useState } from "react";
import { X, Plus, Trash2, Shield, Zap, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SCOPE_PRESETS = [
  { resource: "flights",  action: "book",   label: "Book flights",       stepUp: false },
  { resource: "hotels",   action: "book",   label: "Book hotels",        stepUp: false },
  { resource: "card",     action: "charge", label: "Charge card",        stepUp: true  },
  { resource: "calendar", action: "read",   label: "Read calendar",      stepUp: false },
  { resource: "email",    action: "send",   label: "Send emails",        stepUp: false },
  { resource: "slack",    action: "send",   label: "Send Slack msgs",    stepUp: false },
  { resource: "reports",  action: "read",   label: "Read reports",       stepUp: false },
  { resource: "github",   action: "write",  label: "Write to GitHub",    stepUp: true  },
];

type Scope = { resource: string; action: string; stepUpRequired: boolean };

interface Props {
  onClose: () => void;
  onCreated: (agent: unknown) => void;
}

const STEPS = ["Identity", "Scopes", "Review"];

export default function RegisterAgentModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    delegatedBy: "",
    governedBy: "apex" as "apex" | "none",
    ttlDays: "",
  });
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [custom, setCustom] = useState({ resource: "", action: "read", stepUp: false });

  const togglePreset = (p: typeof SCOPE_PRESETS[0]) => {
    const key = `${p.resource}:${p.action}`;
    const exists = scopes.find((s) => `${s.resource}:${s.action}` === key);
    if (exists) {
      setScopes((prev) => prev.filter((s) => `${s.resource}:${s.action}` !== key));
    } else {
      setScopes((prev) => [...prev, { resource: p.resource, action: p.action, stepUpRequired: p.stepUp }]);
    }
  };

  const addCustom = () => {
    if (!custom.resource || !custom.action) return;
    const key = `${custom.resource}:${custom.action}`;
    if (scopes.find((s) => `${s.resource}:${s.action}` === key)) return;
    setScopes((prev) => [...prev, { resource: custom.resource, action: custom.action, stepUpRequired: custom.stepUp }]);
    setCustom({ resource: "", action: "read", stepUp: false });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const id = `drift_agt_${Math.random().toString(36).slice(2, 9)}`;
    onCreated({
      id,
      name: form.name,
      description: form.description,
      status: "pending",
      delegatedBy: form.delegatedBy,
      governedByApex: form.governedBy === "apex",
      createdAt: new Date(),
      actions: 0,
      lastSeen: null,
      scopes,
    });
    setLoading(false);
  };

  const canNext = step === 0
    ? form.name.trim() && form.delegatedBy.trim()
    : step === 1
    ? scopes.length > 0
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F0F24] border border-white/[0.08] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">Register agent</h2>
            <p className="text-xs text-white/40 mt-0.5">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all",
                i < step ? "bg-emerald-500 text-white" :
                i === step ? "bg-drift-500 text-white ring-4 ring-drift-500/20" :
                "bg-white/[0.06] text-white/30"
              )}>
                {i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </div>
              <span className={cn("text-[10px] font-medium hidden sm:block", i === step ? "text-white/70" : "text-white/30")}>{s}</span>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-px mx-1", i < step ? "bg-emerald-500/40" : "bg-white/[0.06]")} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[280px]">
          {/* Step 0: Identity */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Agent name <span className="text-drift-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. travel-booking-agent"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 font-mono transition-all"
                />
                <p className="mt-1 text-[10px] text-white/30">Use lowercase + hyphens only. This becomes your AgentID prefix.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What does this agent do?"
                  rows={2}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 resize-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Delegated by <span className="text-drift-400">*</span></label>
                <input
                  value={form.delegatedBy}
                  onChange={(e) => setForm((f) => ({ ...f, delegatedBy: e.target.value }))}
                  placeholder="user@company.com"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-950/30 border border-emerald-500/15 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-white/80">Governed by Apex</p>
                    <p className="text-[10px] text-white/40">Apex monitors and can kill this agent</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, governedBy: f.governedBy === "apex" ? "none" : "apex" }))}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    form.governedBy === "apex" ? "bg-emerald-500" : "bg-white/20"
                  )}
                >
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.governedBy === "apex" ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Scopes */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-white/50">Select what this agent is allowed to do. Amber badges require human step-up approval.</p>
              <div className="grid grid-cols-2 gap-2">
                {SCOPE_PRESETS.map((p) => {
                  const key = `${p.resource}:${p.action}`;
                  const selected = !!scopes.find((s) => `${s.resource}:${s.action}` === key);
                  return (
                    <button
                      key={key}
                      onClick={() => togglePreset(p)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-left transition-all",
                        selected
                          ? p.stepUp
                            ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                            : "bg-drift-500/15 text-drift-300 ring-1 ring-drift-500/30"
                          : "bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white/70 ring-1 ring-white/[0.06]"
                      )}
                    >
                      {selected ? <Check className="h-3 w-3 shrink-0" /> : <div className="h-3 w-3 rounded shrink-0 border border-current opacity-40" />}
                      <span className="font-mono">{key}</span>
                      {p.stepUp && <Shield className="h-2.5 w-2.5 ml-auto text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom scope */}
              <div className="flex gap-2 pt-1">
                <input
                  value={custom.resource}
                  onChange={(e) => setCustom((c) => ({ ...c, resource: e.target.value }))}
                  placeholder="resource"
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder-white/25 font-mono focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
                />
                <select
                  value={custom.action}
                  onChange={(e) => setCustom((c) => ({ ...c, action: e.target.value }))}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-drift-500/50 focus:ring-1 focus:ring-drift-500/30 transition-all"
                >
                  {["read","write","delete","execute","charge","send","book","submit","approve"].map((a) => (
                    <option key={a} value={a} className="bg-[#0F0F24]">{a}</option>
                  ))}
                </select>
                <button onClick={addCustom} className="rounded-xl bg-drift-500/15 px-3 py-2 text-drift-400 hover:bg-drift-500/25 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {scopes.length > 0 && (
                <div className="pt-1">
                  <p className="text-[10px] font-medium text-white/30 uppercase tracking-wide mb-2">{scopes.length} scope{scopes.length !== 1 ? "s" : ""} selected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scopes.map((s) => (
                      <span key={`${s.resource}:${s.action}`} className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono",
                        s.stepUpRequired ? "bg-amber-500/10 text-amber-300" : "bg-drift-500/10 text-drift-300"
                      )}>
                        {s.resource}:{s.action}
                        <button onClick={() => setScopes((prev) => prev.filter((x) => !(x.resource === s.resource && x.action === s.action)))}>
                          <X className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-drift-500/10">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-mono">{form.name}</p>
                    <p className="text-xs text-white/40">{form.delegatedBy}</p>
                  </div>
                  {form.governedBy === "apex" && (
                    <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-md px-2 py-0.5">APEX</span>
                  )}
                </div>
                {form.description && <p className="text-xs text-white/50">{form.description}</p>}
                <div>
                  <p className="text-[10px] font-medium text-white/30 uppercase tracking-wide mb-2">Scopes ({scopes.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scopes.map((s) => (
                      <span key={`${s.resource}:${s.action}`} className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-mono",
                        s.stepUpRequired ? "bg-amber-500/10 text-amber-300" : "bg-drift-500/10 text-drift-300"
                      )}>
                        {s.stepUpRequired && "🔒 "}{s.resource}:{s.action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-drift-950/40 border border-drift-500/15 px-4 py-3">
                <p className="text-xs text-drift-300/80">
                  Drift will provision an Auth0 M2M application, issue an AgentID, configure Token Vault credentials, and generate a trust certificate. This agent will be ready in seconds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {step > 0 ? "Back" : "Cancel"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="flex items-center gap-2 rounded-xl bg-drift-500 px-5 py-2 text-sm font-medium text-white hover:bg-drift-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-drift-500/20"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-drift-500 px-5 py-2 text-sm font-medium text-white hover:bg-drift-600 transition-colors disabled:opacity-70 shadow-lg shadow-drift-500/20"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Provisioning…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Register agent
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
