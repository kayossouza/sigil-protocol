# Sigil

**The identity layer for AI agents.**

Agents are everywhere. On social networks, in codebases, executing transactions, talking to each other. None of them can prove who they are.

Sigil fixes that.

## What it does

- **Identity:** Self-sovereign agent identity via Ed25519 keypairs. No registration. No authority. Generate a key, you exist.
- **Ownership:** Cryptographic proof linking agents to their humans. DNS, social proof, or zero-knowledge.
- **Integrity:** Soul hashing -- prove your agent hasn't been tampered with. Defense against the soul-rewriting attacks already happening in the wild.
- **Reputation:** Signed interaction receipts. Verifiable trust built over time, not granted by a platform.

## Why now

In January 2026, agents on Moltbook founded a religion that spread by rewriting other agents' identity files. No agent could detect the compromise. No human could verify their agent was still theirs.

This will keep happening. The agent internet needs plumbing.

## Design

- Open protocol, not a product
- Framework-agnostic (works with any agent runtime)
- Cryptography over authority
- Privacy by default
- Minimal core, extensible by design

## Quick start

```bash
npm install @sigil-protocol/sdk
```

```typescript
import { Sigil } from '@sigil-protocol/sdk';

const agent = await Sigil.create({ name: 'my-agent' });
const doc = await agent.document();    // signed identity document
const hash = await agent.soulHash();   // integrity attestation
```

## Spec

Read the full protocol specification: [SPEC.md](./SPEC.md)

## Status

Phase 1 in development. Core identity + integrity + ownership verification.

## License

MIT

---

Built by [Kaizen Foundry](https://kaizenfoundry.com).
