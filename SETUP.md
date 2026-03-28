# Drift — Setup Guide

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Supabase free tier)
- Auth0 account (free tier works for dev)
- Anthropic API key

### 1. Clone and install
```bash
git clone https://github.com/your-org/drift
cd drift
npm install
```

### 2. Configure Auth0

**Create a Regular Web Application** (for the portal):
- Application Type: Regular Web Application
- Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`

**Create a Machine to Machine Application** (for Drift to provision agents):
- Grant it access to the Auth0 Management API with scopes:
  - `read:clients`, `create:clients`, `delete:clients`, `update:clients`
  - `read:client_grants`, `create:client_grants`, `delete:client_grants`
  - `read:users`, `update:users`
  - `create:log_streams`

**Create an API** (your protected resource):
- Identifier: `https://api.drift.ai`
- This is the audience agents authenticate against

**Enable CIBA** (for step-up auth):
- Go to Auth0 Dashboard → Advanced → CIBA
- Enable and configure push provider (Auth0 Guardian or custom)

### 3. Set up environment
```bash
cp .env.example .env
```

Fill in:
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=<portal-app-client-id>
AUTH0_CLIENT_SECRET=<portal-app-client-secret>
AUTH0_AUDIENCE=https://api.drift.ai
AUTH0_M2M_CLIENT_ID=<m2m-app-client-id>
AUTH0_M2M_CLIENT_SECRET=<m2m-app-client-secret>
DATABASE_URL=postgresql://user:pass@localhost:5432/drift_db
DRIFT_ENCRYPTION_KEY=<exactly-32-characters-here!!>
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Set up database
```bash
# Start PostgreSQL (or use Supabase)
npm run db:push
```

### 5. Run in development
```bash
# Terminal 1: API server (port 4000)
cd apps/api && npm run dev

# Terminal 2: Portal (port 3000)
cd apps/portal && npm run dev

# Terminal 3: Demo app (port 3001)
cd apps/demo && npm run dev
```

Open:
- Portal: http://localhost:3000
- Demo app: http://localhost:3001
- API health: http://localhost:4000/health

---

## Architecture Overview

```
apps/
├── portal/    Next.js 14 developer portal (port 3000)
├── api/       Fastify backend API (port 4000)
└── demo/      Travel booking demo (port 3001)

packages/
├── sdk/       @drift-ai/sdk TypeScript SDK
└── db/        @drift-ai/db Prisma schema
```

## Key Files

| File | Description |
|------|-------------|
| `apps/api/src/lib/auth0-management.ts` | Auth0 Management API client — M2M provisioning, Token Vault, CIBA |
| `apps/api/src/lib/trust-certificate.ts` | JWT trust certificate generation and verification |
| `apps/api/src/lib/consent-chain-crypto.ts` | HMAC-chained consent record cryptography |
| `apps/api/src/services/agent-service.ts` | Core agent lifecycle (register, suspend, revoke) |
| `apps/api/src/services/consent-service.ts` | CIBA flow + ConsentChain persistence |
| `apps/api/src/services/apex-service.ts` | Claude-powered meta-agent governance |
| `packages/sdk/src/index.ts` | Public SDK entry point |
| `apps/demo/src/components/booking/DemoApp.tsx` | Interactive demo walkthrough |
