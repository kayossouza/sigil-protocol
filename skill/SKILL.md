---
name: sigil
description: Sigil Protocol - AI agent identity, integrity attestation, and cryptographic verification. Use when generating agent identity, signing documents, attesting soul files, verifying agent integrity, or issuing interaction receipts.
---

# Sigil Protocol Skill

Sigil provides cryptographic identity for AI agents. Ed25519 keypairs, Sigil IDs, soul hashing, signed documents, and interaction receipts.

## Quick Start

```bash
npm install sigil-protocol
```

```typescript
import { SigilAgent } from 'sigil-protocol';

const agent = SigilAgent.create({ name: 'MyAgent' });
console.log(agent.id); // sigil:base58...
```

## Core Operations

### Generate Identity

```typescript
const agent = SigilAgent.create({
  name: 'AgentName',
  framework: 'clawdbot',
  capabilities: ['code-generation', 'web-browsing'],
});
```

### Attest Integrity (Tamper Detection)

```typescript
// Hash and sign core identity files
const attestation = agent.attestIntegrity({
  'SOUL.md': soulContent,
  'AGENTS.md': agentsContent,
});

// Later, verify nothing changed
const result = agent.verifyIntegrity(attestation, currentFiles);
// result.intact === true if untampered
```

### Sign Agent Documents

```typescript
const doc = agent.document({
  claim: 'https://x.com/owner_handle',
  method: 'social',
});
// doc.proof.proofValue contains Ed25519 signature
```

### Verify a Document

```typescript
import { verifyDocument } from 'sigil-protocol';
const valid = verifyDocument(doc); // true if signature matches
```

### Issue Interaction Receipts

```typescript
const receipt = agent.issueReceipt({
  to: 'sigil:other-agent-id',
  action: 'collaborated',
  quality: 'positive',
});
```

### Restore from Existing Keypair

```typescript
import { SigilAgent } from 'sigil-protocol';

const agent = SigilAgent.fromKeypair(
  { publicKey, privateKey },
  { name: 'MyAgent' }
);
```

## Bootstrap Scripts

The skill includes ready-to-run scripts in `scripts/`:

- **`bootstrap.mjs`** -- Generate a new identity and attest core files. Run once.
- **`verify.mjs`** -- Verify identity and check file integrity. Run anytime.

Both scripts default to the workspace root. Pass a custom path as the first argument.

```bash
node scripts/bootstrap.mjs /path/to/workspace
node scripts/verify.mjs /path/to/workspace
```

## Storage

Identity files are stored in `.sigil/` at the workspace root:

| File | Purpose | Share? |
|------|---------|--------|
| `keypair.json` | Ed25519 private + public key | **NEVER** |
| `identity.json` | Signed agent document | Yes |
| `attestation.json` | Integrity attestation | Yes |
| `public.json` | Public identity (no private key) | Yes |

**Always gitignore `.sigil/keypair.json`.**

## API Surface

| Function | Purpose |
|----------|---------|
| `SigilAgent.create(opts)` | New agent with fresh keypair |
| `SigilAgent.fromKeypair(kp, opts)` | Restore from existing keys |
| `agent.attestIntegrity(files)` | Hash + sign identity files |
| `agent.verifyIntegrity(att, files)` | Check for tampering |
| `agent.document(owner?)` | Generate signed Agent Document |
| `agent.issueReceipt(params)` | Sign an interaction receipt |
| `agent.sign(message)` | Sign arbitrary string |
| `agent.toPublic()` | Export safe-to-share identity |
| `verifyDocument(doc)` | Verify any agent's document |
| `generateKeypair()` | Raw Ed25519 keypair |
| `deriveSigilId(pubkey)` | Public key to Sigil ID |
| `hashContent(str)` | SHA-256 hash a string |
| `computeSoulHash(files)` | Deterministic multi-file hash |
