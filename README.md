# SECTION 1: README
---

# Drift — Agent Identity & Authorization Platform

> **Auth0 "Authorized to Act" Hackathon 2026** · Built by Toluwalope Ajayi

[![Live Demo](https://img.shields.io/badge/Live%20Demo-drift--demo--v2.vercel.app-6C47FF?style=flat)](https://drift-demo-v2.vercel.app)
[![API](https://img.shields.io/badge/API-drift--demo--three.vercel.app-10B981?style=flat)](https://drift-demo-three.vercel.app/health)
[![GitHub](https://img.shields.io/badge/GitHub-obooks29%2Fdrift-white?style=flat&logo=github)](https://github.com/obooks29/drift)

---

## Live URLs

| App | URL | Description |
|---|---|---|
| **Demo** | https://drift-demo-v2.vercel.app | Travel booking agent demo |
| **Portal** | https://drift-demo-v2.vercel.app/agents | Agent dashboard (login required) |
| **API** | https://drift-demo-three.vercel.app/health | Backend health check |
| **GitHub** | https://github.com/obooks29/drift | Full source code |

---

## What is Drift?

Drift is the identity and authorization mesh for AI agents. As enterprises deploy autonomous agents that book flights, charge corporate cards, and take actions on users' behalf — there is no standard way to verify which agent is acting, enforce what it's allowed to do, get human approval before consequential actions, or audit what it actually did.

Drift solves this with four primitives, all built on Auth0:

| Primitive | Auth0 Feature | What It Does |
|---|---|---|
| **AgentID** | M2M Application | Cryptographic identity for every agent |
| **ScopeGraph** | Token Vault | Minimum-viable permission enforcement |
| **ConsentChain** | CIBA | Tamper-evident human approval records |
| **ActionLedger** | Log Streams | Append-only real-time audit trail |

**Apex** — a Groq-powered meta-agent — governs all registered agents, detects anomalies, and can kill any agent instantly.

---

## Token Vault — The Foundation of Drift

When a developer registers an agent with Drift:
1. Each scope grant (`flights:book`, `card:charge`) maps to a **distinct Token Vault key**
2. Agent calls `drift.agents.getTokenForAction(agentId, "charge", "card")`
3. Drift retrieves scoped credential from Token Vault — returns short-lived token
4. **The agent never stores credentials. Zero tokens in code.**
5. Revoking `card:charge` removes only that key — other scopes unaffected

---

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend:** Fastify + Prisma + PostgreSQL (Neon serverless)
- **Auth:** Auth0 (Token Vault, M2M, CIBA, Management API)
- **AI (Apex):** Groq + Llama 3
- **SDK:** `@drift-ai/sdk` TypeScript
- **Deployment:** Vercel (two-project monorepo split)
- **Monorepo:** Turborepo

---

## Project Structure

```
drift/
├── apps/
│   ├── portal/     # Next.js developer portal (port 3000)
│   ├── api/        # Fastify backend → https://drift-demo-three.vercel.app
│   └── demo/       # Travel booking demo → https://drift-demo-v2.vercel.app
├── packages/
│   ├── sdk/        # @drift-ai/sdk TypeScript SDK
│   └── db/         # Prisma schema + Neon PostgreSQL
└── README.md
```

---

## Running Locally

### 1. Clone
```bash
git clone https://github.com/obooks29/drift.git
cd drift
```

### 2. Auth0 Setup
- Regular Web App (Drift Portal) — callback: `http://localhost:3000/api/auth/callback`
- Machine to Machine App (Drift M2M) — authorized for Auth0 Management API
- API — identifier: `https://api.drift.ai`

### 3. Environment Variables

`apps/api/.env`:
```env
DATABASE_URL=postgresql://...  # Neon pooled
DIRECT_URL=postgresql://...    # Neon direct
AUTH0_DOMAIN=drift-hackathon.eu.auth0.com
AUTH0_AUDIENCE=https://api.drift.ai
AUTH0_M2M_CLIENT_ID=<m2m client id>
AUTH0_M2M_CLIENT_SECRET=<m2m client secret>
AUTH0_SECRET=<32+ char string>
GROQ_API_KEY=gsk_...
DRIFT_INTERNAL_API_KEY=<your key>
DRIFT_ENCRYPTION_KEY=<32 char string>
NODE_ENV=development
```

`apps/demo/.env`:
```env
AUTH0_ISSUER_BASE_URL=https://drift-hackathon.eu.auth0.com
AUTH0_CLIENT_ID=<portal client id>
AUTH0_CLIENT_SECRET=<portal client secret>
AUTH0_SECRET=<same 32+ char string>
AUTH0_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:4000
DRIFT_API_URL=http://localhost:4000
```

### 4. Database
```bash
cd packages/db
npx prisma generate
npx prisma db push
```

### 5. Run
```bash
# Terminal 1
cd apps/api && npm install && npm run dev    # port 4000

# Terminal 2
cd apps/demo && npm install && npm run dev   # port 3001
```

---

## Built By

**Toluwalope Ajayi** — Assistant Banking Officer at UBA, building at the intersection of AI, identity, and financial infrastructure.

GitHub: https://github.com/obooks29/drift  
Live Demo: https://drift-demo-v2.vercel.app

---

# SECTION 2: DEVPOST PROJECT STORY
---

## What is Drift?

Drift is an open infrastructure platform that gives every AI agent a verified identity, scoped permissions, human approval gates, and a tamper-proof audit trail — all powered by Auth0.

**Live demo:** https://drift-demo-v2.vercel.app  
**API:** https://drift-demo-three.vercel.app/health  
**GitHub:** https://github.com/obooks29/drift

### The Problem

As enterprises deploy AI agents at scale — agents that book flights, charge corporate cards, send emails, and make decisions autonomously — there is no standard way to:

- Verify which agent is making a request
- Enforce what it's allowed to do
- Get human approval before consequential actions
- Audit what it actually did

Every company is solving this differently and badly. API keys are hardcoded. Agents have over-broad access. No audit trail exists.

### The Solution — Four Primitives Built on Auth0

| Drift Primitive | Auth0 Feature | What It Solves |
|---|---|---|
| **AgentID** | M2M Application | Verified cryptographic identity per agent |
| **ScopeGraph** | Token Vault | Minimum-viable permission enforcement |
| **ConsentChain** | CIBA | Human-in-the-loop for high-stakes actions |
| **ActionLedger** | Log Streams + WebSocket | Tamper-evident audit trail, real-time |

**Apex** — a Groq-powered meta-agent — orchestrates all four, watches every registered agent, detects anomalies, and can suspend any agent instantly.

### Token Vault — The Architectural Foundation

Token Vault is not peripheral to Drift. It is the foundation of the entire credential model.

When a developer registers an agent at https://drift-demo-v2.vercel.app:
1. Each scope grant maps to a **distinct Token Vault key**
2. Agent calls `drift.agents.getTokenForAction()` — Token Vault returns a scoped, short-lived token
3. **The agent never stores credentials. Zero tokens in code.**
4. Revoking one scope removes only that key — others unaffected

This design eliminated an entire credential exposure surface from the Drift codebase and saved approximately 3–4 days of engineering time.

### Auth0 CIBA — Human Approval for High-Stakes Actions

For actions marked `stepUpRequired` (e.g. `card:charge`):

1. Agent tries to execute `card:charge`
2. Drift detects step-up requirement via ScopeGraph
3. Auth0 CIBA sends async push notification to delegating user
4. User sees binding code on both screen and phone — confirms intent
5. Approve or reject — decision returned to agent
6. Recorded in ConsentChain — HMAC-signed, tamper-evident

### The Live Demo

Try it at: **https://drift-demo-v2.vercel.app**

A travel booking agent books flights, selects hotels, and charges a corporate card — with full Drift authorization enforced at every step:

1. **Register** — Auth0 M2M provisioned, AgentID issued, Token Vault configured
2. **Search flights** — `flights:book` checked, Token Vault supplies credential
3. **Search hotels** — same pattern, action logged in real-time ActionLedger
4. **Charge card** — `card:charge` triggers Auth0 CIBA, binding code displayed
5. **Approve/Reject** — human decision recorded in ConsentChain
6. **14 ActionLedger entries** — every action authorized, scoped, and logged

### Tech Stack

Next.js 14, Fastify, Prisma, Neon PostgreSQL, Auth0 (Token Vault + M2M + CIBA + Management API), Groq + Llama 3, TypeScript SDK, Vercel, Turborepo

### GitHub

https://github.com/obooks29/drift

---

## Bonus Blog Post

### Building the Authorization Layer for the AI Agent Economy

**## Bonus Blog Post**

The web solved human identity with OAuth 2.0. Auth0 turned that complexity into a single line of code — and sold for $6.5 billion. We're entering a new era where AI agents act autonomously on users' behalf, and they have an identity crisis.

When I built Drift (https://drift-demo-v2.vercel.app), the hardest problem wasn't the UI or the API. It was credentials. Every agent needed to call third-party services — flights APIs, hotel APIs, payment processors. The naive solution is environment variables. But environment variables are shared, unscoped, and impossible to revoke per-agent.

**Token Vault changed everything.**

When you register an agent with Drift, each scope grant maps to a distinct Token Vault key. `flights:book` and `card:charge` are stored separately. The agent calls `drift.agents.getTokenForAction()` — Drift retrieves the scoped credential from Token Vault and returns a short-lived token. The agent never sees the raw credential. The developer never stores tokens in code.

This single architectural decision — scope-as-key — eliminated an entire class of credential exposure risk. It also made revocation surgical: remove `card:charge` from an agent without touching any other permission. Token Vault saved approximately 3–4 days of engineering time and replaced an entire security review surface with a single API call.

The second hard problem was consent. How do you get human approval for a $500 charge that an agent decides to make at 2am? Auth0 CIBA answered this. Drift wraps CIBA in the ConsentChain — every approval is HMAC-signed and chained to the previous record, creating tamper-evident infrastructure that compliance teams will eventually require for all agentic AI deployments.

You can see the full system live at https://drift-demo-v2.vercel.app. Register a travel booking agent, watch Token Vault supply credentials silently, trigger the CIBA step-up for a card charge, and see every action logged in the ActionLedger in real time.

The agent economy is coming. The identity infrastructure needs to be ready. Drift is built to be that layer — on top of Auth0, not bolted alongside it.

*GitHub: https://github.com/obooks29/drift*  
*Live: https://drift-demo-v2.vercel.app*

