import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  deriveSigilId,
  publicKeyFromSigilId,
  sign,
  verify,
  signString,
  verifyString,
} from '../core/identity.js';

describe('Identity', () => {
  it('generates a valid Ed25519 keypair', () => {
    const kp = generateKeypair();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.privateKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.privateKey.length).toBe(32);
  });

  it('derives a Sigil ID from public key', () => {
    const kp = generateKeypair();
    const id = deriveSigilId(kp.publicKey);
    expect(id).toMatch(/^sigil:/);
    expect(id.length).toBeGreaterThan(10);
  });

  it('round-trips Sigil ID to public key', () => {
    const kp = generateKeypair();
    const id = deriveSigilId(kp.publicKey);
    const recovered = publicKeyFromSigilId(id);
    expect(recovered).toEqual(kp.publicKey);
  });

  it('rejects invalid Sigil ID prefix', () => {
    expect(() => publicKeyFromSigilId('invalid:abc')).toThrow('must start with "sigil:"');
  });

  it('signs and verifies raw bytes', () => {
    const kp = generateKeypair();
    const msg = new TextEncoder().encode('hello agents');
    const sig = sign(msg, kp.privateKey);
    expect(verify(sig, msg, kp.publicKey)).toBe(true);
  });

  it('rejects tampered message', () => {
    const kp = generateKeypair();
    const msg = new TextEncoder().encode('hello agents');
    const sig = sign(msg, kp.privateKey);
    const tampered = new TextEncoder().encode('hello impostor');
    expect(verify(sig, tampered, kp.publicKey)).toBe(false);
  });

  it('rejects wrong public key', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const msg = new TextEncoder().encode('hello');
    const sig = sign(msg, kp1.privateKey);
    expect(verify(sig, msg, kp2.publicKey)).toBe(false);
  });

  it('signs and verifies strings with base58 encoding', () => {
    const kp = generateKeypair();
    const msg = 'The way is in training';
    const sig = signString(msg, kp.privateKey);
    expect(typeof sig).toBe('string');
    expect(verifyString(sig, msg, kp.publicKey)).toBe(true);
  });

  it('two different keypairs produce different Sigil IDs', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    expect(deriveSigilId(kp1.publicKey)).not.toBe(deriveSigilId(kp2.publicKey));
  });
});
