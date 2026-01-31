/**
 * @sigil-protocol/sdk
 *
 * The identity layer for AI agents.
 * Open protocol for agent identity, ownership verification,
 * integrity attestation, and reputation.
 */

export { SigilAgent } from './core/agent.js';
export {
  generateKeypair,
  deriveSigilId,
  publicKeyFromSigilId,
  sign,
  verify,
  signString,
  verifyString,
} from './core/identity.js';
export {
  hashContent,
  computeSoulHash,
  createAttestation,
  verifyAttestation,
} from './core/integrity.js';
export { createDocument, verifyDocument } from './core/document.js';
export {
  createRotation,
  verifyRotation,
  createRevocation,
  verifyRevocation,
  buildKeyChain,
  verifyKeyChain,
  isKeyRevoked,
} from './core/rotation.js';
export type {
  SigilKeypair,
  CreateAgentOptions,
  OwnershipMethod,
  OwnershipClaim,
  IntegrityAttestation,
  DocumentProof,
  AgentDocument,
  ReceiptQuality,
  InteractionReceipt,
  VerificationResult,
  IntegrityCheckResult,
  KeyRotationStatement,
  KeyRevocationStatement,
  KeyChain,
} from './types/index.js';
