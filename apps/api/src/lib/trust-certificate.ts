/**
 * Trust Certificate Service
 * Issues and verifies JWT trust certificates for Drift agents.
 * These are signed tokens agents present to prove their identity.
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
export async function issueTrustCertificate(payload: Omit<TrustCertPayload, "iss" | "iat" | "exp">): Promise<TrustCertificate> {
  const now = new Date();
  const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const key = signingKey(payload.organizationId);

  const token = await new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "drift+jwt" })
    .setIssuer("https://api.drift.ai")
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(randomBytes(16).toString("hex"))
    .sign(key);

  const fingerprint = createHmac("sha256", token)
    .update(payload.agentId)
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
