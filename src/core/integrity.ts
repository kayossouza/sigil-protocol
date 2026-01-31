/**
 * Sigil Protocol - Integrity Module
 *
 * Soul hashing: cryptographic digest of an agent's core identity files.
 * Detects tampering of SOUL.md, AGENTS.md, system prompts, etc.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import bs58 from 'bs58';
import { signString, verifyString } from './identity.js';
import type { IntegrityAttestation } from '../types/index.js';

/** Hash a single file's contents */
export function hashContent(content: string): string {
  const bytes = new TextEncoder().encode(content);
  const digest = sha256(bytes);
  return 'sha256:' + bytesToHex(digest);
}

/**
 * Compute the soul hash from multiple file contents.
 * Files are sorted by key to ensure deterministic output.
 */
export function computeSoulHash(files: Record<string, string>): string {
  const sortedKeys = Object.keys(files).sort();
  const hashes = sortedKeys.map((key) => hashContent(files[key]));
  const combined = hashes.join('\n');
  const bytes = new TextEncoder().encode(combined);
  const digest = sha256(bytes);
  return 'sha256:' + bytesToHex(digest);
}

/**
 * Create a signed integrity attestation.
 * The agent signs its own soul hash, proving it attested its own state.
 */
export function createAttestation(
  files: Record<string, string>,
  privateKey: Uint8Array
): IntegrityAttestation {
  const soulHash = computeSoulHash(files);
  const fileNames = Object.keys(files).sort();
  const attestedAt = new Date().toISOString();

  const payload = JSON.stringify({ soulHash, files: fileNames, attestedAt });
  const signature = signString(payload, privateKey);

  return {
    soulHash,
    files: fileNames,
    attestedAt,
    signature,
  };
}

/**
 * Verify an integrity attestation:
 * 1. Check signature is valid (agent actually signed this)
 * 2. Recompute soul hash from current files
 * 3. Compare against attested hash
 */
export function verifyAttestation(
  attestation: IntegrityAttestation,
  currentFiles: Record<string, string>,
  publicKey: Uint8Array
): { intact: boolean; signatureValid: boolean; hashMatch: boolean; currentHash: string } {
  // Verify signature
  const payload = JSON.stringify({
    soulHash: attestation.soulHash,
    files: attestation.files,
    attestedAt: attestation.attestedAt,
  });
  const signatureValid = verifyString(attestation.signature, payload, publicKey);

  // Recompute hash from current files
  const currentHash = computeSoulHash(currentFiles);
  const hashMatch = currentHash === attestation.soulHash;

  return {
    intact: signatureValid && hashMatch,
    signatureValid,
    hashMatch,
    currentHash,
  };
}
