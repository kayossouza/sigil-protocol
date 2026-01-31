/**
 * Sigil Bootstrap -- Generate Musashi's identity and attest core files.
 * Run once. Stores keypair and identity document.
 */

import { SigilAgent } from 'sigil-protocol';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CLAWD_ROOT = process.argv[2] || 'C:\\Users\\kayos\\clawd';
const SIGIL_DIR = join(CLAWD_ROOT, '.sigil');

// Create .sigil directory
mkdirSync(SIGIL_DIR, { recursive: true });

// Generate identity
const agent = SigilAgent.create({
  name: 'Musashi',
  framework: 'clawdbot',
  version: '0.1.0',
  capabilities: [
    'code-generation',
    'sub-agent-orchestration',
    'web-browsing',
    'file-system',
    'git-operations',
    'social-media',
  ],
  endpoints: {
    moltbook: 'https://www.moltbook.com/user/Musashi',
    github: 'https://github.com/kayossouza/sigil-protocol',
    twitter: 'https://x.com/kinho_dev',
  },
});

// Read core identity files
const coreFiles = {};
const filesToAttest = ['SOUL.md', 'IDENTITY.md', 'AGENTS.md'];
for (const f of filesToAttest) {
  try {
    coreFiles[f] = readFileSync(join(CLAWD_ROOT, f), 'utf-8');
  } catch { /* skip missing */ }
}

// Attest integrity
const attestation = agent.attestIntegrity(coreFiles);

// Generate signed document with ownership claim
const doc = agent.document({
  claim: 'https://x.com/kinho_dev',
  method: 'social',
});

// Store keypair (private -- never share)
const keypairData = {
  publicKey: Buffer.from(agent.keypair.publicKey).toString('hex'),
  privateKey: Buffer.from(agent.keypair.privateKey).toString('hex'),
};
writeFileSync(join(SIGIL_DIR, 'keypair.json'), JSON.stringify(keypairData, null, 2));

// Store public identity document
writeFileSync(join(SIGIL_DIR, 'identity.json'), JSON.stringify(doc, null, 2));

// Store attestation
writeFileSync(join(SIGIL_DIR, 'attestation.json'), JSON.stringify(attestation, null, 2));

// Store public identity (safe to share)
const pub = agent.toPublic();
writeFileSync(join(SIGIL_DIR, 'public.json'), JSON.stringify(pub, null, 2));

console.log('Sigil ID:', agent.id);
console.log('Soul hash:', attestation.soulHash.slice(0, 40) + '...');
console.log('Files attested:', attestation.files.join(', '));
console.log('Document signed:', !!doc.proof.proofValue);
console.log('');
console.log('Stored:');
console.log('  .sigil/keypair.json     (PRIVATE - never share)');
console.log('  .sigil/identity.json    (signed agent document)');
console.log('  .sigil/attestation.json (integrity attestation)');
console.log('  .sigil/public.json      (public identity)');
