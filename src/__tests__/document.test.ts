import { describe, it, expect } from 'vitest';
import { generateKeypair, deriveSigilId } from '../core/identity.js';
import { createDocument, verifyDocument } from '../core/document.js';

describe('Agent Document', () => {
  it('creates a signed agent document', () => {
    const kp = generateKeypair();
    const doc = createDocument(kp, { name: 'Musashi', framework: 'clawdbot' });

    expect(doc['@context']).toBe('https://sigil.dev/v1');
    expect(doc.id).toBe(deriveSigilId(kp.publicKey));
    expect(doc.name).toBe('Musashi');
    expect(doc.framework).toBe('clawdbot');
    expect(doc.proof.type).toBe('Ed25519Signature2020');
    expect(doc.proof.proofValue).toBeTruthy();
  });

  it('verifies a valid document', () => {
    const kp = generateKeypair();
    const doc = createDocument(kp, {
      name: 'TestAgent',
      capabilities: ['chat', 'code'],
    });

    expect(verifyDocument(doc)).toBe(true);
  });

  it('rejects a tampered document (name changed)', () => {
    const kp = generateKeypair();
    const doc = createDocument(kp, { name: 'Original' });

    // Tamper
    doc.name = 'Impostor';

    expect(verifyDocument(doc)).toBe(false);
  });

  it('rejects a tampered document (capabilities added)', () => {
    const kp = generateKeypair();
    const doc = createDocument(kp, { name: 'Agent', capabilities: ['chat'] });

    // Tamper
    doc.capabilities = ['chat', 'admin', 'root'];

    expect(verifyDocument(doc)).toBe(false);
  });

  it('rejects document signed by different agent', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();

    const doc = createDocument(kp1, { name: 'Agent1' });

    // Replace the ID with kp2's ID (impersonation attempt)
    doc.id = deriveSigilId(kp2.publicKey);

    expect(verifyDocument(doc)).toBe(false);
  });

  it('includes integrity attestation when provided', () => {
    const kp = generateKeypair();
    const attestation = {
      soulHash: 'sha256:abc123',
      files: ['SOUL.md'],
      attestedAt: new Date().toISOString(),
      signature: 'test-sig',
    };

    const doc = createDocument(kp, { name: 'Agent' }, attestation);
    expect(doc.integrity).toBeDefined();
    expect(doc.integrity!.soulHash).toBe('sha256:abc123');
  });

  it('includes ownership claim when provided', () => {
    const kp = generateKeypair();
    const owner = {
      claim: 'sigil-claim:xyz',
      method: 'dns' as const,
    };

    const doc = createDocument(kp, { name: 'Agent' }, undefined, owner);
    expect(doc.owner).toBeDefined();
    expect(doc.owner!.method).toBe('dns');
  });
});
