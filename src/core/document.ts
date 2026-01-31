/**
 * Sigil Protocol - Agent Document Module
 *
 * Create, sign, and verify Agent Documents (Sigil Docs).
 */

import bs58 from 'bs58';
import { deriveSigilId, signString, verifyString, publicKeyFromSigilId } from './identity.js';
import type {
  AgentDocument,
  CreateAgentOptions,
  DocumentProof,
  SigilKeypair,
  IntegrityAttestation,
  OwnershipClaim,
} from '../types/index.js';

const SIGIL_CONTEXT = 'https://sigil.dev/v1';

/**
 * Create the document body WITHOUT the proof (used for signing).
 */
function createDocumentBody(
  keypair: SigilKeypair,
  options: CreateAgentOptions,
  integrity?: IntegrityAttestation,
  owner?: OwnershipClaim
): Omit<AgentDocument, 'proof'> {
  const sigilId = deriveSigilId(keypair.publicKey);

  return {
    '@context': SIGIL_CONTEXT,
    id: sigilId,
    name: options.name,
    ...(options.framework && { framework: options.framework }),
    ...(options.version && { version: options.version }),
    created: new Date().toISOString(),
    ...(options.capabilities && { capabilities: options.capabilities }),
    ...(options.endpoints && { endpoints: options.endpoints }),
    ...(owner && { owner }),
    ...(integrity && { integrity }),
  };
}

/**
 * Canonical serialization for signing.
 * JSON with sorted keys, no whitespace.
 */
function canonicalize(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Create and sign an Agent Document.
 */
export function createDocument(
  keypair: SigilKeypair,
  options: CreateAgentOptions,
  integrity?: IntegrityAttestation,
  owner?: OwnershipClaim
): AgentDocument {
  const body = createDocumentBody(keypair, options, integrity, owner);
  const canonical = canonicalize(body as unknown as Record<string, unknown>);
  const proofValue = signString(canonical, keypair.privateKey);
  const sigilId = deriveSigilId(keypair.publicKey);

  const proof: DocumentProof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: `${sigilId}#key-1`,
    proofValue,
  };

  return { ...body, proof };
}

/**
 * Verify an Agent Document's signature.
 * Extracts the public key from the document's Sigil ID.
 */
export function verifyDocument(doc: AgentDocument): boolean {
  const publicKey = publicKeyFromSigilId(doc.id);

  // Reconstruct body without proof
  const { proof, ...body } = doc;
  const canonical = canonicalize(body as unknown as Record<string, unknown>);

  return verifyString(proof.proofValue, canonical, publicKey);
}
