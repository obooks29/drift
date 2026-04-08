/**
 * Consent Chain Cryptography
 * Each consent record is HMAC-signed and linked to the previous record,
 * creating a tamper-evident chain. Any modification breaks the chain.
 */
import { createHmac } from "crypto";

export interface ConsentChainEntry {
  id: string;
  agentId: string;
  action: string;
  approvedBy: string;
  metadata: Record<string, unknown>;
  timestamp: string;           // ISO string
  cibaRequestId?: string;
  previousHash: string;        // Hash of the previous record
  signature: string;           // HMAC of this record's content
}

const CHAIN_SECRET = () => process.env.DRIFT_ENCRYPTION_KEY ?? "dev-secret-change-me-32-chars-xx";

/** Compute the canonical hash of a record (deterministic JSON) */
export function hashRecord(record: Omit<ConsentChainEntry, "signature">): string {
  const canonical = JSON.stringify({
    id: record.id,
    agentId: record.agentId,
    action: record.action,
    approvedBy: record.approvedBy,
    metadata: record.metadata,
    timestamp: record.timestamp,
    previousHash: record.previousHash,
  });
  return createHmac("sha256", CHAIN_SECRET()).update(canonical).digest("hex");
}

/** Sign a new consent record */
export function signConsentRecord(
  record: Omit<ConsentChainEntry, "signature">
): ConsentChainEntry {
  const signature = `sha256:${hashRecord(record)}`;
  return { ...record, signature };
}

/** Verify a single record's signature */
export function verifyRecord(record: ConsentChainEntry): boolean {
  // Destructure out `signature` so the rest matches Omit<ConsentChainEntry, "signature">
  // This is the correct fix: passing `{ ...record }` to hashRecord previously included
  // the `signature` field, which TypeScript rightly rejected as a type error.
  const { signature, ...recordWithoutSignature } = record;
  const expected = `sha256:${hashRecord(recordWithoutSignature)}`;
  return signature === expected;
}

/** Verify the entire chain — each record's previousHash must match the previous signature */
export function verifyChain(records: ConsentChainEntry[]): {
  valid: boolean;
  brokenAt?: string;
  brokenReason?: string;
} {
  if (records.length === 0) return { valid: true };

  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;

    // First record must point to genesis
    if (i === 0) {
      if (record.previousHash !== "genesis") {
        return { valid: false, brokenAt: record.id, brokenReason: "First record must reference genesis" };
      }
      continue;
    }

    const prev = records[i - 1]!;
    const expectedPrevHash = prev.signature.replace("sha256:", "");
    const actualPrevHash = record.previousHash;

    if (actualPrevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: record.id,
        brokenReason: `Hash mismatch at position ${i}: expected ${expectedPrevHash.slice(0, 8)}…, got ${actualPrevHash.slice(0, 8)}…`,
      };
    }
  }

  return { valid: true };
}

/** Get the latest hash to use as previousHash for the next record */
export function getChainTip(records: ConsentChainEntry[]): string {
  if (records.length === 0) return "genesis";
  return records[records.length - 1]!.signature.replace("sha256:", "");
}