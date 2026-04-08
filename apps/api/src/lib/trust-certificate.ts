/**
 * Trust Certificate Service
 * Issues and verifies JWT trust certificates for Drift agents.
 * These are signed tokens agents present to prove their identity.
 *
 * Why the explicit `as string` casts below:
 *   `TrustCertPayload extends JWTPayload` inherits an index signature
 *   `[propName: string]: unknown` from jose's JWTPayload.  When the type
 *   is used through `Omit<...>` TypeScript resolves all property lookups
 *   through that index signature, widening them to `unknown` even though
 *   they are explicitly declared as `string` on TrustCertPayload.
 *   The casts are safe: the shape is guaranteed by the interface definition.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHmac, randomBytes } from "crypto";

export interface TrustCertPayload extends JWTPayload {
  agentId: string;
  agentName: string;
  organizationId: string;
  auth0ClientId: string;
  scopes: string[];          // e.g. ["flights:book", "card:charge"]
  governedByApex: boolean;
  version: number;
}

export interface TrustCertificate {
  token: string;             // Signed JWT
  fingerprint: string;       // SHA-256 fingerprint for quick lookups
  issuedAt: Date;
  expiresAt: Date;
}

/** Get the signing key — derived from DRIFT_ENCRYPTION_KEY + org ID */
function signingKey(orgId: string): Uint8Array {
  const secret = process.env.DRIFT_ENCRYPTION_KEY ?? "dev-secret-change-me-32-chars-xx";
  const key = createHmac("sha256", secret).update(orgId).digest();
  return new Uint8Array(key);
}

/** Issue a trust certificate for an agent */
export async function issueTrustCertificate(
  payload: Omit<TrustCertPayload, "iss" | "iat" | "exp">
): Promise<TrustCertificate> {
  const now = new Date();
  const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Explicit casts needed: Omit<TrustCertPayload, …> surfaces the JWTPayload
  // index signature which widens all fields to `unknown`.
  const organizationId = payload.organizationId as string;
  const agentId = payload.agentId as string;

  const key = signingKey(organizationId);

  const token = await new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "drift+jwt" })
    .setIssuer("https://api.drift.ai")
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(randomBytes(16).toString("hex"))
    .sign(key);

  const fingerprint = createHmac("sha256", token)
    .update(agentId)
    .digest("hex")
    .slice(0, 16);

  return { token, fingerprint, issuedAt: now, expiresAt: exp };
}

/** Verify a trust certificate */
export async function verifyTrustCertificate(
  token: string,
  organizationId: string
): Promise<TrustCertPayload | null> {
  try {
    const key = signingKey(organizationId);
    const { payload } = await jwtVerify(token, key, {
      issuer: "https://api.drift.ai",
    });
    return payload as unknown as TrustCertPayload;
  } catch {
    return null;
  }
}

/** Rotate a certificate — issues a new one with incremented version */
export async function rotateTrustCertificate(
  existing: TrustCertPayload,
  organizationId: string
): Promise<TrustCertificate> {
  return issueTrustCertificate({
    ...existing,
    organizationId,
    version: (existing.version ?? 1) + 1,
  });
}