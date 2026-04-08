# Drift — Agent Identity & Authorization Platform

> **Auth0 "Authorized to Act" Hackathon 2026** · Built by Bukola Jimoh

[![Live Demo](https://img.shields.io/badge/Live%20Demo-drift--demo--v2.vercel.app-6C47FF?style=flat)](https://drift-demo-v2.vercel.app)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-FF0000?style=flat&logo=youtube)](https://youtu.be/VQapMB7G1co)
[![API](https://img.shields.io/badge/API-drift--demo--three.vercel.app-10B981?style=flat)](https://drift-demo-three.vercel.app/health)
[![GitHub](https://img.shields.io/badge/GitHub-obooks29%2Fdrift-white?style=flat&logo=github)](https://github.com/obooks29/drift)

---

## Live URLs

| App | URL | Description |
|---|---|---|
| **Demo** | https://drift-demo-v2.vercel.app | Travel booking agent demo |
| **Portal** | https://drift-demo-v2.vercel.app/agents | Agent dashboard (login required) |
| **API** | https://drift-demo-three.vercel.app/health | Backend health check |
| **Demo Video** | https://youtu.be/VQapMB7G1co | Full walkthrough on YouTube |
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

**Bukola Jimoh** — Building at the intersection of AI, identity, and financial infrastructure.

GitHub: https://github.com/obooks29/drift  
Live Demo: https://drift-demo-v2.vercel.app  
Demo Video: https://youtu.be/VQapMB7G1co
