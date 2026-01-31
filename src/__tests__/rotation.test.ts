import { describe, it, expect } from 'vitest';
import { generateKeypair } from '../core/identity.js';
import {
  createRotation,
  verifyRotation,
  createRevocation,
  verifyRevocation,
  buildKeyChain,
  verifyKeyChain,
  isKeyRevoked,
} from '../core/rotation.js';
import { SigilAgent } from '../core/agent.js';
import { bytesToHex } from '@noble/hashes/utils.js';

describe('Key Rotation', () => {
  it('creates a valid rotation statement signed by old key', () => {
    const oldKp = generateKeypair();
    const newKp = generateKeypair();
    const rotation = createRotation(oldKp, newKp.publicKey, 'routine');

    expect(rotation.type).toBe('key-rotation');
    expect(rotation.previousKey).toBe(bytesToHex(oldKp.publicKey));
    expect(rotation.newKey).toBe(bytesToHex(newKp.publicKey));
    expect(rotation.reason).toBe('routine');
    expect(rotation.proof).toBeTruthy();
  });

  it('verifies a valid rotation statement', () => {
    const oldKp = generateKeypair();
    const newKp = generateKeypair();
    const rotation = createRotation(oldKp, newKp.publicKey);
    expect(verifyRotation(rotation)).toBe(true);
  });

  it('rejects a tampered rotation statement', () => {
    const oldKp = generateKeypair();
    const newKp = generateKeypair();
    const rotation = createRotation(oldKp, newKp.publicKey);
    rotation.reason = 'compromised'; // tamper
    expect(verifyRotation(rotation)).toBe(false);
  });

  it('verifies a chain of rotations', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const kp3 = generateKeypair();

    const r1 = createRotation(kp1, kp2.publicKey);
    const r2 = createRotation(kp2, kp3.publicKey);

    const chain = buildKeyChain(kp1.publicKey, [r1, r2]);
    const result = verifyKeyChain(chain);

    expect(result.valid).toBe(true);
    expect(result.currentKey).toBe(bytesToHex(kp3.publicKey));
  });

  it('detects a broken chain', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const kp3 = generateKeypair();
    const kpRogue = generateKeypair();

    const r1 = createRotation(kp1, kp2.publicKey);
    // rogue rotation — not signed by kp2
    const rRogue = createRotation(kpRogue, kp3.publicKey);

    const chain = buildKeyChain(kp1.publicKey, [r1, rRogue]);
    const result = verifyKeyChain(chain);

    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it('empty chain is valid', () => {
    const kp = generateKeypair();
    const chain = buildKeyChain(kp.publicKey, []);
    const result = verifyKeyChain(chain);
    expect(result.valid).toBe(true);
    expect(result.currentKey).toBe(bytesToHex(kp.publicKey));
  });
});

describe('Key Revocation', () => {
  it('creates and verifies a revocation', () => {
    const currentKp = generateKeypair();
    const oldKp = generateKeypair();
    const revocation = createRevocation(currentKp, oldKp.publicKey, 'key compromised');

    expect(revocation.type).toBe('key-revocation');
    expect(verifyRevocation(revocation, currentKp.publicKey)).toBe(true);
  });

  it('detects revoked key in chain', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const r1 = createRotation(kp1, kp2.publicKey, 'compromised');
    const rev = createRevocation(kp2, kp1.publicKey, 'original key compromised');

    const chain = buildKeyChain(kp1.publicKey, [r1], [rev]);
    expect(isKeyRevoked(chain, bytesToHex(kp1.publicKey))).toBe(true);
    expect(isKeyRevoked(chain, bytesToHex(kp2.publicKey))).toBe(false);
  });
});

describe('SigilAgent key rotation', () => {
  it('rotates key while preserving identity', () => {
    const agent = SigilAgent.create({ name: 'test-agent' });
    const originalId = agent.id;
    const originalPubKey = bytesToHex(agent.publicKey);

    const { rotation } = agent.rotateKey('routine');

    expect(agent.id).toBe(originalId); // ID unchanged
    expect(bytesToHex(agent.publicKey)).not.toBe(originalPubKey); // key changed
    expect(verifyRotation(rotation)).toBe(true);
  });

  it('builds valid key chain after multiple rotations', () => {
    const agent = SigilAgent.create({ name: 'test-agent' });
    agent.rotateKey('routine');
    agent.rotateKey('routine');
    agent.rotateKey('upgrade');

    const chain = agent.keyChain();
    expect(chain.rotations.length).toBe(3);

    const result = verifyKeyChain(chain);
    expect(result.valid).toBe(true);
    expect(result.currentKey).toBe(bytesToHex(agent.publicKey));
  });

  it('can revoke a previous key', () => {
    const agent = SigilAgent.create({ name: 'test-agent' });
    const oldPubKey = new Uint8Array(agent.publicKey);
    agent.rotateKey('compromised');
    agent.revokeKey(oldPubKey, 'key leaked');

    const chain = agent.keyChain();
    expect(isKeyRevoked(chain, bytesToHex(oldPubKey))).toBe(true);
  });

  it('restores agent from key chain', () => {
    const agent = SigilAgent.create({ name: 'test-agent' });
    const originalPubKey = new Uint8Array(agent.publicKey);
    const { newKeypair } = agent.rotateKey();
    const rotations = agent.keyChain().rotations;

    const restored = SigilAgent.fromKeyChain(
      newKeypair,
      originalPubKey,
      rotations,
      { name: 'test-agent' }
    );

    expect(restored.id).toBe(agent.id);
    const chain = restored.keyChain();
    expect(verifyKeyChain(chain).valid).toBe(true);
  });
});
