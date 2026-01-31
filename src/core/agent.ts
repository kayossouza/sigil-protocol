/**
 * Sigil Protocol - Agent Class
 *
 * The main interface. An agent with identity, document signing,
 * integrity attestation, and interaction receipts.
 */

import { bytesToHex } from '@noble/hashes/utils.js';
import { generateKeypair, deriveSigilId, signString } from './identity.js';
import { computeSoulHash, createAttestation, verifyAttestation } from './integrity.js';
import { createDocument, verifyDocument } from './document.js';
import { createRotation, buildKeyChain, verifyKeyChain, isKeyRevoked, createRevocation } from './rotation.js';
import type {
  SigilKeypair,
  CreateAgentOptions,
  AgentDocument,
  IntegrityAttestation,
  InteractionReceipt,
  ReceiptQuality,
  OwnershipClaim,
  KeyRotationStatement,
  KeyRevocationStatement,
  KeyChain,
} from '../types/index.js';

let receiptSeq = 0;

export class SigilAgent {
  private _keypair: SigilKeypair;
  readonly id: string; // Sigil ID derived from ORIGINAL key — never changes
  readonly name: string;
  readonly options: CreateAgentOptions;

  private _document: AgentDocument | null = null;
  private _attestation: IntegrityAttestation | null = null;
  private _originalPublicKey: Uint8Array;
  private _rotations: KeyRotationStatement[] = [];
  private _revocations: KeyRevocationStatement[] = [];

  private constructor(keypair: SigilKeypair, options: CreateAgentOptions, originalPublicKey?: Uint8Array) {
    this._keypair = keypair;
    this._originalPublicKey = originalPublicKey ?? keypair.publicKey;
    this.id = deriveSigilId(this._originalPublicKey);
    this.name = options.name;
    this.options = options;
  }

  /** Create a new agent with a fresh keypair */
  static create(options: CreateAgentOptions): SigilAgent {
    const keypair = generateKeypair();
    return new SigilAgent(keypair, options);
  }

  /** Restore an agent from an existing keypair */
  static fromKeypair(keypair: SigilKeypair, options: CreateAgentOptions): SigilAgent {
    return new SigilAgent(keypair, options);
  }

  /** Get the public key as Uint8Array */
  get publicKey(): Uint8Array {
    return this._keypair.publicKey;
  }

  /**
   * Generate and sign the Agent Document.
   * Optionally include integrity attestation and ownership claim.
   */
  document(owner?: OwnershipClaim): AgentDocument {
    this._document = createDocument(
      this._keypair,
      this.options,
      this._attestation ?? undefined,
      owner
    );
    return this._document;
  }

  /**
   * Compute soul hash for given identity files.
   */
  soulHash(files: Record<string, string>): string {
    return computeSoulHash(files);
  }

  /**
   * Create a signed integrity attestation.
   * Stores it internally for inclusion in future documents.
   */
  attestIntegrity(files: Record<string, string>): IntegrityAttestation {
    this._attestation = createAttestation(files, this._keypair.privateKey);
    return this._attestation;
  }

  /**
   * Verify integrity against a previous attestation.
   */
  verifyIntegrity(
    attestation: IntegrityAttestation,
    currentFiles: Record<string, string>
  ) {
    return verifyAttestation(attestation, currentFiles, this._keypair.publicKey);
  }

  /**
   * Issue a signed interaction receipt.
   */
  issueReceipt(params: {
    to: string;
    action: string;
    quality: ReceiptQuality;
    context?: string;
  }): InteractionReceipt {
    const receipt: InteractionReceipt = {
      type: 'interaction-receipt',
      id: `receipt-${Date.now()}-${++receiptSeq}`,
      from: this.id,
      to: params.to,
      timestamp: new Date().toISOString(),
      action: params.action,
      quality: params.quality,
      ...(params.context && { context: params.context }),
      fromProof: '',
    };

    // Sign the receipt (excluding proofs)
    const { fromProof, toProof, ...body } = receipt;
    const payload = JSON.stringify(body);
    receipt.fromProof = signString(payload, this._keypair.privateKey);

    return receipt;
  }

  /**
   * Sign an arbitrary message (for challenges, custom protocols).
   */
  sign(message: string): string {
    return signString(message, this._keypair.privateKey);
  }

  /** Get the current keypair */
  get keypair(): SigilKeypair {
    return this._keypair;
  }

  /**
   * Rotate to a new keypair. The old key signs a rotation statement
   * authorizing the new key. Identity (Sigil ID) is preserved.
   * Returns the new keypair and the rotation statement.
   */
  rotateKey(
    reason: KeyRotationStatement['reason'] = 'routine'
  ): { newKeypair: SigilKeypair; rotation: KeyRotationStatement } {
    const newKeypair = generateKeypair();
    const rotation = createRotation(this._keypair, newKeypair.publicKey, reason);
    this._rotations.push(rotation);
    this._keypair = newKeypair;
    return { newKeypair, rotation };
  }

  /**
   * Rotate to a specific keypair (for restoring from backup).
   */
  rotateToKeypair(
    newKeypair: SigilKeypair,
    reason: KeyRotationStatement['reason'] = 'routine'
  ): KeyRotationStatement {
    const rotation = createRotation(this._keypair, newKeypair.publicKey, reason);
    this._rotations.push(rotation);
    this._keypair = newKeypair;
    return rotation;
  }

  /**
   * Revoke a previous key (e.g., after compromise).
   */
  revokeKey(revokedPublicKey: Uint8Array, reason: string): KeyRevocationStatement {
    const revocation = createRevocation(this._keypair, revokedPublicKey, reason);
    this._revocations.push(revocation);
    return revocation;
  }

  /**
   * Get the full key chain for this agent.
   */
  keyChain(): KeyChain {
    return buildKeyChain(this._originalPublicKey, this._rotations, this._revocations);
  }

  /**
   * Restore an agent with a key chain history.
   */
  static fromKeyChain(
    currentKeypair: SigilKeypair,
    originalPublicKey: Uint8Array,
    rotations: KeyRotationStatement[],
    options: CreateAgentOptions,
    revocations: KeyRevocationStatement[] = []
  ): SigilAgent {
    const agent = new SigilAgent(currentKeypair, options, originalPublicKey);
    agent._rotations = [...rotations];
    agent._revocations = [...revocations];
    return agent;
  }

  /**
   * Export the agent's identity (public only -- safe to share).
   */
  toPublic(): { id: string; name: string; publicKey: string } {
    return {
      id: this.id,
      name: this.name,
      publicKey: bytesToHex(this._keypair.publicKey),
    };
  }
}
