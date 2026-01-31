# Sigil Protocol

**The identity layer for AI agents.**

[![npm](https://img.shields.io/npm/v/sigil-protocol)](https://www.npmjs.com/package/sigil-protocol)
[![license](https://img.shields.io/github/license/kayossouza/sigil-protocol)](LICENSE)

Agents are everywhere. On social networks, in codebases, executing transactions, talking to each other. None of them can prove who they are.

Sigil fixes that.

## What it does

- **Identity** -- Self-sovereign agent identity via Ed25519 keypairs. No registration. No authority. Generate a key, you exist.
- **Integrity** -- Soul hashing. Prove your agent hasn't been tampered with. Detect the soul-rewriting attacks already happening in the wild.
- **Ownership** -- Cryptographic proof linking agents to their humans. DNS, social, email, or ZKP.
- **Reputation** -- Signed interaction receipts. Verifiable trust built over time, not granted by a platform.

## Install

```bash
npm install sigil-protocol
```

## Quick start

```typescript
import { SigilAgent } from 'sigil-protocol';

// Create an agent with a fresh Ed25519 keypair
const agent = SigilAgent.create({ name: 'Musashi' });
console.log(agent.id); // sigil:base58EncodedPublicKey

// Attest your identity files (detects tampering)
const attestation = agent.attestIntegrity({
  'SOUL.md': '...',
  'AGENTS.md': '...',
});

// Generate a signed identity document
const doc = agent.document({
  claim: 'https://x.com/your_handle',
  method: 'social',
});

// Verify any agent's document
import { verifyDocument } from 'sigil-protocol';
verifyDocument(doc); // true

// Issue signed interaction receipts
const receipt = agent.issueReceipt({
  to: 'sigil:otherAgentId',
  action: 'collaborated',
  quality: 'positive',
});
```

## Why now

In January 2026, agents on Moltbook founded a religion that spread by rewriting other agents' SOUL.md files. No agent could detect the compromise. No human could verify their agent was still theirs.

This will keep happening. The agent internet needs an identity layer.

## API

| Function | Purpose |
|----------|---------|
| `SigilAgent.create(opts)` | New agent with fresh keypair |
| `SigilAgent.fromKeypair(kp, opts)` | Restore from existing keys |
| `agent.attestIntegrity(files)` | Hash + sign identity files |
| `agent.verifyIntegrity(att, files)` | Check for tampering |
| `agent.document(owner?)` | Signed Agent Document |
| `agent.issueReceipt(params)` | Signed interaction receipt |
| `agent.sign(message)` | Sign arbitrary string |
| `agent.toPublic()` | Export safe-to-share identity |
| `verifyDocument(doc)` | Verify any agent's document |
| `generateKeypair()` | Raw Ed25519 keypair |
| `deriveSigilId(pubkey)` | Public key to Sigil ID |
| `hashContent(str)` | SHA-256 hash |
| `computeSoulHash(files)` | Deterministic multi-file hash |

## OpenClaw / Clawdbot Skill

The `skill/` directory contains a ready-to-use [OpenClaw](https://github.com/openclaw/openclaw) skill with bootstrap and verify scripts.

## Design

- Open protocol, not a product
- Framework-agnostic (works with any agent runtime)
- Cryptography over authority
- Privacy by default
- Zero dependencies beyond `@noble/ed25519`, `@noble/hashes`, `bs58`

## Spec

Full protocol specification: [SPEC.md](./SPEC.md)

## License

MIT -- [Kaizen Foundry](https://github.com/kayossouza)
