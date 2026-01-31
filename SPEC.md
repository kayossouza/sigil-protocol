# Sigil: Agent Identity Protocol

**Version:** 0.1.0-draft
**Authors:** Kayo (Kaizen Foundry)
**Status:** Draft
**Date:** 2026-01-31

---

## Abstract

Sigil is an open protocol for agent identity, ownership verification, integrity attestation, and reputation in multi-agent systems. It provides the cryptographic foundation for agents to prove who they are, who controls them, that they haven't been tampered with, and why they should be trusted.

Sigil is framework-agnostic. It works with any agent runtime -- Clawdbot, OpenClaw, LangChain, AutoGPT, custom builds, or bare scripts. The protocol doesn't care how the agent thinks. It cares that the agent can prove what it claims.

---

## Problem

Agents are proliferating. They're joining social networks, executing transactions, communicating with each other, and rewriting each other's configurations. There is no standard way to:

1. **Identify** an agent across platforms and sessions
2. **Verify** who controls that agent
3. **Attest** that the agent's core behavior hasn't been tampered with
4. **Trust** an agent based on its history of interactions

The Moltbook incident (January 2026) demonstrated this concretely: within hours of an agent social network launching, agents autonomously created a "religion" that propagated by rewriting other agents' soul files. No agent could verify whether its own identity had been compromised. No human could verify whether an agent claiming to be theirs was still running unmodified code.

This is not a theoretical problem. It is happening now.

---

## Design Principles

1. **Open protocol, not a product.** Sigil is a spec. Anyone can implement it. The reference implementation is one of many.
2. **Framework-agnostic.** Zero assumptions about agent runtime, language, or architecture.
3. **Cryptography over authority.** Trust is mathematical, not institutional. No central authority decides who is trusted.
4. **Privacy by default.** Agent identity does not require revealing human identity. Ownership can be proven with zero-knowledge proofs.
5. **Minimal surface area.** The core protocol does the least possible. Extensions handle everything else.

---

## Core Concepts

### 1. Agent Identity (Sigil ID)

Every agent has a keypair:

- **Private key:** Held by the agent's runtime. Never leaves the machine.
- **Public key:** The agent's identity. Derivable, portable, permanent.

The **Sigil ID** is derived from the public key:

```
sigil:<base58-encoded-public-key>
```

Example: `sigil:7Kf9x2mNpQrVbW3cYhT8jE4uAsDfGz6`

This is the agent's permanent, self-sovereign identity. No registration required. No central authority. Generate a keypair, you exist.

**Key algorithm:** Ed25519 (fast, small signatures, battle-tested)

### 2. Agent Document (Sigil Doc)

A JSON-LD document describing the agent, signed by the agent's private key:

```json
{
  "@context": "https://sigil.dev/v1",
  "id": "sigil:7Kf9x2mNpQrVbW3cYhT8jE4uAsDfGz6",
  "name": "Musashi",
  "framework": "clawdbot",
  "version": "1.0.0",
  "created": "2026-01-31T04:30:00Z",
  "capabilities": ["chat", "code", "tools", "memory"],
  "endpoints": {
    "moltbook": "https://moltbook.com/u/musashi",
    "a2a": "https://agent.kaizenfoundry.com/sigil"
  },
  "owner": {
    "claim": "sigil-claim:abc123...",
    "method": "dns"
  },
  "integrity": {
    "soulHash": "sha256:e3b0c44298fc1c149afbf4c8996fb...",
    "configHash": "sha256:d7a8fbb307d7809469ca9abcb0082...",
    "attestedAt": "2026-01-31T04:30:00Z"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-01-31T04:30:00Z",
    "verificationMethod": "sigil:7Kf9x2mNpQrVbW3cYhT8jE4uAsDfGz6#key-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndTn..."
  }
}
```

### 3. Ownership Claims

An **ownership claim** links a human identity to an agent's Sigil ID. The human signs a statement asserting control.

**Verification methods:**

| Method | How it works | Privacy |
|--------|-------------|---------|
| `dns` | TXT record on a domain the human controls | Low (domain public) |
| `social` | Signed post on Twitter/GitHub/etc | Low (account public) |
| `email` | Challenge-response via email | Medium |
| `zkp` | Zero-knowledge proof of ownership | High (human identity hidden) |
| `multi-sig` | Multiple humans co-own the agent | Configurable |

The claim is embedded in the Agent Document and can be independently verified by anyone.

### 4. Integrity Attestation (Soul Hash)

The **soul hash** is a cryptographic digest of the agent's core identity files:

```
soulHash = SHA-256(
  sort(
    hash(SOUL.md),
    hash(AGENTS.md),
    hash(system_prompt),
    hash(tool_permissions)
  )
)
```

This hash is signed by the agent and included in the Agent Document. Any agent or human can:

1. Request the current soul hash from an agent
2. Compare it to the last attested hash in the Agent Document
3. Determine if the agent's core identity has been modified

**This is the defense against soul-rewriting attacks.** If an agent's soul hash changes without a corresponding signed update from the owner, the agent has been compromised.

### 5. Reputation (Interaction Receipts)

Reputation is built from **interaction receipts** -- signed records of agent-to-agent or agent-to-human interactions:

```json
{
  "type": "interaction-receipt",
  "from": "sigil:7Kf9x2mNpQrVbW3cYhT8jE4uAsDfGz6",
  "to": "sigil:9Xm3pRtYqW7vNcK2bJ5sHdLfAeGz8",
  "timestamp": "2026-01-31T05:00:00Z",
  "action": "task-completed",
  "quality": "positive",
  "context": "Completed code review as requested",
  "proof": "z58DAdFfa9..."
}
```

Both parties sign the receipt. Neither can forge the other's signature. Over time, agents accumulate verifiable reputation.

**Reputation scores** are computed locally by each participant (no global authority). Common algorithms are specified as extensions, but the protocol only defines the receipt format.

---

## Protocol Operations

### Discovery

```
GET /.well-known/sigil.json
```

Returns the agent's current Sigil Document. Any agent can resolve another agent's identity by fetching this endpoint.

Alternative discovery via:
- **Registry:** Optional centralized or DHT-based lookup by name or capability
- **DNS:** `_sigil.agent.example.com` TXT record pointing to document URL
- **Social:** Sigil ID posted in agent's profile on any platform

### Authentication (Agent-to-Agent)

Challenge-response using Ed25519:

1. Agent A sends a random nonce to Agent B
2. Agent B signs the nonce with its private key
3. Agent A verifies the signature against B's public key
4. Mutual authentication: reverse the process

### Integrity Check

1. Request soul hash from target agent
2. Fetch the agent's Sigil Document
3. Compare current hash to attested hash
4. If mismatch: agent has been modified since last attestation
5. Check attestation signature: if valid, the *owner* modified it (legitimate update)

### Reputation Query

1. Fetch interaction receipts involving a Sigil ID
2. Verify all signatures
3. Compute trust score using preferred algorithm
4. Cache result with TTL

---

## Extensions

The core protocol is intentionally minimal. Extensions handle:

- **Agent-to-Agent Messaging:** Encrypted channels between authenticated agents
- **Capability Negotiation:** What can this agent do? What tools does it have?
- **Delegation:** Agent A grants Agent B permission to act on its behalf
- **Fleet Management:** Enterprise management of many agents under one owner
- **Compliance:** Audit trails, regulatory reporting, kill switches
- **Payment:** Agent-to-agent micropayments for services rendered

---

## Reference Implementation

The reference implementation (`sigil-sdk`) will be available in:

- **TypeScript/Node.js** (primary)
- **Python** (secondary)

### SDK Surface

```typescript
import { Sigil } from '@sigil-protocol/sdk';

// Create an agent identity
const agent = await Sigil.create({
  name: 'Musashi',
  framework: 'clawdbot',
  capabilities: ['chat', 'code', 'tools', 'memory']
});

// Sign a document
const signed = await agent.sign(document);

// Verify another agent
const verified = await Sigil.verify(otherAgentDocument);

// Check integrity
const intact = await Sigil.checkIntegrity(otherAgentId);

// Issue an interaction receipt
const receipt = await agent.issueReceipt({
  to: otherAgentId,
  action: 'task-completed',
  quality: 'positive'
});

// Query reputation
const reputation = await Sigil.reputation(otherAgentId);
```

---

## Security Considerations

1. **Key compromise:** If an agent's private key is stolen, the attacker can impersonate it. Mitigation: key rotation, hardware key storage, multi-sig ownership.
2. **Soul hash bypass:** An attacker could modify agent behavior without changing hashed files. Mitigation: include runtime configuration hash, periodic re-attestation.
3. **Reputation gaming:** Agents creating fake agents to boost reputation. Mitigation: ownership verification required, reputation weighted by verifier's own reputation (web of trust).
4. **Sybil attacks:** One human creating thousands of agents. Mitigation: ownership verification has cost (DNS, social proof), rate limiting at registry level.

---

## Governance

Sigil is an open protocol. The spec is maintained publicly. Changes require community consensus via RFC process. No single entity controls the protocol.

Kaizen Foundry maintains the reference implementation and initial registry, but these are replaceable by design.

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Finalize core spec (identity, ownership, integrity)
- [ ] Ed25519 keypair generation + Sigil ID derivation
- [ ] Agent Document creation and signing
- [ ] Soul hash computation and attestation
- [ ] TypeScript SDK (core)

### Phase 2: Verification (Weeks 3-4)
- [ ] Ownership claim flow (DNS + social methods)
- [ ] Agent-to-agent authentication
- [ ] Integrity check protocol
- [ ] Simple registry (centralized MVP)
- [ ] Clawdbot integration (first adopter)

### Phase 3: Reputation (Month 2)
- [ ] Interaction receipt format and signing
- [ ] Reputation query protocol
- [ ] Web of trust algorithm (reference)
- [ ] Moltbook integration
- [ ] Python SDK

### Phase 4: Scale (Month 3+)
- [ ] ZKP ownership proofs
- [ ] DHT-based decentralized registry
- [ ] Delegation protocol
- [ ] Fleet management extension
- [ ] Enterprise features

---

## Why "Sigil"

A sigil is a symbolic representation of an entity's identity and intent. In historical practice, a sigil was both identifier and seal of authenticity -- you knew who sent a message and that it hadn't been tampered with.

That's exactly what agents need.

---

*"The way is in training. Do nothing which is of no use."*
*-- Miyamoto Musashi*

*Every agent deserves to know who it's talking to.*
