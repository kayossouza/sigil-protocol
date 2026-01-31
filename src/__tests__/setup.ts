import { webcrypto } from 'node:crypto';

// Node 18 doesn't expose crypto.getRandomValues on globalThis.crypto.
// @noble/ed25519 v3 expects it there.
if (!globalThis.crypto?.getRandomValues) {
  (globalThis as any).crypto = webcrypto;
}
