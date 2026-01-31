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

/** Result of an integrity check */
export interface IntegrityCheckResult {
  intact: boolean;
  currentHash: string;
  attestedHash: string;
  modifiedFiles?: string[];
}
