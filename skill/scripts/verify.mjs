/**
 * Sigil Verify -- Check Musashi's identity and integrity.
 * Run anytime to verify soul files haven't been tampered with.
 */

import { SigilAgent, verifyDocument, verifyAttestation, publicKeyFromSigilId } from 'sigil-protocol';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CLAWD_ROOT = process.argv[2] || 'C:\\Users\\kayos\\clawd';
const SIGIL_DIR = join(CLAWD_ROOT, '.sigil');

// Load stored identity
const doc = JSON.parse(readFileSync(join(SIGIL_DIR, 'identity.json'), 'utf-8'));
const attestation = JSON.parse(readFileSync(join(SIGIL_DIR, 'attestation.json'), 'utf-8'));
const publicKey = publicKeyFromSigilId(doc.id);

console.log('Agent:', doc.name);
console.log('Sigil ID:', doc.id);
console.log('');

// Verify document signature
const docValid = verifyDocument(doc);
console.log('Document signature:', docValid ? 'VALID' : 'INVALID');

// Read current files and verify integrity
const currentFiles = {};
for (const f of attestation.files) {
  try {
    currentFiles[f] = readFileSync(join(CLAWD_ROOT, f), 'utf-8');
  } catch {
    console.log(`WARNING: ${f} missing`);
  }
}

const integrity = verifyAttestation(attestation, currentFiles, publicKey);
console.log('Attestation signature:', integrity.signatureValid ? 'VALID' : 'INVALID');
console.log('Files intact:', integrity.hashMatch ? 'YES' : 'TAMPERED');
console.log('');

if (!integrity.hashMatch) {
  console.log('Soul hash mismatch!');
  console.log('  Attested:', attestation.soulHash.slice(0, 40) + '...');
  console.log('  Current: ', integrity.currentHash.slice(0, 40) + '...');
}

console.log(integrity.intact ? 'Identity VERIFIED' : 'Identity COMPROMISED');
