/**
 * Sigil Protocol - Key Rotation Module
 *
 * Key rotation with chain-of-custody verification.
 * The old key signs a rotation statement authorizing the new key,
 * creating a verifiable chain from original identity to current key.
 */

import { bytesToHex } from '@noble/hashes/utils.js';
import {
  deriveSigilId,
  signString,
  verifyString,
} from './identity.js';
import type {
  SigilKeypair,
  KeyRotationStatement,
  KeyRevocationStatement,
  KeyChain,
} from '../types/index.js';

/**
 * Create a signed key rotation statement.
 * The OLD key signs the statement to prove authorized handoff.
 */
export function createRotation(
  oldKeypair: SigilKeypair,
  newPublicKey: Uint8Array,
  reason: KeyRotationStatement['reason'] = 'routine'
): KeyRotationStatement {
  const sigilId = deriveSigilId(oldKeypair.publicKey);
  const rotatedAt = new Date().toISOString();

  const body = {
    type: 'key-rotation' as const,
    previousKey: bytesToHex(oldKeypair.publicKey),
    newKey: bytesToHex(newPublicKey),
    sigilId,
    rotatedAt,
    reason,
  };

  const canonical = JSON.stringify(body, Object.keys(body).sort());
  const proof = signString(canonical, oldKeypair.privateKey);

  return { ...body, proof };
}

/**
 * Verify a rotation statement: confirm the old key signed the transition.
 */
export function verifyRotation(rotation: KeyRotationStatement): boolean {
  const { proof, ...body } = rotation;
  const canonical = JSON.stringify(body, Object.keys(body).sort());
  const oldPublicKey = hexToBytes(rotation.previousKey);
  return verifyString(proof, canonical, oldPublicKey);
}

/**
 * Create a signed key revocation statement.
 * Signed by the current active key (or any key in the chain with authority).
 */
export function createRevocation(
  signerKeypair: SigilKeypair,
  revokedPublicKey: Uint8Array,
  reason: string
): KeyRevocationStatement {
  const sigilId = deriveSigilId(signerKeypair.publicKey);
  const revokedAt = new Date().toISOString();

  const body = {
    type: 'key-revocation' as const,
    revokedKey: bytesToHex(revokedPublicKey),
    sigilId,
    revokedAt,
    reason,
  };

  const canonical = JSON.stringify(body, Object.keys(body).sort());
  const proof = signString(canonical, signerKeypair.privateKey);

  return { ...body, proof };
}

/**
 * Verify a revocation statement signature.
 */
export function verifyRevocation(
  revocation: KeyRevocationStatement,
  signerPublicKey: Uint8Array
): boolean {
  const { proof, ...body } = revocation;
  const canonical = JSON.stringify(body, Object.keys(body).sort());
  return verifyString(proof, canonical, signerPublicKey);
}

/**
 * Build a key chain from a sequence of rotation and revocation statements.
 * This function only constructs the chain; use `verifyKeyChain` to validate it.
 */
export function buildKeyChain(
  originalPublicKey: Uint8Array,
  rotations: KeyRotationStatement[],
  revocations: KeyRevocationStatement[] = []
): KeyChain {
  return {
    originalKey: bytesToHex(originalPublicKey),
    currentKey:
      rotations.length > 0
        ? rotations[rotations.length - 1].newKey
        : bytesToHex(originalPublicKey),
    rotations,
    revocations,
  };
}

/**
 * Verify an entire key chain:
 * 1. Each rotation signature is valid (signed by the previous key)
 * 2. Each rotation's newKey matches the next rotation's previousKey
 * 3. The chain starts from the original key
 * Returns { valid, currentKey, brokenAt? }
 */
export function verifyKeyChain(chain: KeyChain): {
  valid: boolean;
  currentKey: string;
  brokenAt?: number;
} {
  let expectedPreviousKey = chain.originalKey;

  for (let i = 0; i < chain.rotations.length; i++) {
    const rotation = chain.rotations[i];

    // Check chain continuity
    if (rotation.previousKey !== expectedPreviousKey) {
      return { valid: false, currentKey: expectedPreviousKey, brokenAt: i };
    }

    // Check signature
    if (!verifyRotation(rotation)) {
      return { valid: false, currentKey: expectedPreviousKey, brokenAt: i };
    }

    expectedPreviousKey = rotation.newKey;
  }

  return { valid: true, currentKey: expectedPreviousKey };
}

/**
 * Check if a specific key has been revoked in the chain.
 *
 * Security note:
 * This helper only treats a revocation as effective if the corresponding
 * {@link KeyRevocationStatement} has been *pre-validated* by the caller
 * (e.g. its signature has been checked against the appropriate key) and
 * explicitly marked as such via a `validated: true` flag.
 *
 * If a `KeyChain` is built from untrusted input, callers MUST NOT rely on
 * this function unless they have first verified the revocation proofs and
 * marked trusted entries with `validated: true`. Otherwise, forged
 * revocation entries could cause keys to appear revoked without proof.
 */
export function isKeyRevoked(chain: KeyChain, publicKeyHex: string): boolean {
  return chain.revocations.some(
    (r) =>
      r.revokedKey === publicKeyHex &&
      // Only consider revocations that have been explicitly marked as validated.
      (r as any).validated === true
  );
}

/** Helper: hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
