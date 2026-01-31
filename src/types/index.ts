/**
 * Sigil Protocol - Type Definitions
 */

/** Raw Ed25519 keypair bytes */
export interface SigilKeypair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** Agent creation options */
export interface CreateAgentOptions {
  name: string;
  framework?: string;
  version?: string;
  capabilities?: string[];
  endpoints?: Record<string, string>;
}

/** Ownership claim methods */
export type OwnershipMethod = 'dns' | 'social' | 'email' | 'zkp' | 'multi-sig';

/** Ownership claim embedded in Agent Document */
export interface OwnershipClaim {
  claim: string;
  method: OwnershipMethod;
  verifiedAt?: string;
}

/** Integrity attestation */
export interface IntegrityAttestation {
  soulHash: string;
  configHash?: string;
  files: string[];
  attestedAt: string;
  signature: string;
}

/** Cryptographic proof on a document */
export interface DocumentProof {
  type: 'Ed25519Signature2020';
  created: string;
  verificationMethod: string;
  proofValue: string;
}

/** The core Agent Document (Sigil Doc) */
export interface AgentDocument {
  '@context': string;
  id: string;
  name: string;
  framework?: string;
  version?: string;
  created: string;
  capabilities?: string[];
  endpoints?: Record<string, string>;
  owner?: OwnershipClaim;
  integrity?: IntegrityAttestation;
  proof: DocumentProof;
}

/** Interaction receipt quality */
export type ReceiptQuality = 'positive' | 'negative' | 'neutral';

/** Signed interaction receipt */
export interface InteractionReceipt {
  type: 'interaction-receipt';
  id: string;
  from: string;
  to: string;
  timestamp: string;
  action: string;
  quality: ReceiptQuality;
  context?: string;
  fromProof: string;
  toProof?: string;
}

/** Result of a verification check */
export interface VerificationResult {
  valid: boolean;
  sigilId: string;
  reason?: string;
}

/** Key rotation statement — signed by the OLD key to authorize transition */
export interface KeyRotationStatement {
  type: 'key-rotation';
  previousKey: string; // hex-encoded old public key
  newKey: string; // hex-encoded new public key
  sigilId: string; // sigil identifier associated with this rotation
  rotatedAt: string; // ISO 8601
  reason: 'routine' | 'compromised' | 'upgrade';
  /** Signature by the OLD private key over the canonical body */
  proof: string; // base58-encoded Ed25519 signature
}

/** Key revocation statement — signed by current key or owner */
export interface KeyRevocationStatement {
  type: 'key-revocation';
  revokedKey: string; // hex-encoded public key being revoked
  sigilId: string;
  revokedAt: string; // ISO 8601
  reason: string;
  /** Signature by the revoking key */
  proof: string;
}

/** A chain of key rotations for an agent's identity */
export interface KeyChain {
  originalKey: string; // hex-encoded original public key
  currentKey: string; // hex-encoded current public key
  rotations: KeyRotationStatement[];
  revocations: KeyRevocationStatement[];
}

/** Result of an integrity check */
export interface IntegrityCheckResult {
  intact: boolean;
  currentHash: string;
  attestedHash: string;
  modifiedFiles?: string[];
}
