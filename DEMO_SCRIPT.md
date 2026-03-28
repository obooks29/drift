# Drift Demo Video Script — 3 Minutes
## "Authorized to Act" Hackathon 2026

---

### [0:00–0:20] Hook — The Problem

**[Screen: white background, giant text appears one line at a time]**

"Your AI agent can book flights."
"It can charge your card."
"It can email your boss."

"But can you prove it had permission?"
"Can you stop it mid-action?"
"Can you audit everything it did?"

**[Cut to: chaotic code with API keys in .env file, agent failing silently]**

*Voiceover: "Most teams answer these questions with hope. We built Drift to answer them with proof."*

---

### [0:20–0:35] Introduce Drift

**[Screen: Drift portal homepage, dark UI, Apex status indicator glowing green]**

*Voiceover: "Drift is the identity and authorization mesh for AI agents. Four primitives — AgentID, ScopeGraph, ConsentChain, ActionLedger — all powered by Auth0. And one meta-agent, Apex, that watches everything."*

**[Quick pan across: agents list, ledger, consent chain — each page appears for 2 seconds]**

---

### [0:35–1:10] Live Demo — Register the Agent

**[Screen: Demo app at localhost:3001]**

*Voiceover: "Here's our travel booking agent. It needs to book flights, hotels, and charge the corporate card."*

**[Click: Register agent via Drift SDK]**

**[Screen shows: spinner → agent card appears with AgentID, Auth0 Client ID, Trust Certificate]**

*Voiceover: "One SDK call. Drift provisions an Auth0 M2M application, issues a cryptographically signed AgentID, and configures Token Vault credentials for each scope."*

**[Right panel: ActionLedger filling in real time]**
- `agent:register → success`
- `scope:grant → success` (4 scopes)
- `trust:cert:issue → success`
- `apex:watch → success`

*Voiceover: "The ActionLedger records every step. Apex is now watching."*

---

### [1:10–1:35] Scope Checks — No Step-Up

**[Screen: flight search results appear]**

*Voiceover: "Agent searches flights. Drift checks the ScopeGraph — flights:book is granted, no step-up required, Token Vault supplies the Amadeus credential."*

**[Select flight, hotel search appears immediately]**

*Voiceover: "Same for hotels. Scope granted, credential supplied, action logged. No human needed — these are low-stakes read and book operations."*

**[Right panel: two more ledger entries — scope:check success, token retrieved]**

---

### [1:35–2:15] CIBA Step-Up — The Critical Moment

**[Click: Proceed to payment]**

**[Screen: amber warning box appears — "Human approval required"]**

*Voiceover: "But card:charge is marked step-up required. Drift doesn't let the agent proceed. Instead, it triggers Auth0 CIBA — an async push notification to the delegating user."*

**[Show: binding message "DRIFT-7X4K" prominently displayed]**

*Voiceover: "The binding message ties the screen to the notification. The user sees the same code on their phone. They know exactly what they're approving."*

**[Show: amount, merchant, what the agent is trying to do]**

**[Click: Approve]**

**[ActionLedger: ciba:approved → success, card:charge → success]**

*Voiceover: "Approved. The charge goes through. The ConsentChain records the approval with a cryptographic signature, chained to every previous record. This is tamper-evident audit infrastructure."*

---

### [2:15–2:40] Apex & Portal

**[Switch to: Drift Portal — Apex dashboard]**

*Voiceover: "Meanwhile, Apex has been watching. It runs periodic sweeps using Claude to detect anomalies — unusual action spikes, expiring certificates, high failure rates."*

**[Show: radar chart, anomaly detected]**

**[Switch to: Agents page — show suspend button]**

*Voiceover: "One click suspends an agent. Drift immediately blocks the Auth0 M2M application — all its tokens are invalidated. This is the kill switch the enterprise needs."*

---

### [2:40–3:00] Close — The SDK

**[Screen: code editor showing 10 lines of TypeScript]**

```typescript
const { agent } = await drift.agents.register({
  name: 'my-agent',
  scopes: [{ resource: 'card', action: 'charge' }],
  stepUp: ['card:charge'],
  delegatedBy: 'user@company.com',
  governedBy: Drift.Apex,
});
```

*Voiceover: "Ten lines. That's all it takes to give your agent a verified identity, scoped credentials via Token Vault, CIBA-backed human approval, and an immutable audit trail. Apex watches it automatically."*

**[Final screen: Drift logo + tagline]**

*"Drift. The identity layer for the AI agent economy."*
*"Built on Auth0. Powered by Apex."*

---

### Recording Notes
- Record at 1080p minimum
- Use a dark monitor / reduce glare
- Demo at localhost:3001 (demo app) + localhost:3000 (portal)
- Keep pace deliberate — judges need to read the ActionLedger entries
- Emphasise the CIBA binding message — that's the visual centrepiece
- The 3-minute limit is a soft cap — aim for 2:55
