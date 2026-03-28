# Drift — Agent Identity & Authorization Platform

> **Auth0 "Authorized to Act" Hackathon 2026**

Drift is the identity and authorization mesh for AI agents. Every agent gets a verified identity, scoped permissions, human approval gates, and a tamper-proof audit trail — all powered by Auth0.

---

## What is Drift?

As AI agents become capable of booking flights, charging cards, sending emails, and making decisions autonomously, a critical question emerges: **how do you prove an agent had permission to do what it did?**

Drift answers that with four primitives:

| Primitive | Auth0 Feature | What It Does |
|---|---|---|
| **AgentID** | M2M Application | Cryptographic identity for every agent |
| **ScopeGraph** | Token Vault | Minimum-viable permission enforcement |
| **ConsentChain** | CIBA | Tamper-evident human approval records |
| **ActionLedger** | Log Streams | Append-only audit trail, real-time |

**Apex** — a Claude-powered meta-agent — governs all registered agents, detects anomalies, and can kill any agent instantly.

---

## Live Demo

The travel booking demo shows the complete Drift authorization flow:

1. **Register agent** — SDK provisions Auth0 M2M, issues AgentID, configures Token Vault
2. **Search flights** — `flights:book` scope checked, Token Vault supplies credential
3. **Search hotels** — same pattern, fully logged
4. **Charge card** — `card:charge` triggers Auth0 CIBA step-up approval
5. **Approve/reject** — human decision recorded in ConsentChain
6. **Full audit** — every action in ActionLedger, real-time

---

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend:** Fastify + Prisma + PostgreSQL
- **Auth:** Auth0 (Token Vault, M2M, CIBA, Management API)
- **AI (Apex):** Groq + Llama 3
- **SDK:** TypeScript (`@drift-ai/sdk`)
- **Monorepo:** Turborepo

---

## Project Structure

```
drift/
├── apps/
│   ├── portal/     # Next.js developer portal (port 3000)
│   ├── api/        # Fastify backend API (port 4000)
│   └── demo/       # Interactive travel booking demo (port 3001)
├── packages/
│   ├── sdk/        # @drift-ai/sdk TypeScript SDK
│   └── db/         # Prisma schema
└── HACKATHON_SUBMISSION.md
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase free tier)
- Auth0 account

### 1. Clone and install
```bash
git clone https://github.com/obooks29/drift.git
cd drift
```

### 2. Configure Auth0
Create three things in Auth0:
- **Regular Web Application** (Drift Portal) — for user login
- **Machine to Machine Application** (Drift M2M) — for agent provisioning
- **API** — identifier: `https://api.drift.ai`

### 3. Set up environment
Copy `.env.example` to `.env` in each app folder and fill in:
```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=<portal client id>
AUTH0_CLIENT_SECRET=<portal client secret>
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_SECRET=<32+ char random string>
AUTH0_M2M_CLIENT_ID=<m2m client id>
AUTH0_M2M_CLIENT_SECRET=<m2m client secret>
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
```

### 4. Set up database
```bash
cd packages/db
npx prisma db push
```

### 5. Run all apps

**Terminal 1 — API:**
```bash
cd apps/api
npm install
npm run dev   # port 4000
```

**Terminal 2 — Portal:**
```bash
cd apps/portal
npm install
npm run dev   # port 3000
```

**Terminal 3 — Demo:**
```bash
cd apps/demo
npm install
npm run dev   # port 3001
```

### 6. Open
| URL | What |
|---|---|
| http://localhost:3000 | Developer portal + landing page |
| http://localhost:3001 | Live travel booking demo |
| http://localhost:4000/health | API health check |

---

## How Token Vault Powers Drift

Token Vault is central to Drift's architecture. When an agent registers:

1. Drift calls Auth0 Management API to provision an M2M application
2. Each scope grant (`flights:book`, `card:charge`) maps to a distinct Token Vault key
3. When the agent needs to call a third-party API, it calls `drift.agents.getTokenForAction()`
4. Drift retrieves the scoped credential from Token Vault and returns a short-lived token
5. **The agent never stores credentials. Zero tokens in code.**

Revoking `card:charge` from an agent immediately removes that Token Vault key without affecting any other scope.

---

## CIBA Step-Up Authentication

For high-stakes actions marked `stepUpRequired`:

1. Agent tries to execute `card:charge`
2. Drift detects step-up requirement via ScopeGraph
3. Auth0 CIBA sends async push notification to delegating user's device
4. User sees binding code on both screens — confirms intent
5. User approves or rejects
6. Decision is recorded in ConsentChain as a cryptographically signed, chained record

---

## Built By

**Bukola Jimoh** - building at the intersection of AI, identity, and financial infrastructure.

*Auth0 "Authorized to Act" Hackathon 2026*