# Drift + Apex — Hackathon Submission
## Auth0 "Authorized to Act" · April 2026

---

## Text Description

### What is Drift?

Drift is an open infrastructure platform that provides standardised identity, authorization, and trust management for AI agent ecosystems. Its core engine, **Apex**, is an AI meta-agent (powered by Claude) that governs, monitors, and can kill all other agents.

**One-line pitch:** Drift is to AI agents what Auth0 is to humans. Auth0 sold to Okta for $6.5B.

### The Problem

As enterprises deploy AI agents at scale — agents that spawn sub-agents, call third-party APIs, and take actions on users' behalf — there is no standard way to:
- Verify which agent is making a request (identity)
- Enforce what it's allowed to do (authorization)
- Get human approval before consequential actions (step-up auth)
- Audit what it actually did (accountability)

Every company is solving this differently and badly. API keys are hardcoded. Agents have over-broad access "just in case." No audit trail exists. When something goes wrong, there's no kill switch.

### The Solution: Four Primitives Built on Auth0

| Drift Primitive | Auth0 Feature Used | What It Solves |
|----------------|-------------------|----------------|
| **AgentID** | M2M Application | Verified cryptographic identity per agent |
| **ScopeGraph** | Token Vault + custom scopes | Minimum-viable permission enforcement |
| **ConsentChain** | CIBA (backchannel auth) | Human-in-the-loop for high-stakes actions |
| **ActionLedger** | Log Streams + WebSocket | Tamper-evident audit trail, real-time |

**Apex** orchestrates all four — it's the meta-agent that watches every registered agent, detects anomalies using Claude, and can suspend or revoke any agent instantly.

### Token Vault Usage (Core Requirement)

Token Vault is central to Drift's architecture, not peripheral:

- When a developer registers an agent, Drift calls Auth0 Management API to provision an M2M application and store per-scope Token Vault credentials
- When an agent needs to call a third-party API (Amadeus for flights, Stripe for payments), it calls `drift.agents.getTokenForAction()` — Drift retrieves the scoped credential from Token Vault and returns a short-lived access token
- The agent never stores credentials. The developer never sees credentials in their code. Token Vault is the single source of truth
- Each scope grant maps to a distinct Token Vault key — so revoking `card:charge` from an agent immediately removes that credential without affecting `flights:book`

### CIBA Step-Up Authentication

For high-stakes actions (payments, deletions, any action marked `stepUpRequired`):
1. Agent tries to execute `card:charge`
2. Drift detects step-up requirement via ScopeGraph
3. Auth0 CIBA sends an async backchannel request to the delegating user's device
4. User sees a push notification with a binding message (e.g. "DRIFT-7X4K") that matches what's on screen
5. User approves or rejects — decision is recorded in the ConsentChain as a cryptographically signed, chained record
6. Agent proceeds (or is blocked) based on the decision

### The Demo: Travel Booking Agent

The live demo at `http://localhost:3001` walks through:
1. **Register** — SDK call provisions Auth0 M2M, issues AgentID, configures Token Vault
2. **Search flights** — `flights:book` scope checked (no step-up), Token Vault supplies Amadeus credential
3. **Search hotels** — `hotels:book` scope checked, same pattern
4. **Charge card** — `card:charge` triggers CIBA, binding message shown, user approves/rejects
5. **Audit** — every action logged in ActionLedger with timing, token reference, and result

The right panel shows the live ActionLedger updating in real time throughout the flow.

### Technical Stack

- **Frontend:** Next.js 14 + Tailwind CSS (developer portal + demo app)
- **Backend:** Fastify (Node.js) REST API + WebSocket
- **Auth:** Auth0 (Token Vault, M2M, CIBA, Log Streams)
- **AI (Apex):** Anthropic Claude claude-sonnet-4-20250514
- **Agent framework:** TypeScript SDK (`@drift-ai/sdk`)
- **Database:** PostgreSQL via Prisma
- **Monorepo:** Turborepo

### Why This Wins

**Security Model:** Token Vault manages all credentials. CIBA gates every high-stakes action. ScopeGraph enforces minimum permissions. ActionLedger provides full accountability. Kill switch via Apex.

**User Control:** ConsentChain shows every approval. Per-scope revocation. Binding message confirms user intent. Apex dashboard shows real-time agent health.

**Technical Execution:** Auth0 used to full depth — M2M + Token Vault + CIBA + Log Streams. TypeScript SDK. Multi-agent LangGraph architecture. Real-time WebSocket ledger.

**Potential Impact:** Every AI agent developer needs this. This is infrastructure — like TLS for the web, or OAuth for human logins. The market is every company building agents, which by 2026 is every company.

**Insight Value:** Drift surfaces the most important unsolved pattern in agent security: agent-to-agent delegated trust with CIBA-backed human approval. The ConsentChain concept — human approvals as a cryptographically chained, immutable record — is a novel contribution to how Auth0's authorization patterns should evolve.

---

## Bonus Blog Post

### Building the Authorization Layer for the AI Agent Economy

*How Auth0 Token Vault solves the hardest problem in agentic AI*

The web has solved human identity. OAuth 2.0 and OpenID Connect let billions of users authenticate to millions of services. Auth0 turned that complexity into a single line of code. It worked so well that Okta paid $6.5 billion for it.

But we're entering a new era. AI agents — autonomous systems that act on behalf of humans — are being deployed at scale, and they have an identity crisis.

**The problem isn't new. The tools are.**

When a human logs into a service, they present credentials, get a scoped token, and the service trusts them for that session. Simple, auditable, revocable.

When an AI agent calls a service on a user's behalf, none of that works cleanly. The agent needs to:
- Prove it has the user's permission to act
- Use the right credential for each service
- Never exceed the scope the user intended
- Leave an audit trail the user can inspect

Most teams solve this with API keys in environment variables and hope. Drift solves it with Token Vault.

**Token Vault as agent credential infrastructure**

Auth0 Token Vault stores OAuth tokens for third-party services under a user's account. We extended this concept: when you register an agent with Drift, each scope grant (`flights:book`, `card:charge`) maps to a distinct Token Vault key. The agent never sees the raw credential. The developer never stores tokens in code.

When the agent needs to call the Amadeus flights API, it calls Drift:

```typescript
const { accessToken } = await drift.agents.getTokenForAction(
  agentId, 'book', 'flights'
);
// Token Vault returns a scoped, short-lived token
```

Revoking `card:charge` from an agent removes that Token Vault key without touching any other scope. This is the architecture that token-in-env-var can never achieve.

**CIBA: the consent model agents were missing**

The trickiest problem in agentic AI isn't technical — it's consent. How do you get a human to approve a $500 charge that an agent decides to make at 2am?

Auth0's Client-Initiated Backchannel Authentication (CIBA) is the answer. CIBA lets an agent trigger an async push notification to a user's device. The user approves or rejects. The decision is returned to the agent.

Drift wraps this in the ConsentChain — every approval is HMAC-signed and linked to the previous record, creating a tamper-evident chain. Any modification breaks the chain. This is the audit infrastructure that compliance teams will require as AI agents become regulated.

**What we learned**

Building Drift revealed a gap in how agent authorization is usually discussed. Most writing focuses on what agents should be *allowed* to do. Almost none addresses who *authorized* that permission, when, and what the evidence is.

Token Vault solves "how do agents get credentials." CIBA solves "who approved this action." Drift connects them into a coherent authorization mesh. The pattern we're calling the ConsentChain — CIBA approval + cryptographic chaining — is the missing piece.

As the agent economy scales, this infrastructure will be as foundational as TLS or OAuth. We built Drift to be that foundation.

---

*Drift was built by Toluwalope Ajayi for the Auth0 "Authorized to Act" Hackathon, April 2026.*
