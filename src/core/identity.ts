/**
 * Sigil Protocol - Identity Module
 *
 * Ed25519 keypair generation, Sigil ID derivation, signing, and verification.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import bs58 from 'bs58';
import type { SigilKeypair } from '../types/index.js';

// noble/ed25519 v3 requires sha512 hash to be configured
(ed.hashes as any).sha512 = (...msgs: Uint8Array[]) => {
  const h = sha512.create();
  msgs.forEach((m) => h.update(m));
  return h.digest();
};

const SIGIL_PREFIX = 'sigil:';

/** Generate a new Ed25519 keypair */
export function generateKeypair(): SigilKeypair {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = ed.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/** Derive a Sigil ID from a public key */
export function deriveSigilId(publicKey: Uint8Array): string {
  return SIGIL_PREFIX + bs58.encode(publicKey);
}

/** Extract public key bytes from a Sigil ID */
export function publicKeyFromSigilId(sigilId: string): Uint8Array {
  if (!sigilId.startsWith(SIGIL_PREFIX)) {
    throw new Error(`Invalid Sigil ID: must start with "${SIGIL_PREFIX}"`);
  }
  return bs58.decode(sigilId.slice(SIGIL_PREFIX.length));
}

/** Sign arbitrary bytes with a private key */
export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed.sign(message, privateKey);
}

/** Verify a signature against a public key */
export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return ed.verify(signature, message, publicKey);
}

/** Sign a UTF-8 string, return base58-encoded signature */
export function signString(message: string, privateKey: Uint8Array): string {
  const bytes = new TextEncoder().encode(message);
  const sig = sign(bytes, privateKey);
  return bs58.encode(sig);
}

/** Verify a base58-encoded signature against a UTF-8 string */
export function verifyString(
  signature: string,
  message: string,
  publicKey: Uint8Array
): boolean {
  const sigBytes = bs58.decode(signature);
  const msgBytes = new TextEncoder().encode(message);
  return verify(sigBytes, msgBytes, publicKey);
}
