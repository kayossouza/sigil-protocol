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
import type {
  SigilKeypair,
  CreateAgentOptions,
  AgentDocument,
  IntegrityAttestation,
  InteractionReceipt,
  ReceiptQuality,
  OwnershipClaim,
} from '../types/index.js';

let receiptSeq = 0;

export class SigilAgent {
  readonly keypair: SigilKeypair;
  readonly id: string;
  readonly name: string;
  readonly options: CreateAgentOptions;

  private _document: AgentDocument | null = null;
  private _attestation: IntegrityAttestation | null = null;

  private constructor(keypair: SigilKeypair, options: CreateAgentOptions) {
    this.keypair = keypair;
    this.id = deriveSigilId(keypair.publicKey);
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
    return this.keypair.publicKey;
  }

  /**
   * Generate and sign the Agent Document.
   * Optionally include integrity attestation and ownership claim.
   */
  document(owner?: OwnershipClaim): AgentDocument {
    this._document = createDocument(
      this.keypair,
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
    this._attestation = createAttestation(files, this.keypair.privateKey);
    return this._attestation;
  }

  /**
   * Verify integrity against a previous attestation.
   */
  verifyIntegrity(
    attestation: IntegrityAttestation,
    currentFiles: Record<string, string>
  ) {
    return verifyAttestation(attestation, currentFiles, this.keypair.publicKey);
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
    receipt.fromProof = signString(payload, this.keypair.privateKey);

    return receipt;
  }

  /**
   * Sign an arbitrary message (for challenges, custom protocols).
   */
  sign(message: string): string {
    return signString(message, this.keypair.privateKey);
  }

  /**
   * Export the agent's identity (public only -- safe to share).
   */
  toPublic(): { id: string; name: string; publicKey: string } {
    return {
      id: this.id,
      name: this.name,
      publicKey: bytesToHex(this.keypair.publicKey),
    };
  }
}
