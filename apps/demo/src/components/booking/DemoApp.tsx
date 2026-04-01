"use client";
import { useState, useCallback } from "react";
import { Zap, Shield, ScrollText, CheckCircle2, XCircle, Plane, Building2, CreditCard, Bot, AlertCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { MOCK_FLIGHTS, MOCK_HOTELS } from "@/lib/drift-client";
import type { FlightResult, HotelResult } from "@/lib/drift-client";

type Phase = "idle"|"registering"|"searching_flights"|"flight_selected"|"searching_hotels"|"hotel_selected"|"charging_card"|"ciba_pending"|"ciba_approved"|"ciba_rejected"|"complete";
interface Entry { id:string; action:string; result:"success"|"failure"|"blocked"|"pending_approval"; detail:string; timestamp:Date; durationMs:number; }
interface Agent { id:string; name:string; auth0ClientId:string; trustCert:string; scopes:string[]; cibaBinding?:string; totalCharge?:number; }
function cn(...c:(string|boolean|undefined|null)[]) { return c.filter(Boolean).join(" "); }

export default function DemoApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [agent, setAgent] = useState<Agent|null>(null);
  const [flight, setFlight] = useState<FlightResult|null>(null);
  const [hotel, setHotel] = useState<HotelResult|null>(null);
  const [ledger, setLedger] = useState<Entry[]>([]);
  const [timer, setTimer] = useState(0);

  const sleep = (ms:number) => new Promise(r=>setTimeout(r,ms));
  const add = useCallback((e:Omit<Entry,"id"|"timestamp">) => {
    setLedger(p=>[{...e,id:`led_${Date.now()}${Math.random()}`,timestamp:new Date()},...p]);
  },[]);

  const registerAgent = async () => {
    setPhase("registering"); await sleep(800);
    const a:Agent = { id:`drift_agt_${Math.random().toString(36).slice(2,9)}`, name:"travel-booking-agent", auth0ClientId:`HgKx9mN3pQr${Math.random().toString(36).slice(2,6)}`, trustCert:`eyJhbGciOiJIUzI1NiIsInR5cCI6ImRyaWZ0K2p3dCJ9`, scopes:["flights:book","hotels:book","card:charge","calendar:read"] };
    setAgent(a);
    add({action:"agent:register",result:"success",detail:"AgentID issued Â· Auth0 M2M provisioned",durationMs:312});
    add({action:"scope:grant",result:"success",detail:"4 scopes granted Â· Token Vault configured",durationMs:89});
    add({action:"trust:cert:issue",result:"success",detail:"JWT signed Â· 30-day validity",durationMs:44});
    add({action:"apex:watch",result:"success",detail:"Apex meta-agent now monitoring",durationMs:12});
    toast.success("Agent registered â€” Apex is watching");
    await sleep(400); setPhase("searching_flights");
  };

  const selectFlight = async (f:FlightResult) => {
    setFlight(f); setPhase("flight_selected");
    add({action:"flights:search",result:"success",detail:`${f.origin} â†’ ${f.destination} Â· 3 results`,durationMs:234});
    add({action:"scope:check",result:"success",detail:"flights:book â†’ GRANTED Â· no step-up required",durationMs:8});
    await sleep(400); setPhase("searching_hotels");
  };

  const selectHotel = async (h:HotelResult) => {
    setHotel(h); setPhase("hotel_selected");
    add({action:"hotels:search",result:"success",detail:`London Â· ${h.name} selected`,durationMs:189});
    add({action:"scope:check",result:"success",detail:"hotels:book â†’ GRANTED Â· no step-up required",durationMs:7});
    // stays at hotel_selected â€” user must click "Proceed to payment"
  };

  const chargeCard = async () => {
    if (!flight||!hotel||!agent) return;
    setPhase("charging_card");
    add({action:"scope:check",result:"pending_approval",detail:"card:charge â†’ STEP-UP REQUIRED Â· initiating CIBA",durationMs:9});
    await sleep(1200);
    const binding = `DRIFT-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const total = flight.price + hotel.pricePerNight * 3;
    setAgent(a=>a?{...a,cibaBinding:binding,totalCharge:total}:a);
    add({action:"ciba:initiate",result:"pending_approval",detail:`Binding: ${binding} Â· waiting for approval`,durationMs:156});
    setPhase("ciba_pending");
    let t=60; setTimer(t);
    const iv=setInterval(()=>{t--;setTimer(t);if(t<=0)clearInterval(iv);},1000);
  };

  const approve = async () => {
    if (!agent?.totalCharge) return;
    setPhase("ciba_approved"); await sleep(600);
    add({action:"ciba:approved",result:"success",detail:"Human approved Â· ConsentChain updated",durationMs:0});
    add({action:"card:charge",result:"success",detail:`$${agent.totalCharge.toFixed(2)} charged Â· txn_${Math.random().toString(36).slice(2,8)}`,durationMs:892});
    add({action:"calendar:write",result:"success",detail:"Trip added to calendar",durationMs:67});
    add({action:"email:send",result:"success",detail:"Confirmation sent",durationMs:234});
    toast.success("Trip booked! âœˆï¸"); await sleep(400); setPhase("complete");
  };

  const reject = () => {
    setPhase("ciba_rejected");
    add({action:"ciba:rejected",result:"blocked",detail:"Human rejected Â· agent halted Â· action blocked",durationMs:0});
    toast.error("Charge rejected â€” agent stopped");
  };

  const reset = () => { setPhase("idle");setAgent(null);setFlight(null);setHotel(null);setLedger([]);setTimer(0); };

  const dot:Record<string,string> = {success:"bg-emerald-400",failure:"bg-red-400",blocked:"bg-orange-400",pending_approval:"bg-amber-400 animate-pulse"};
  const col:Record<string,string> = {success:"text-emerald-400",failure:"text-red-400",blocked:"text-orange-400",pending_approval:"text-amber-400"};

  return (
    <div className="min-h-screen bg-[#06060F]">
      <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 bg-[#06060F]/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]/20 ring-1 ring-[#6C47FF]/30"><Zap className="h-4 w-4 text-[#6C47FF]"/></div>
            <span className="font-bold text-white">Drift</span>
            <span className="text-white/30">Â·</span>
            <span className="text-sm text-white/50">Travel Booking Demo</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-white/40">Apex active</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Book a business trip</h1>
            <p className="mt-1 text-sm text-white/50">Watch Drift authorize every step â€” scopes checked, step-up triggered, everything logged.</p>
          </div>

          {/* STEP 1 */}
          <div className={cn("rounded-2xl border p-6 transition-all",agent?"border-emerald-500/20 bg-emerald-950/10":phase==="idle"?"border-[#6C47FF]/30 bg-[#6C47FF]/5":"border-white/[0.06] bg-white/[0.02]")}>
            <div className="flex items-start gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",agent?"bg-emerald-500/15 ring-emerald-500/25":"bg-[#6C47FF]/15 ring-[#6C47FF]/25")}>
                {agent?<CheckCircle2 className="h-5 w-5 text-emerald-400"/>:<Bot className="h-5 w-5 text-[#6C47FF]"/>}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#6C47FF]/15 text-[#A78BFA]">STEP 1</span>
                <h3 className="mt-1 font-semibold text-white">Register the travel agent</h3>
                <p className="text-sm text-white/40 mt-0.5">Drift provisions an Auth0 M2M application, issues an AgentID, and configures Token Vault credentials.</p>
                <div className="mt-4">
                  {phase==="idle"&&<button onClick={registerAgent} className="flex items-center gap-2 rounded-xl bg-[#6C47FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3acc] transition-colors shadow-lg shadow-[#6C47FF]/20"><Zap className="h-4 w-4"/>Register agent via Drift SDK</button>}
                  {phase==="registering"&&<div className="flex items-center gap-2 text-sm text-white/50"><span className="h-4 w-4 rounded-full border-2 border-[#6C47FF]/30 border-t-[#6C47FF] animate-spin"/>Provisioning Auth0 M2M application...</div>}
                  {agent&&<div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                    <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-[#6C47FF]"/><span className="text-sm font-semibold text-white">travel-booking-agent</span><span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">ACTIVE</span></div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span className="text-white/30">AgentID</span><code className="text-white/60 font-mono truncate">{agent.id.slice(0,20)}â€¦</code>
                      <span className="text-white/30">Auth0 M2M</span><code className="text-white/60 font-mono truncate">{agent.auth0ClientId}</code>
                    </div>
                    <div className="flex flex-wrap gap-1">{agent.scopes.map(s=><span key={s} className={cn("text-[10px] font-mono rounded px-2 py-0.5",s==="card:charge"?"bg-amber-500/10 text-amber-300":"bg-[#6C47FF]/10 text-[#A78BFA]")}>{s}</span>)}</div>
                  </div>}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={cn("rounded-2xl border p-6 transition-all",!agent?"opacity-40 border-white/[0.04]":flight?"border-emerald-500/20 bg-emerald-950/10":phase==="searching_flights"?"border-[#6C47FF]/30 bg-[#6C47FF]/5":"border-white/[0.06] bg-white/[0.02]")}>
            <div className="flex items-start gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",flight?"bg-emerald-500/15 ring-emerald-500/25":"bg-[#6C47FF]/15 ring-[#6C47FF]/25")}>
                {flight?<CheckCircle2 className="h-5 w-5 text-emerald-400"/>:<Plane className="h-5 w-5 text-[#6C47FF]"/>}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#6C47FF]/15 text-[#A78BFA]">STEP 2</span>
                <h3 className="mt-1 font-semibold text-white">Search flights</h3>
                <p className="text-sm text-white/40 mt-0.5">Agent calls Amadeus API. Drift checks flights:book scope â€” Token Vault supplies the credential.</p>
                {agent&&!flight&&phase==="searching_flights"&&<div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400"><Shield className="h-3.5 w-3.5"/><code>flights:book</code><span className="ml-auto">âœ“ SCOPE GRANTED</span></div>
                  {MOCK_FLIGHTS.map(f=><button key={f.id} onClick={()=>selectFlight(f)} className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 hover:border-[#6C47FF]/30 hover:bg-[#6C47FF]/5 transition-all text-left group">
                    <Plane className="h-4 w-4 text-white/30 group-hover:text-[#6C47FF] shrink-0"/>
                    <div className="flex-1"><p className="text-sm font-medium text-white">{f.airline} <span className={cn("text-[10px] font-bold rounded px-1.5 py-0.5",f.class==="business"?"bg-amber-500/10 text-amber-300":"bg-white/[0.06] text-white/50")}>{f.class.toUpperCase()}</span></p><p className="text-xs text-white/40">{new Date(f.departure).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} â†’ {new Date(f.arrival).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p></div>
                    <div className="text-right shrink-0"><p className="text-sm font-bold text-white">${f.price}</p><p className="text-[10px] text-[#6C47FF]">Select â†’</p></div>
                  </button>)}
                </div>}
                {flight&&<div className="mt-4 flex items-center gap-3 rounded-xl bg-[#6C47FF]/10 border border-[#6C47FF]/20 p-3.5"><Plane className="h-4 w-4 text-[#6C47FF] shrink-0"/><div><p className="text-sm font-medium text-white">{flight.airline} Â· {flight.origin} â†’ {flight.destination}</p><p className="text-xs text-white/50">${flight.price}</p></div><span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">SELECTED</span></div>}
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className={cn("rounded-2xl border p-6 transition-all",!flight?"opacity-40 border-white/[0.04]":hotel?"border-emerald-500/20 bg-emerald-950/10":phase==="searching_hotels"?"border-[#6C47FF]/30 bg-[#6C47FF]/5":"border-white/[0.06] bg-white/[0.02]")}>
            <div className="flex items-start gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",hotel?"bg-emerald-500/15 ring-emerald-500/25":"bg-[#6C47FF]/15 ring-[#6C47FF]/25")}>
                {hotel?<CheckCircle2 className="h-5 w-5 text-emerald-400"/>:<Building2 className="h-5 w-5 text-[#6C47FF]"/>}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#6C47FF]/15 text-[#A78BFA]">STEP 3</span>
                <h3 className="mt-1 font-semibold text-white">Search hotels</h3>
                <p className="text-sm text-white/40 mt-0.5">Same pattern â€” scope checked, Token Vault provides credential, action logged.</p>
                {flight&&!hotel&&phase==="searching_hotels"&&<div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400"><Shield className="h-3.5 w-3.5"/><code>hotels:book</code><span className="ml-auto">âœ“ SCOPE GRANTED</span></div>
                  {MOCK_HOTELS.map(h=><button key={h.id} onClick={()=>selectHotel(h)} className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 hover:border-[#6C47FF]/30 hover:bg-[#6C47FF]/5 transition-all text-left group">
                    <Building2 className="h-4 w-4 text-white/30 group-hover:text-[#6C47FF] shrink-0"/>
                    <div className="flex-1"><p className="text-sm font-medium text-white">{h.name} <span className="text-[10px] text-amber-400">{"â˜…".repeat(h.stars)}</span></p><p className="text-xs text-white/40">{h.location}</p></div>
                    <div className="text-right shrink-0"><p className="text-sm font-bold text-white">${h.pricePerNight}<span className="text-[10px] text-white/40">/night</span></p><p className="text-[10px] text-[#6C47FF]">Select â†’</p></div>
                  </button>)}
                </div>}
                {hotel&&<div className="mt-4 flex items-center gap-3 rounded-xl bg-[#6C47FF]/10 border border-[#6C47FF]/20 p-3.5"><Building2 className="h-4 w-4 text-[#6C47FF] shrink-0"/><div><p className="text-sm font-medium text-white">{hotel.name}</p><p className="text-xs text-white/50">{hotel.location} Â· ${hotel.pricePerNight}/night</p></div><span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">SELECTED</span></div>}
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div className={cn("rounded-2xl border p-6 transition-all",!hotel?"opacity-40 border-white/[0.04]":phase==="complete"?"border-emerald-500/20 bg-emerald-950/10":["ciba_pending","ciba_approved","ciba_rejected","charging_card"].includes(phase)?"border-amber-500/25 bg-amber-950/10":"border-white/[0.06] bg-white/[0.02]")}>
            <div className="flex items-start gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",phase==="complete"?"bg-emerald-500/15 ring-emerald-500/25":"bg-amber-500/15 ring-amber-500/25")}>
                {phase==="complete"?<CheckCircle2 className="h-5 w-5 text-emerald-400"/>:<CreditCard className="h-5 w-5 text-amber-400"/>}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#6C47FF]/15 text-[#A78BFA]">STEP 4</span>
                <h3 className="mt-1 font-semibold text-white">Charge corporate card</h3>
                <p className="text-sm text-white/40 mt-0.5">card:charge is marked step-up required. Drift triggers Auth0 CIBA â€” human approval required before proceeding.</p>
                <div className="mt-4">
                  {/* Button shown when hotel is selected */}
                  {hotel&&phase==="hotel_selected"&&<button onClick={chargeCard} className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/25 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors"><Lock className="h-4 w-4"/>Proceed to payment (step-up required)</button>}
                  {phase==="charging_card"&&<div className="flex items-center gap-2 text-sm text-amber-400/70"><span className="h-4 w-4 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin"/>Checking card:charge scope â€” initiating CIBA...</div>}
                  {phase==="ciba_pending"&&agent&&<div className="rounded-xl bg-amber-950/30 border border-amber-500/25 p-5 space-y-4">
                    <div className="flex items-start gap-3"><AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5"/><div><p className="text-sm font-semibold text-white">Human approval required</p><p className="text-xs text-white/50 mt-0.5">The travel agent wants to charge <strong className="text-white">${agent.totalCharge?.toFixed(2)}</strong> to the corporate card. Auth0 CIBA has sent a push notification.</p></div></div>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                      <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest mb-2">Binding code â€” confirm on both screens</p>
                      <p className="text-3xl font-mono font-black text-amber-300 tracking-widest">{agent.cibaBinding}</p>
                      <p className="text-[10px] text-amber-400/50 mt-2">Expires in {timer}s</p>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full bg-amber-400 transition-all duration-1000" style={{width:`${(timer/60)*100}%`}}/></div>
                    <div className="flex gap-3">
                      <button onClick={approve} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"><CheckCircle2 className="h-4 w-4"/>Approve</button>
                      <button onClick={reject} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/15 border border-red-500/20 py-3 text-sm font-bold text-red-400 hover:bg-red-500/25 transition-colors"><XCircle className="h-4 w-4"/>Reject</button>
                    </div>
                    <p className="text-[10px] text-center text-white/25">This simulates Auth0 CIBA backchannel authentication</p>
                  </div>}
                  {phase==="ciba_approved"&&<div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-400"/><div><p className="text-sm font-semibold text-white">Approved â€” card charged</p><p className="text-xs text-white/50">ConsentChain updated Â· calendar written Â· confirmation sent</p></div></div>}
                  {phase==="ciba_rejected"&&<div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4"><XCircle className="h-5 w-5 text-red-400"/><div><p className="text-sm font-semibold text-white">Charge rejected</p><p className="text-xs text-white/50">Agent halted Â· action blocked in ConsentChain</p></div></div>}
                  {phase==="complete"&&<div className="space-y-3">
                    <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-4">
                      <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-5 w-5 text-emerald-400"/><span className="text-sm font-bold text-white">Trip booked successfully!</span></div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
                        <span>âœˆ {flight?.airline}</span><span>ðŸ¨ {hotel?.name}</span>
                        <span>ðŸ’³ ${agent?.totalCharge?.toFixed(2)} charged</span><span>ðŸ“… Calendar updated</span>
                      </div>
                    </div>
                    <button onClick={reset} className="text-xs text-[#6C47FF] hover:text-[#A78BFA] transition-colors">â†º Reset demo</button>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className={cn("rounded-2xl p-5 border",agent?"bg-white/[0.03] border-[#6C47FF]/20":"bg-white/[0.02] border-white/[0.05]")}>
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-[#6C47FF]"/>
              <span className="text-sm font-semibold text-white">Agent Identity</span>
              {agent&&<span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>}
            </div>
            {!agent?<p className="text-xs text-white/25">Register an agent in Step 1 to see its identity here.</p>:
            <div className="space-y-2">
              {[{l:"AgentID",v:agent.id.slice(0,18)+"â€¦"},{l:"Auth0 M2M",v:agent.auth0ClientId},{l:"Trust cert",v:agent.trustCert.slice(0,18)+"â€¦"}].map(({l,v})=>
                <div key={l} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-white/40">{l}</span>
                  <code className="text-[11px] font-mono text-white/60">{v}</code>
                </div>
              )}
              <div className="pt-2">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Token Vault Scopes</p>
                <div className="flex flex-wrap gap-1">{agent.scopes.map(s=><span key={s} className={cn("text-[10px] font-mono rounded px-2 py-0.5",s==="card:charge"?"bg-amber-500/10 text-amber-300":"bg-[#6C47FF]/10 text-[#A78BFA]")}>{s}</span>)}</div>
              </div>
            </div>}
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
              <ScrollText className="h-3.5 w-3.5 text-white/40"/>
              <span className="text-xs font-semibold text-white/60">Action Ledger</span>
              <span className="ml-auto text-[10px] font-mono text-white/30">{ledger.length} entries</span>
            </div>
            <div className="divide-y divide-white/[0.03] max-h-[480px] overflow-y-auto">
              {ledger.length===0?<div className="py-10 text-center text-xs text-white/20">Actions will appear here</div>:
              ledger.map(e=><div key={e.id} className="px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",dot[e.result])}/>
                  <code className="text-[11px] font-mono text-white/70 truncate flex-1">{e.action}</code>
                  <span className={cn("text-[10px] font-semibold shrink-0",col[e.result])}>{e.result==="pending_approval"?"pending":e.result}</span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5 ml-3.5">{e.detail}</p>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
