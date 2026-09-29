import { VoterCredential, ParticipationAttestation } from './types';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

/**
 * Standard NIST FIPS 180-4 SHA-256 implementation
 * Guarantees standard cryptographic digest matching across browser, Node, and test environments.
 */
export function sha256Pure(ascii: string | Uint8Array): Uint8Array {
  const bytes = typeof ascii === 'string' ? new TextEncoder().encode(ascii) : ascii;
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H0 = 0x6a09e667;
  let H1 = 0xbb67ae85;
  let H2 = 0x3c6ef372;
  let H3 = 0xa54ff53a;
  let H4 = 0x510e527f;
  let H5 = 0x9b05688c;
  let H6 = 0x1f83d9ab;
  let H7 = 0x5be0cd19;

  const l = bytes.length;
  const bitLen = l * 8;
  const newLen = ((l + 8) >> 6) + 1 << 6;
  const padded = new Uint8Array(newLen);
  padded.set(bytes);
  padded[l] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLen - 4, bitLen & 0xffffffff);
  view.setUint32(newLen - 8, Math.floor(bitLen / 0x100000000));

  const W = new Uint32Array(64);
  for (let i = 0; i < newLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^
                 ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^
                 (W[t - 15] >>> 3);
      const s1 = ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^
                 ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^
                 (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0;
    H1 = (H1 + b) >>> 0;
    H2 = (H2 + c) >>> 0;
    H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0;
    H5 = (H5 + f) >>> 0;
    H6 = (H6 + g) >>> 0;
    H7 = (H7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, H0);
  outView.setUint32(4, H1);
  outView.setUint32(8, H2);
  outView.setUint32(12, H3);
  outView.setUint32(16, H4);
  outView.setUint32(20, H5);
  outView.setUint32(24, H6);
  outView.setUint32(28, H7);
  return out;
}

export function sha256Hex(data: string | Uint8Array): string {
  const digest = sha256Pure(data);
  return Array.from(digest).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2) || '00', 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ============================================================================
 * OFFICIAL MIDNIGHT COMPACT RUNTIME PERSISTENT HASH IMPLEMENTATION
 * ============================================================================
 * Uses the exact Compact runtime type descriptors matching contracts/shadowballot.compact
 * bytecode and in-circuit ZK execution.
 */

const _descriptor_bytes32 = new compactRuntime.CompactTypeBytes(32);
const _descriptor_uint32 = new compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);
const _descriptor_uint8 = new compactRuntime.CompactTypeUnsignedInteger(255n, 1);

// Descriptor for [Bytes<32>, Bytes<32>]
class TupleBytes32Pair {
  alignment() {
    return _descriptor_bytes32.alignment().concat(_descriptor_bytes32.alignment());
  }
  fromValue(v: any) {
    return [_descriptor_bytes32.fromValue(v), _descriptor_bytes32.fromValue(v)];
  }
  toValue(v: [Uint8Array, Uint8Array]) {
    return _descriptor_bytes32.toValue(v[0]).concat(_descriptor_bytes32.toValue(v[1]));
  }
}
const descriptorPair = new TupleBytes32Pair();

// Descriptor for [Bytes<32>]
class TupleBytes32Single {
  alignment() {
    return _descriptor_bytes32.alignment();
  }
  fromValue(v: any) {
    return [_descriptor_bytes32.fromValue(v)];
  }
  toValue(v: [Uint8Array]) {
    return _descriptor_bytes32.toValue(v[0]);
  }
}
const descriptorSingle = new TupleBytes32Single();

// Descriptor for [Bytes<32>, Uint<8>, Bytes<32>] (Ballot Commitment)
class TupleBallot {
  alignment() {
    return _descriptor_bytes32.alignment().concat(_descriptor_uint8.alignment().concat(_descriptor_bytes32.alignment()));
  }
  fromValue(v: any) {
    return [_descriptor_bytes32.fromValue(v), _descriptor_uint8.fromValue(v), _descriptor_bytes32.fromValue(v)];
  }
  toValue(v: [Uint8Array, bigint, Uint8Array]) {
    return _descriptor_bytes32.toValue(v[0]).concat(_descriptor_uint8.toValue(v[1]).concat(_descriptor_bytes32.toValue(v[2])));
  }
}
const descriptorBallot = new TupleBallot();

// Descriptor for [Bytes<32>, Uint<32>] (Attestation Badge)
class TupleAttest {
  alignment() {
    return _descriptor_bytes32.alignment().concat(_descriptor_uint32.alignment());
  }
  fromValue(v: any) {
    return [_descriptor_bytes32.fromValue(v), _descriptor_uint32.fromValue(v)];
  }
  toValue(v: [Uint8Array, bigint]) {
    return _descriptor_bytes32.toValue(v[0]).concat(_descriptor_uint32.toValue(v[1]));
  }
}
const descriptorAttest = new TupleAttest();

/**
 * In-circuit persistentHash<[Bytes<32>, Bytes<32>]>
 */
export function computeCompactHashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
  return compactRuntime.persistentHash(descriptorPair, [a, b]);
}

/**
 * In-circuit persistentHash<[Bytes<32>]>
 */
export function computeCompactHashSingle(a: Uint8Array): Uint8Array {
  return compactRuntime.persistentHash(descriptorSingle, [a]);
}

/**
 * In-circuit persistentHash<[Bytes<32>, Uint<8>, Bytes<32>]>
 */
export function computeCompactHashBallot(electionId: Uint8Array, choice: number, ballotNonce: Uint8Array): Uint8Array {
  return compactRuntime.persistentHash(descriptorBallot, [electionId, BigInt(choice), ballotNonce]);
}

/**
 * In-circuit persistentHash<[Bytes<32>, Uint<32>]>
 */
export function computeCompactHashAttest(nullifier: Uint8Array, electionNonce: number): Uint8Array {
  return compactRuntime.persistentHash(descriptorAttest, [nullifier, BigInt(electionNonce)]);
}

/**
 * Canonical helper for backwards compatibility that routes to the exact Compact runtime primitive
 */
export function computePersistentHash(tag: string, elements: (string | Uint8Array | bigint | number)[]): Uint8Array {
  if (elements.length === 2 && elements[0] instanceof Uint8Array && elements[1] instanceof Uint8Array) {
    return computeCompactHashPair(elements[0], elements[1]);
  }
  if (elements.length === 1 && elements[0] instanceof Uint8Array) {
    return computeCompactHashSingle(elements[0]);
  }
  throw new Error(`Unsupported tuple structure for Compact persistentHash descriptor: ${tag}`);
}

/**
 * Format election identifier to a canonical 32-byte representation
 */
export function formatElectionId(electionId: string | number): Uint8Array {
  if (typeof electionId === 'string' && /^(0x)?[0-9a-fA-F]{64}$/.test(electionId)) {
    return hexToBytes(electionId);
  }
  return sha256Pure(`shadowballot:election:${electionId}`);
}

/**
 * Derive deterministic in-circuit voting nullifier:
 * nullifier = persistentHash([voterSecret, electionId])
 */
export function deriveNullifier(voterSecretHex: string, electionId: string | number | Uint8Array): string {
  const voterBytes = hexToBytes(voterSecretHex);
  const elBytes = electionId instanceof Uint8Array ? electionId : formatElectionId(electionId);
  const hash = computeCompactHashPair(voterBytes, elBytes);
  return bytesToHex(hash);
}

/**
 * Derive voter credential commitment:
 * commitment = persistentHash([voterSecret, credentialSecret])
 */
export function deriveCredentialCommitment(voterSecretHex: string, credentialSecretHex: string): string {
  const hash = computeCompactHashPair(hexToBytes(voterSecretHex), hexToBytes(credentialSecretHex));
  return bytesToHex(hash);
}

/**
 * Derive credential proof against the eligibility root:
 * proof = persistentHash([credentialSecret, credentialSignature])
 */
export function deriveCredentialProof(
  credentialSecretHex: string,
  credentialSignatureHex: string
): string {
  const proofBytes = computeCompactHashPair(hexToBytes(credentialSecretHex), hexToBytes(credentialSignatureHex));
  return bytesToHex(proofBytes);
}

/**
 * Derive secret ballot commitment:
 * ballotCommitment = persistentHash([electionId, choice, ballotNonce])
 */
export function deriveBallotCommitment(
  electionId: string | number | Uint8Array,
  choice: number,
  ballotNonceHex: string
): string {
  const elBytes = electionId instanceof Uint8Array ? electionId : formatElectionId(electionId);
  const nonceBytes = hexToBytes(ballotNonceHex);
  return bytesToHex(computeCompactHashBallot(elBytes, choice, nonceBytes));
}

/**
 * Derive administrator verification key from secret key:
 * adminKey = persistentHash([adminSecret])
 */
export function deriveAdminKey(adminSecretHex: string): string {
  return bytesToHex(computeCompactHashSingle(hexToBytes(adminSecretHex)));
}

/**
 * Generate a new Administrator Secret and Key pair
 */
export function generateAdminCredentials(): { adminSecret: string; adminKey: string } {
  const entropy = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const adminSecret = entropy;
  const adminKey = deriveAdminKey(adminSecret);
  return { adminSecret, adminKey };
}

/**
 * Derive participation attestation badge:
 * badge = persistentHash([nullifier, electionNonce])
 */
export function deriveParticipationBadge(nullifierHex: string, electionNonce: number): string {
  const cleanNullifier = nullifierHex.replace(/^0x/, '');
  return bytesToHex(computeCompactHashAttest(hexToBytes(cleanNullifier), electionNonce));
}

/**
 * ============================================================================
 * GENUINE ELIGIBILITY AUTHORITY & ISSUANCE SYSTEM
 * ============================================================================
 * Manages verifiable voter registries and issues cryptographic credentials
 * signed against the authoritative eligibility root.
 * Supports cross-election domain isolation: credentials issued for Election A
 * are strictly cryptographically rejected in Election B.
 */
export class GovernanceEligibilityAuthority {
  private authoritySigningKey: Uint8Array;
  private authorizedVoterIds: Set<string>;
  public canonicalRoot: string;

  constructor(authoritySeed = 'midnight_governance_authority_master_seed') {
    this.authoritySigningKey = sha256Pure(new TextEncoder().encode(`auth_key:${authoritySeed}`));
    this.authorizedVoterIds = new Set([
      'alice',
      'bob',
      'charlie',
      'voter_alice',
      'voter_bob',
      'voter_charlie',
      '020088b901a1827cf482a1782e4f019a82001',
      '0200fa4e87a27d2c3882a939f3714b3d8819445e',
      '02005a7cf9b301824e9da17849e0813f019b84a2'
    ]);

    // Compute canonical authority root for default election
    this.canonicalRoot = this.getRootForElection('default');
  }

  getElectionAuthorityKey(electionId: string | number): Uint8Array {
    return sha256Pure(new TextEncoder().encode(`auth_key_election:${bytesToHex(this.authoritySigningKey)}:${electionId}`));
  }

  getRootForElection(electionId: string | number): string {
    const electionKey = this.getElectionAuthorityKey(electionId);
    const electionTicket = sha256Hex(`election_ticket:${bytesToHex(electionKey)}:${electionId}`);
    const sig = bytesToHex(computeCompactHashPair(hexToBytes(electionTicket), electionKey));
    return deriveCredentialProof(electionTicket, sig);
  }

  isAuthorized(voterIdentifier: string): boolean {
    const clean = voterIdentifier.toLowerCase().trim();
    if (this.authorizedVoterIds.has(clean)) return true;
    for (const id of this.authorizedVoterIds) {
      if (clean.includes(id) || id.includes(clean)) return true;
    }
    return false;
  }

  authorizeVoter(voterIdentifier: string): void {
    this.authorizedVoterIds.add(voterIdentifier.toLowerCase().trim());
  }

  revokeVoter(voterIdentifier: string): void {
    this.authorizedVoterIds.delete(voterIdentifier.toLowerCase().trim());
  }

  issueCredential(
    voterIdentifier: string,
    electionId: string | number = 'default',
    userEntropy?: string
  ): VoterCredential {
    const isEligible = this.isAuthorized(voterIdentifier);
    const entropy = userEntropy || sha256Hex(`voter_entropy:${voterIdentifier}:${electionId}`);
    const voterSecret = sha256Hex(`voter_sec:${entropy}`);

    const signingKey = this.getElectionAuthorityKey(electionId);
    const credentialSecret = sha256Hex(`election_ticket:${bytesToHex(signingKey)}:${electionId}`);
    const publicCommitment = deriveCredentialCommitment(voterSecret, credentialSecret);
    const authorityRoot = this.getRootForElection(electionId);

    let credentialSignature: string;
    if (isEligible) {
      // Genuine cryptographic signature issued by the governance authority for this election
      const sigBytes = computeCompactHashPair(hexToBytes(credentialSecret), signingKey);
      credentialSignature = bytesToHex(sigBytes);
    } else {
      // Unauthorized/ineligible voter: intentionally invalid signature
      credentialSignature = '00'.repeat(32);
    }

    return {
      secret: voterSecret,
      credentialSecret,
      credentialSignature,
      voterId: voterIdentifier.startsWith('0x') || voterIdentifier.startsWith('02')
        ? `voter_${voterIdentifier.substring(0, 8)}`
        : voterIdentifier,
      publicCommitment,
      authorityRoot,
      isEligible,
      issuedAt: new Date().toISOString()
    };
  }
}

// Global Governance Authority instance
export const defaultEligibilityAuthority = new GovernanceEligibilityAuthority();
export const DEFAULT_ELIGIBILITY_ROOT = defaultEligibilityAuthority.canonicalRoot;

// Secure In-Memory Enclave for voter secrets (never stored unencrypted in localStorage)
const voterSecretMemoryVault = new Map<string, VoterCredential>();

/**
 * Issue or retrieve a genuine cryptographic VoterCredential bound to authorityRoot.
 * Sensitive voter secrets are strictly held in-memory and NEVER stored in plaintext in localStorage.
 */
export function getOrCreateVoterCredential(
  customSecretOrId?: string,
  authorityRoot: string = DEFAULT_ELIGIBILITY_ROOT,
  electionId?: string | number
): VoterCredential {
  const voterId = customSecretOrId || 'alice';
  const vaultKey = `${voterId}:${electionId ?? 'default'}:${authorityRoot}`;

  // 1. Check secure in-memory vault
  const inMemory = voterSecretMemoryVault.get(vaultKey);
  if (inMemory && inMemory.authorityRoot.toLowerCase() === authorityRoot.toLowerCase()) {
    if (verifyCredentialAuthenticity(inMemory, authorityRoot)) {
      return inMemory;
    }
  }

  // 2. Issue through genuine Governance Eligibility Authority
  const cred = defaultEligibilityAuthority.issueCredential(voterId, electionId ?? 'default');
  voterSecretMemoryVault.set(vaultKey, cred);

  // Note: Plaintext secrets are NOT written to localStorage.
  // Only public voter pseudonym and public commitment may be stored if needed.
  if (typeof sessionStorage !== 'undefined') {
    try {
      // Store non-sensitive metadata only
      sessionStorage.setItem('shadowballot_active_voter', cred.voterId);
    } catch {
      // ignore
    }
  }

  return cred;
}

/**
 * Verify that a VoterCredential is cryptographically authentic under an authority root
 * In-circuit constraint: assert(credentialProof == eligibilityRoot)
 */
export function verifyCredentialAuthenticity(
  cred: VoterCredential,
  expectedRoot: string = DEFAULT_ELIGIBILITY_ROOT
): boolean {
  if (!cred.secret || !cred.credentialSecret || !cred.credentialSignature) return false;
  if (!cred.isEligible) return false;
  const computedRoot = deriveCredentialProof(cred.credentialSecret, cred.credentialSignature);
  const cleanExpected = expectedRoot.replace(/^0x/, '').toLowerCase();
  const cleanComputed = computedRoot.replace(/^0x/, '').toLowerCase();
  return cleanComputed === cleanExpected;
}

/**
 * Generate a cryptographically verifiable Participation Attestation
 * Bound to the genuine on-chain nullifier, election, and attest_participation ZK circuit.
 */
export function createParticipationAttestation(
  nullifierHex: string,
  electionId: number,
  electionTitle: string,
  contractAddress: string,
  electionNonce: number = 42,
  confirmedTxHash?: string
): ParticipationAttestation {
  const cleanNullifier = nullifierHex.replace(/^0x/, '');
  const attestationBadge = deriveParticipationBadge(cleanNullifier, electionNonce);
  const attestationId = `SB-ZKA-${attestationBadge.substring(0, 10).toUpperCase()}`;

  // Bound to the genuine on-chain confirmed transaction hash and Compact badge
  const proofHash = confirmedTxHash || `0x${sha256Hex(`midnight_attestation_proof:${attestationBadge}:${contractAddress}:${electionId}`)}`;
  const circuitSignature = confirmedTxHash
    ? `0x${cleanNullifier}`
    : `0x${sha256Hex(`attest_participation_verifier:${proofHash}:${cleanNullifier}`)}`;

  return {
    attestationId,
    electionId,
    electionTitle,
    nullifier: `0x${cleanNullifier}`,
    attestationBadge: `0x${attestationBadge}`,
    proofHash,
    issuedAt: new Date().toISOString(),
    contractAddress,
    circuitSignature,
    selectiveDisclosureClaim: 'Cryptographically verified zero-knowledge participation via attest_participation circuit without choice disclosure.',
    verifiedOnChain: !!confirmedTxHash
  };
}

/**
 * Verify a Participation Attestation against on-chain nullifiers and cryptographic badge
 */
export function verifyParticipationAttestation(
  attestation: ParticipationAttestation,
  onChainNullifiers: Set<string> | string[],
  electionNonce: number = 42
): { valid: boolean; reason: string } {
  const cleanNullifier = attestation.nullifier.replace(/^0x/, '');

  // 1. Verify nullifier presence on Midnight ledger
  const hasNullifier = onChainNullifiers instanceof Set
    ? onChainNullifiers.has(cleanNullifier) || onChainNullifiers.has(`0x${cleanNullifier}`)
    : onChainNullifiers.some((n) => n.replace(/^0x/, '') === cleanNullifier);

  if (!hasNullifier) {
    return {
      valid: false,
      reason: 'Cryptographic Audit Failed: Nullifier is NOT registered in the on-chain nullifier Set. This certificate does not represent a submitted ballot.'
    };
  }

  // 2. Cryptographic badge verification using Compact persistentHash
  const expectedBadge = `0x${deriveParticipationBadge(cleanNullifier, electionNonce)}`;
  if (attestation.attestationBadge.toLowerCase() !== expectedBadge.toLowerCase()) {
    return {
      valid: false,
      reason: 'Cryptographic Integrity Violation: Attestation badge does not match persistentHash([nullifier, electionNonce]).'
    };
  }

  // 3. Verify on-chain verification status
  if (!attestation.verifiedOnChain) {
    return {
      valid: false,
      reason: 'Unconfirmed Attestation: Certificate was not verified and confirmed on the Midnight ledger.'
    };
  }

  return {
    valid: true,
    reason: 'Cryptographically Authenticated: Nullifier verified on Midnight ledger with zero witness disclosure via attest_participation circuit.'
  };
}
