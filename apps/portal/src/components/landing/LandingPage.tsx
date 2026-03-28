"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Shield, ScrollText, Link2, ArrowRight, Bot, CheckCircle2, Lock, Activity, ChevronRight, Star } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const FEATURES = [
  { icon: Bot,        color: "from-violet-500/20 to-violet-600/5",  border: "border-violet-500/20",  iconColor: "text-violet-400",  title: "AgentID",      tag: "Identity",    desc: "Every agent gets a cryptographically verified identity backed by Auth0 M2M. No more anonymous actors in your system." },
  { icon: Shield,     color: "from-amber-500/20 to-amber-600/5",    border: "border-amber-500/20",   iconColor: "text-amber-400",   title: "ScopeGraph",   tag: "Permissions", desc: "Declarative permission maps. Minimum viable access. Agents get exactly what they need - nothing more, nothing less." },
  { icon: Link2,      color: "from-emerald-500/20 to-emerald-600/5",border: "border-emerald-500/20", iconColor: "text-emerald-400", title: "ConsentChain", tag: "Approval",    desc: "Every human approval is recorded in a tamper-evident HMAC chain via Auth0 CIBA. Immutable. Auditable. Trustworthy." },
  { icon: ScrollText, color: "from-blue-500/20 to-blue-600/5",      border: "border-blue-500/20",    iconColor: "text-blue-400",    title: "ActionLedger", tag: "Audit",       desc: "Append-only audit trail of every token used, every API called. Real-time via WebSocket. Export to CSV anytime." },
  { icon: Zap,        color: "from-purple-500/20 to-purple-600/5",  border: "border-purple-500/20",  iconColor: "text-purple-400",  title: "Apex",         tag: "Governance",  desc: "The meta-agent that watches all your agents. Powered by AI. Detects anomalies, rotates certs, kills bad actors." },
  { icon: Lock,       color: "from-rose-500/20 to-rose-600/5",      border: "border-rose-500/20",    iconColor: "text-rose-400",    title: "Token Vault",  tag: "Auth0",       desc: "Auth0 Token Vault stores every third-party credential. Zero tokens in your code. Zero credentials exposed." },
];

const STEPS = [
  { n: "01", title: "Register your agent",     desc: "One SDK call provisions an Auth0 M2M app, issues an AgentID, and configures Token Vault credentials for every API your agent needs." },
  { n: "02", title: "Declare permissions",     desc: "The ScopeGraph maps exactly what your agent can do. Mark sensitive actions as step-up required." },
  { n: "03", title: "Agent acts, Apex watches",desc: "Every action goes through the ScopeGraph. Token Vault supplies the credential. Apex monitors for anomalies in real time." },
  { n: "04", title: "Human-in-the-loop",       desc: "For high-stakes actions, Auth0 CIBA sends a push to the delegating user. They approve or reject with a binding code." },
  { n: "05", title: "Full audit trail",         desc: "Every action, every token, every approval recorded in the ActionLedger. Tamper-evident. Real-time WebSocket feed." },
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#030308] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#6C47FF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <nav className="relative z-50 border-b border-white/[0.04] bg-[#030308]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF] shadow-lg shadow-[#6C47FF]/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Drift</span>
            <span className="text-[10px] font-semibold text-[#6C47FF] bg-[#6C47FF]/10 rounded-full px-2 py-0.5 border border-[#6C47FF]/20">BETA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="http://localhost:3001" className="hover:text-white transition-colors">Demo</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/api/auth/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/api/auth/login" className="flex items-center gap-1.5 rounded-lg bg-[#6C47FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a3acc] transition-all shadow-lg shadow-[#6C47FF]/25">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-16 text-center px-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#6C47FF]/10 border border-[#6C47FF]/20 px-4 py-1.5 text-xs font-medium text-[#A78BFA] mb-8">
          <Star className="h-3 w-3 fill-current" />
          Auth0 Authorized to Act Hackathon 2026
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto">
          <span className="text-white">The identity layer</span>
          <br />
          <span className="text-[#A78BFA]">for AI agents</span>
        </h1>
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Drift gives every AI agent a verified identity, scoped permissions, and a tamper-proof audit trail.
          Powered by <span className="text-emerald-400 font-medium">Apex</span> the meta-agent that governs them all.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/api/auth/login" className="flex items-center gap-2 rounded-xl bg-[#6C47FF] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#5a3acc] transition-all shadow-2xl shadow-[#6C47FF]/30">
            <Zap className="h-4 w-4" /> Open Drift portal
          </Link>
          <a href="http://localhost:3001" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white transition-all">
            <Activity className="h-4 w-4" /> Watch live demo
          </a>
        </div>
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-white/30">
          {["Auth0 Token Vault", "CIBA step-up auth", "AI-powered Apex", "TypeScript SDK", "Real-time ledger"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400/60" />{t}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Everything agents need to be trustworthy</h2>
          <p className="text-white/40 max-w-xl mx-auto">Six primitives. One platform. Built entirely on Auth0.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, border, iconColor, title, tag, desc }) => (
            <div key={title} className={cn("group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 cursor-default", "bg-gradient-to-br " + color, border)}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-black/30", iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 bg-black/30", iconColor)}>{tag}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className={cn("h-4 w-4", iconColor)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="relative max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">How Drift works</h2>
          <p className="text-white/40">From zero to authorized agent in minutes.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div key={step.n} onClick={() => setActiveStep(i)} className={cn("flex items-start gap-4 rounded-xl p-4 cursor-pointer transition-all duration-300", activeStep === i ? "bg-[#6C47FF]/10 border border-[#6C47FF]/25" : "border border-transparent hover:bg-white/[0.02]")}>
                <span className={cn("text-sm font-black font-mono mt-0.5 shrink-0 transition-colors", activeStep === i ? "text-[#6C47FF]" : "text-white/20")}>{step.n}</span>
                <div>
                  <h3 className={cn("text-sm font-bold mb-1 transition-colors", activeStep === i ? "text-white" : "text-white/50")}>{step.title}</h3>
                  {activeStep === i && <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>}
                </div>
                {activeStep === i && <ChevronRight className="h-4 w-4 text-[#6C47FF] ml-auto shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#6C47FF]/10 to-transparent border border-[#6C47FF]/20 p-8">
            <div className="text-5xl font-black text-[#6C47FF]/20 font-mono mb-4">{STEPS[activeStep]?.n}</div>
            <h3 className="text-xl font-black text-white mb-3">{STEPS[activeStep]?.title}</h3>
            <p className="text-white/50 leading-relaxed">{STEPS[activeStep]?.desc}</p>
            <div className="mt-6 flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} onClick={() => setActiveStep(i)} className={cn("h-1 rounded-full cursor-pointer transition-all duration-300", i === activeStep ? "bg-[#6C47FF] w-6" : "bg-white/10 w-3")} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-[#6C47FF]/15 via-[#6C47FF]/5 to-transparent border border-[#6C47FF]/20 p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C47FF] mx-auto mb-6 shadow-2xl shadow-[#6C47FF]/40">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Ready to authorize your agents?</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">Register your first agent in under 5 minutes. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/api/auth/login" className="flex items-center gap-2 rounded-xl bg-[#6C47FF] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#5a3acc] transition-all shadow-2xl shadow-[#6C47FF]/30">
              <Zap className="h-4 w-4" /> Open Drift portal
            </Link>
            <a href="http://localhost:3001" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white transition-all">
              <Activity className="h-4 w-4" /> Watch live demo
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#6C47FF]">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-white/40">Drift</span>
            <span>Powered by Apex Built on Auth0</span>
          </div>
          <span>Built by Toluwalope Ajayi Auth0 Authorized to Act Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}
