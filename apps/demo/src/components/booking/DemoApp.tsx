"use client";
import { useState, useCallback } from "react";
import { Zap, Shield, ScrollText, CheckCircle2, Clock, XCircle, Plane, Building2, CreditCard, Bot, ChevronRight, AlertCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { MOCK_FLIGHTS, MOCK_HOTELS, type FlightResult, type HotelResult } from "@/lib/drift-client";

// ─── Types ────────────────────────────────────────────────────
type DemoPhase =
  | "idle"
  | "registering"
  | "searching_flights"
  | "flight_selected"
  | "searching_hotels"
  | "hotel_selected"
  | "charging_card"
  | "ciba_pending"
  | "ciba_approved"
  | "ciba_rejected"
  | "complete";

interface LedgerEntry {
  id: string;
  action: string;
  result: "success" | "failure" | "blocked" | "pending_approval";
  detail: string;
  timestamp: Date;
  durationMs: number;
}

interface AgentState {
  id: string;
  name: string;
  auth0ClientId: string;
  trustCert: string;
  scopes: string[];
  cibaBinding?: string;
  totalCharge?: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function useDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [agent, setAgent] = useState<AgentState | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelResult | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cibaTimer, setCibaTimer] = useState(0);

  const addLedgerEntry = useCallback((entry: Omit<LedgerEntry, "id" | "timestamp">) => {
    setLedger((prev) => [{
      ...entry,
      id: `led_${Date.now()}`,
      timestamp: new Date(),
    }, ...prev]);
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const registerAgent = async () => {
    setPhase("registering");
    await sleep(800);

    const newAgent: AgentState = {
      id: `drift_agt_${Math.random().toString(36).slice(2, 9)}`,
      name: "travel-booking-agent",
      auth0ClientId: `HgKx9mN3pQr${Math.random().toString(36).slice(2, 6)}`,
      trustCert: `eyJhbGciOiJIUzI1NiIsInR5cCI6ImRyaWZ0K2p3dCJ9`,
      scopes: ["flights:book", "hotels:book", "card:charge", "calendar:read"],
    };
    setAgent(newAgent);

    addLedgerEntry({ action: "agent:register", result: "success", detail: `AgentID issued · Auth0 M2M provisioned`, durationMs: 312 });
    addLedgerEntry({ action: "scope:grant", result: "success", detail: "4 scopes granted · Token Vault configured", durationMs: 89 });
    addLedgerEntry({ action: "trust:cert:issue", result: "success", detail: "JWT signed · 30-day validity", durationMs: 44 });
    addLedgerEntry({ action: "apex:watch", result: "success", detail: "Apex meta-agent now monitoring", durationMs: 12 });

    toast.success("Agent registered — Apex is watching");
    await sleep(400);
    setPhase("searching_flights");
  };

  const selectFlight = async (flight: FlightResult) => {
    setPhase("flight_selected");
    setSelectedFlight(flight);
    addLedgerEntry({ action: "flights:search", result: "success", detail: `${flight.origin} → ${flight.destination} · 3 results`, durationMs: 234 });
    addLedgerEntry({ action: "scope:check", result: "success", detail: "flights:book → GRANTED · no step-up required", durationMs: 8 });
    await sleep(300);
    setPhase("searching_hotels");
  };

  const selectHotel = async (hotel: HotelResult) => {
    setPhase("hotel_selected");
    setSelectedHotel(hotel);
    addLedgerEntry({ action: "hotels:search", result: "success", detail: `London · ${hotel.name} selected`, durationMs: 189 });
    addLedgerEntry({ action: "scope:check", result: "success", detail: "hotels:book → GRANTED · no step-up required", durationMs: 7 });
    await sleep(300);
    setPhase("charging_card");
  };

  const chargeCard = async () => {
    if (!selectedFlight || !selectedHotel || !agent) return;
    const nights = 3;
    const total = selectedFlight.price + selectedHotel.pricePerNight * nights;

    // Scope check → step-up required for card:charge
    addLedgerEntry({ action: "scope:check", result: "pending_approval", detail: "card:charge → STEP-UP REQUIRED · initiating CIBA", durationMs: 9 });

    // Initiate CIBA
    const binding = `DRIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setAgent((a) => a ? { ...a, cibaBinding: binding, totalCharge: total } : a);
    setPhase("ciba_pending");

    addLedgerEntry({ action: "ciba:initiate", result: "pending_approval", detail: `Binding: ${binding} · waiting for approval`, durationMs: 156 });

    // Start countdown
    let t = 60;
    setCibaTimer(t);
    const interval = setInterval(() => {
      t--;
      setCibaTimer(t);
      if (t <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  };

  const approveCIBA = async () => {
    if (!agent?.totalCharge) return;
    setPhase("ciba_approved");
    await sleep(600);

    addLedgerEntry({ action: "ciba:approved", result: "success", detail: `Human approved · ConsentChain updated`, durationMs: 0 });
    addLedgerEntry({ action: "card:charge", result: "success", detail: `$${agent.totalCharge.toFixed(2)} charged · txn_${Math.random().toString(36).slice(2, 8)}`, durationMs: 892 });
    addLedgerEntry({ action: "calendar:write", result: "success", detail: "Trip added to calendar · reminders set", durationMs: 67 });
    addLedgerEntry({ action: "email:send", result: "success", detail: "Confirmation sent to tolu@company.com", durationMs: 234 });

    toast.success("Trip booked! ✈️");
    await sleep(400);
    setPhase("complete");
  };

  const rejectCIBA = async () => {
    setPhase("ciba_rejected");
    addLedgerEntry({ action: "ciba:rejected", result: "blocked", detail: "Human rejected charge · agent notified · action cancelled", durationMs: 0 });
    toast.error("Charge rejected — agent stopped");
  };

  const reset = () => {
    setPhase("idle");
    setAgent(null);
    setSelectedFlight(null);
    setSelectedHotel(null);
    setLedger([]);
    setCibaTimer(0);
  };

  return { phase, agent, selectedFlight, selectedHotel, ledger, cibaTimer, registerAgent, selectFlight, selectHotel, chargeCard, approveCIBA, rejectCIBA, reset };
}

// ─── Component ───────────────────────────────────────────────
export default function DemoApp() {
  const demo = useDemo();

  return (
    <div className="min-h-screen bg-[#06060F]">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]/20 ring-1 ring-[#6C47FF]/30">
              <Zap className="h-4 w-4 text-[#6C47FF]" />
            </div>
            <span className="font-semibold text-white">Drift</span>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-sm text-white/50">Travel Booking Demo</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/40">Apex active</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: main flow */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Book a business trip</h1>
            <p className="mt-1 text-sm text-white/50">Watch Drift authorize every step — scopes checked, step-up triggered, everything logged.</p>
          </div>

          {/* Step 1: Register agent */}
          <DemoStep
            step={1}
            title="Register the travel agent"
            description="Drift provisions an Auth0 M2M application, issues an AgentID, and configures Token Vault credentials for each API the agent needs."
            active={demo.phase === "idle"}
            done={!!demo.agent}
            icon={Bot}
          >
            {demo.phase === "idle" && (
              <button onClick={demo.registerAgent} className="flex items-center gap-2 rounded-xl bg-[#6C47FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5a3acc] transition-colors shadow-lg shadow-[#6C47FF]/20">
                <Zap className="h-4 w-4" />
                Register agent via Drift SDK
              </button>
            )}
            {demo.phase === "registering" && <SpinnerLine text="Provisioning Auth0 M2M application…" />}
            {demo.agent && (
              <AgentCard agent={demo.agent} />
            )}
          </DemoStep>

          {/* Step 2: Search + select flight */}
          <DemoStep
            step={2}
            title="Search flights"
            description="Agent calls Amadeus API. Drift checks flights:book scope — no step-up needed. Token Vault supplies the credential."
            active={demo.phase === "searching_flights"}
            done={!!demo.selectedFlight}
            locked={!demo.agent}
            icon={Plane}
          >
            {demo.phase === "searching_flights" && (
              <div className="space-y-2">
                <ScopeCheckBadge scope="flights:book" result="allowed" />
                <div className="space-y-2 mt-3">
                  {MOCK_FLIGHTS.map((f) => (
                    <FlightCard key={f.id} flight={f} onSelect={() => demo.selectFlight(f)} />
                  ))}
                </div>
              </div>
            )}
            {demo.selectedFlight && (
              <div className="flex items-center gap-3 rounded-xl bg-[#6C47FF]/10 border border-[#6C47FF]/20 p-3.5">
                <Plane className="h-4 w-4 text-[#6C47FF] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{demo.selectedFlight.airline} · {demo.selectedFlight.origin} → {demo.selectedFlight.destination}</p>
                  <p className="text-xs text-white/50">{demo.selectedFlight.departure} · ${demo.selectedFlight.price}</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">SELECTED</span>
              </div>
            )}
          </DemoStep>

          {/* Step 3: Hotel */}
          <DemoStep
            step={3}
            title="Search hotels"
            description="Agent calls Booking.com API. Same pattern — scope checked, Token Vault provides credential, action logged."
            active={demo.phase === "searching_hotels"}
            done={!!demo.selectedHotel}
            locked={!demo.selectedFlight}
            icon={Building2}
          >
            {demo.phase === "searching_hotels" && (
              <div className="space-y-2">
                <ScopeCheckBadge scope="hotels:book" result="allowed" />
                <div className="space-y-2 mt-3">
                  {MOCK_HOTELS.map((h) => (
                    <HotelCard key={h.id} hotel={h} onSelect={() => demo.selectHotel(h)} />
                  ))}
                </div>
              </div>
            )}
            {demo.selectedHotel && (
              <div className="flex items-center gap-3 rounded-xl bg-[#6C47FF]/10 border border-[#6C47FF]/20 p-3.5">
                <Building2 className="h-4 w-4 text-[#6C47FF] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{demo.selectedHotel.name}</p>
                  <p className="text-xs text-white/50">{demo.selectedHotel.location} · ${demo.selectedHotel.pricePerNight}/night</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">SELECTED</span>
              </div>
            )}
          </DemoStep>

          {/* Step 4: Charge card — CIBA */}
          <DemoStep
            step={4}
            title="Charge corporate card"
            description="card:charge is marked step-up required. Drift triggers Auth0 CIBA — a push notification goes to the delegating user for approval before the agent can proceed."
            active={["charging_card","ciba_pending","ciba_approved","ciba_rejected","complete"].includes(demo.phase)}
            done={demo.phase === "complete"}
            locked={!demo.selectedHotel}
            icon={CreditCard}
          >
            {demo.phase === "hotel_selected" && (
              <button onClick={demo.chargeCard} className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/25 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors">
                <Lock className="h-4 w-4" />
                Proceed to payment (step-up required)
              </button>
            )}
            {demo.phase === "charging_card" && <SpinnerLine text="Checking card:charge scope…" color="amber" />}

            {/* CIBA pending */}
            {demo.phase === "ciba_pending" && demo.agent && (
              <CIBAApproval
                binding={demo.agent.cibaBinding!}
                amount={demo.agent.totalCharge!}
                timer={demo.cibaTimer}
                onApprove={demo.approveCIBA}
                onReject={demo.rejectCIBA}
              />
            )}

            {demo.phase === "ciba_approved" && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Approved · card charged</p>
                  <p className="text-xs text-white/50">ConsentChain updated · calendar written · confirmation sent</p>
                </div>
              </div>
            )}

            {demo.phase === "ciba_rejected" && (
              <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Charge rejected</p>
                  <p className="text-xs text-white/50">Agent notified and halted · action blocked in ledger</p>
                </div>
              </div>
            )}

            {demo.phase === "complete" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Trip booked successfully</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                    <span>✈ {demo.selectedFlight?.airline}</span>
                    <span>🏨 {demo.selectedHotel?.name}</span>
                    <span>💳 ${demo.agent?.totalCharge?.toFixed(2)} charged</span>
                    <span>📅 Calendar updated</span>
                  </div>
                </div>
                <button onClick={demo.reset} className="text-xs text-[#6C47FF] hover:text-[#A78BFA] transition-colors">
                  ↺ Reset demo
                </button>
              </div>
            )}
          </DemoStep>
        </div>

        {/* Right: Live panels */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <AgentPanel agent={demo.agent} />
          <LiveLedgerPanel entries={demo.ledger} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function DemoStep({ step, title, description, active, done, locked, icon: Icon, children }: {
  step: number; title: string; description: string;
  active?: boolean; done?: boolean; locked?: boolean; icon: React.ElementType;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-6 transition-all duration-300",
      done    ? "border-emerald-500/20 bg-emerald-950/10"  :
      active  ? "border-[#6C47FF]/30 bg-[#6C47FF]/5 glow-drift" :
      locked  ? "border-white/[0.04] bg-white/[0.01] opacity-50" :
                "border-white/[0.06] bg-white/[0.02]"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
          done   ? "bg-emerald-500/15 ring-emerald-500/25" :
          active ? "bg-[#6C47FF]/15 ring-[#6C47FF]/25" :
                   "bg-white/[0.04] ring-white/[0.06]"
        )}>
          {done
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            : <Icon className={cn("h-5 w-5", active ? "text-[#6C47FF]" : "text-white/30")} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-semibold rounded px-1.5 py-0.5", active || done ? "bg-[#6C47FF]/15 text-[#A78BFA]" : "bg-white/[0.04] text-white/30")}>
              STEP {step}
            </span>
          </div>
          <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{description}</p>
          {!locked && children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: { id: string; auth0ClientId: string; trustCert: string; scopes: string[] } }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-[#6C47FF]" />
        <span className="text-xs font-semibold text-white">travel-booking-agent</span>
        <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">ACTIVE</span>
      </div>
      {[
        { label: "AgentID",       value: agent.id.slice(0, 22) + "…" },
        { label: "Auth0 M2M",     value: agent.auth0ClientId },
        { label: "Trust cert",    value: agent.trustCert.slice(0, 24) + "…" },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-[10px] text-white/30 uppercase tracking-wide">{label}</span>
          <code className="text-[10px] font-mono text-white/50">{value}</code>
        </div>
      ))}
      <div>
        <span className="text-[10px] text-white/30 uppercase tracking-wide block mb-1.5">Scope grants</span>
        <div className="flex flex-wrap gap-1">
          {agent.scopes.map((s) => (
            <span key={s} className={cn(
              "text-[10px] font-mono rounded px-1.5 py-0.5",
              s === "card:charge" ? "bg-amber-500/10 text-amber-300" : "bg-[#6C47FF]/10 text-[#A78BFA]"
            )}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScopeCheckBadge({ scope, result }: { scope: string; result: "allowed" | "denied" | "step-up" }) {
  const colors = { allowed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", denied: "text-red-400 bg-red-500/10 border-red-500/20", "step-up": "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  const labels = { allowed: "✓ SCOPE GRANTED", denied: "✗ SCOPE DENIED", "step-up": "⚠ STEP-UP REQUIRED" };
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold", colors[result])}>
      <Shield className="h-3.5 w-3.5" />
      <code className="font-mono">{scope}</code>
      <span className="ml-auto">{labels[result]}</span>
    </div>
  );
}

function FlightCard({ flight, onSelect }: { flight: FlightResult; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 hover:border-[#6C47FF]/30 hover:bg-[#6C47FF]/5 transition-all text-left group">
      <Plane className="h-4 w-4 text-white/30 group-hover:text-[#6C47FF] transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{flight.airline}</span>
          <span className={cn("text-[10px] font-semibold rounded px-1.5 py-0.5", flight.class === "business" ? "bg-amber-500/10 text-amber-300" : "bg-white/[0.06] text-white/50")}>
            {flight.class.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-0.5">{new Date(flight.departure).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} → {new Date(flight.arrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-white">${flight.price}</p>
        <p className="text-[10px] text-[#6C47FF] group-hover:text-[#A78BFA] transition-colors">Select →</p>
      </div>
    </button>
  );
}

function HotelCard({ hotel, onSelect }: { hotel: HotelResult; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 hover:border-[#6C47FF]/30 hover:bg-[#6C47FF]/5 transition-all text-left group">
      <Building2 className="h-4 w-4 text-white/30 group-hover:text-[#6C47FF] transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white">{hotel.name}</span>
          <span className="text-[10px] text-amber-400">{"★".repeat(hotel.stars)}</span>
        </div>
        <p className="text-xs text-white/40 mt-0.5">{hotel.location}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-white">${hotel.pricePerNight}<span className="text-xs text-white/40">/night</span></p>
        <p className="text-[10px] text-[#6C47FF] group-hover:text-[#A78BFA] transition-colors">Select →</p>
      </div>
    </button>
  );
}

function CIBAApproval({ binding, amount, timer, onApprove, onReject }: {
  binding: string; amount: number; timer: number;
  onApprove: () => void; onReject: () => void;
}) {
  return (
    <div className="rounded-xl bg-amber-950/30 border border-amber-500/25 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Human approval required</p>
          <p className="text-xs text-white/50 mt-0.5">
            The travel agent wants to charge <strong className="text-white">${amount.toFixed(2)}</strong> to the corporate card.
            Auth0 CIBA has sent a push notification to your phone.
          </p>
        </div>
      </div>

      {/* Binding message */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
        <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-widest mb-1">Binding code — confirm on both screens</p>
        <p className="text-2xl font-mono font-bold text-amber-300 tracking-widest">{binding}</p>
        <p className="text-[10px] text-amber-400/50 mt-1">Expires in {timer}s</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all duration-1000" style={{ width: `${(timer / 60) * 100}%` }} />
      </div>

      <div className="flex gap-3">
        <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </button>
        <button onClick={onReject} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/15 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-colors">
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>
      <p className="text-[10px] text-center text-white/30">This simulates the Auth0 CIBA mobile approval flow</p>
    </div>
  );
}

function AgentPanel({ agent }: { agent: AgentState | null }) {
  if (!agent) return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="h-4 w-4 text-white/20" />
        <span className="text-sm font-semibold text-white/30">No agent registered</span>
      </div>
      <p className="text-xs text-white/20">Register an agent in Step 1 to see its identity here.</p>
    </div>
  );
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-[#6C47FF]/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Bot className="h-4 w-4 text-[#6C47FF]" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-sm font-semibold text-white">Agent Identity</span>
      </div>
      <div className="space-y-2">
        {[
          { icon: "🪪", label: "AgentID",     value: agent.id.slice(0,20)+"…" },
          { icon: "🔑", label: "Auth0 M2M",   value: agent.auth0ClientId },
          { icon: "📜", label: "Trust cert",  value: agent.trustCert.slice(0,20)+"…" },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-xs text-white/40">{icon} {label}</span>
            <code className="text-[10px] font-mono text-white/50">{value}</code>
          </div>
        ))}
        <div className="pt-1">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-2">Token Vault scopes</p>
          <div className="flex flex-wrap gap-1">
            {agent.scopes.map((s) => (
              <span key={s} className={cn("text-[10px] font-mono rounded px-1.5 py-0.5", s === "card:charge" ? "bg-amber-500/10 text-amber-300" : "bg-[#6C47FF]/10 text-[#A78BFA]")}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveLedgerPanel({ entries }: { entries: LedgerEntry[] }) {
  const resultColors: Record<string, string> = {
    success:          "text-emerald-400",
    failure:          "text-red-400",
    blocked:          "text-orange-400",
    pending_approval: "text-amber-400",
  };
  const resultDots: Record<string, string> = {
    success:          "bg-emerald-400",
    failure:          "bg-red-400",
    blocked:          "bg-orange-400",
    pending_approval: "bg-amber-400 animate-pulse",
  };
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
        <ScrollText className="h-3.5 w-3.5 text-white/40" />
        <span className="text-xs font-semibold text-white/60">Action Ledger</span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{entries.length} entries</span>
      </div>
      <div className="divide-y divide-white/[0.03] max-h-[400px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/20">Actions will appear here</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", resultDots[e.result])} />
                <code className="text-[11px] font-mono text-white/70 truncate flex-1">{e.action}</code>
                <span className={cn("text-[10px] font-medium shrink-0", resultColors[e.result])}>
                  {e.result === "pending_approval" ? "pending" : e.result}
                </span>
              </div>
              <p className="text-[10px] text-white/30 mt-0.5 ml-3.5">{e.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SpinnerLine({ text, color = "drift" }: { text: string; color?: "drift" | "amber" }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-white/50">
      <span className={cn("h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0", color === "amber" ? "border-amber-400/30 border-t-amber-400" : "border-[#6C47FF]/30 border-t-[#6C47FF]")} />
      {text}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
