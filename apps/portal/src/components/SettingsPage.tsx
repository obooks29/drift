"use client";
import { useState } from "react";
import { Key, Shield, Bell, Copy, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn, maskToken } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_API_KEY = "drift_pk_live_9xKz3mN7pQr2sT5vW8yB1cD4fE6gH0jI";

interface Props { user: { name?: string | null; email?: string | null; picture?: string | null } }

export default function SettingsPage({ user }: Props) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [notifications, setNotifications] = useState({ stepUp: true, violations: true, agentDown: false });

  const copyKey = () => {
    navigator.clipboard.writeText(MOCK_API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("API key copied");
  };

  const rotateKey = async () => {
    setRotating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRotating(false);
    toast.success("API key rotated — update your SDK config");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Manage your Drift workspace</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-drift-500/20 flex items-center justify-center">
            <span className="text-[10px] text-drift-400">P</span>
          </div>
          Profile
        </h2>
        <div className="flex items-center gap-4">
          {user.picture && <img src={user.picture} alt="" className="h-12 w-12 rounded-full ring-2 ring-drift-500/20" />}
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-white/40">{user.email}</p>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="h-4 w-4 text-drift-400" />
          API Keys
        </h2>
        <p className="text-xs text-white/50">Use this key to initialize the Drift SDK in your application.</p>
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
          <code className="flex-1 text-xs font-mono text-white/70 truncate">
            {showKey ? MOCK_API_KEY : maskToken(MOCK_API_KEY)}
          </code>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowKey(!showKey)} className="rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button onClick={copyKey} className="rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <button
          onClick={rotateKey}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-amber-400 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", rotating && "animate-spin")} />
          Rotate key
        </button>
      </section>

      {/* Apex Config */}
      <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Apex configuration
        </h2>
        {[
          { label: "Auto-suspend on scope violation", desc: "Apex automatically suspends agents that exceed their granted scopes", enabled: true },
          { label: "Certificate auto-rotation (30d)", desc: "Apex rotates trust certificates every 30 days automatically", enabled: true },
          { label: "Anomaly detection", desc: "Apex flags unusual action patterns for review", enabled: true },
          { label: "CIBA timeout (5 min)", desc: "Step-up requests expire after 5 minutes with no response", enabled: true },
        ].map(({ label, desc, enabled }) => (
          <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
            <div>
              <p className="text-xs font-medium text-white/80">{label}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{desc}</p>
            </div>
            <button className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors mt-0.5", enabled ? "bg-emerald-500" : "bg-white/20")}>
              <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        ))}
      </section>

      {/* Notifications */}
      <section className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Bell className="h-4 w-4 text-drift-400" />
          Notifications
        </h2>
        {[
          { key: "stepUp" as const,     label: "Step-up approval requests", desc: "Get notified when an agent needs your approval" },
          { key: "violations" as const, label: "Scope violations",           desc: "Alert when an agent tries to exceed its permissions" },
          { key: "agentDown" as const,  label: "Agent status changes",       desc: "Notify when an agent is suspended or revoked" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
            <div>
              <p className="text-xs font-medium text-white/80">{label}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
              className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors mt-0.5", notifications[key] ? "bg-drift-500" : "bg-white/20")}
            >
              <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", notifications[key] ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
