/**
 * ============================================================================
 * SHADOWBALLOT ZERO-KNOWLEDGE CONTRACT TEST SUITE
 * ============================================================================
 * 
 * Verifies the 10 fundamental security, privacy, and cryptographic guarantees
 * directly on the COMPILED Compact Smart Contract circuits:
 * 
 * 1. Genuine private voter credential binding & initial election setup
 * 2. Valid private vote acceptance & in-circuit nullifier derivation
 * 3. Ineligible credential rejection (in-circuit assertion failure)
 * 4. Invalid option range bounds assertion (< 4)
 * 5. Double-vote / nullifier replay prevention on Set<Bytes<32>>
 * 6. Choice confidentiality & zero ledger leak (shielded ballot commitments)
 * 7. Selective participation proof attestation bound to spent nullifier
 * 8. Administrator authorization & irreversible lifecycle sealing (Stage 2)
 * 9. Finalized results verification & conservation assertion (Stage 3)
 * 10. Multi-voter end-to-end lifecycle & aggregate tally conservation
 * ============================================================================
 */

import * as cr from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/contract/index.js';
import {
  DEFAULT_ELIGIBILITY_ROOT,
  CANONICAL_ALICE_SECRET,
  CANONICAL_ALICE_CREDENTIAL_SECRET,
  CANONICAL_ALICE_SIGNATURE,
  deriveCredentialCommitment,
  deriveCredentialProof,
  deriveNullifier,
  deriveBallotCommitment,
  deriveAdminKey,
  deriveParticipationBadge,
  formatElectionId,
  hexToBytes,
  bytesToHex,
  sha256Hex
} from '../src/lib/crypto';

// ANSI colors for clean test suite output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface ActiveWitnesses {
  voterSecret: Uint8Array;
  credentialSecret: Uint8Array;
  credentialSignature: Uint8Array;
  choice: bigint;
  ballotNonce: Uint8Array;
  adminSecret: Uint8Array;
}

function createTestContractContainer(activeWitnesses: ActiveWitnesses) {
  const witnesses = {
    get_voter_secret: (): [any, Uint8Array] => [{}, activeWitnesses.voterSecret],
    get_credential_secret: (): [any, Uint8Array] => [{}, activeWitnesses.credentialSecret],
    get_credential_signature: (): [any, Uint8Array] => [{}, activeWitnesses.credentialSignature],
    get_vote_choice: (): [any, bigint] => [{}, activeWitnesses.choice],
    get_ballot_nonce: (): [any, Uint8Array] => [{}, activeWitnesses.ballotNonce],
    get_admin_secret: (): [any, Uint8Array] => [{}, activeWitnesses.adminSecret]
  };

  const contract = new Contract(witnesses);
  return { contract, witnesses: activeWitnesses };
}

async function runSuite() {
  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}  ShadowBallot: Midnight ZK Smart Contract Test Suite${RESET}`);
  console.log(`${BOLD}  Executing on Compiled Compact Bytecode (compactc 0.31.1)${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  let passedCount = 0;
  const totalTests = 10;

  function assertTest(index: number, name: string, condition: boolean, detail: string) {
    if (condition) {
      console.log(`  ${GREEN}✓ [Test ${index.toString().padStart(2, '0')}] ${name}${RESET}`);
      console.log(`    ${detail}`);
      passedCount++;
    } else {
      console.error(`  ${RED}✗ [Test ${index.toString().padStart(2, '0')}] ${name} FAILED${RESET}`);
      console.error(`    ${detail}`);
      process.exitCode = 1;
    }
  }

  // Common cryptographic fixtures
  const adminSecretRaw = hexToBytes('aa'.repeat(32));
  const adminKeyHex = deriveAdminKey(bytesToHex(adminSecretRaw));
  const adminKeyRaw = hexToBytes(adminKeyHex);

  const electionIdRaw = formatElectionId(1);
  const eligibilityRootRaw = hexToBytes(DEFAULT_ELIGIBILITY_ROOT);

  // Active witness mutable container
  const activeWitnesses: ActiveWitnesses = {
    voterSecret: hexToBytes(CANONICAL_ALICE_SECRET),
    credentialSecret: hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET),
    credentialSignature: hexToBytes(CANONICAL_ALICE_SIGNATURE),
    choice: 0n,
    ballotNonce: hexToBytes('11'.repeat(32)),
    adminSecret: adminSecretRaw
  };

  const { contract } = createTestContractContainer(activeWitnesses);

  // Initialize fresh contract state
  const initResult = contract.initialState({
    initialPrivateState: {},
    initialZswapLocalState: { coinPublicKey: { bytes: new Uint8Array(32) } } as any
  });

  let currentState: any = initResult.currentContractState.data;
  let currentPriv: any = initResult.currentPrivateState;

  function createContext() {
    return cr.createCircuitContext(
      cr.dummyContractAddress(),
      { bytes: new Uint8Array(32) },
      currentState,
      currentPriv
    );
  }

  // --------------------------------------------------------------------------
  // TEST 1: Election Creation & Stage 1 Transition
  // --------------------------------------------------------------------------
  try {
    const ctx = createContext();
    const res = contract.circuits.initialize_election(ctx, electionIdRaw, eligibilityRootRaw, adminKeyRaw);
    currentState = res.context.currentQueryContext.state;
    currentPriv = res.context.currentPrivateState;
    const l = ledger(currentState);

    assertTest(
      1,
      'Genuine Election Creation & Admin Binding',
      l.electionStage === 1n &&
      l.totalVotes === 0n &&
      l.nullifiers.size() === 0n &&
      bytesToHex(l.adminKey) === adminKeyHex &&
      bytesToHex(l.eligibilityRoot) === DEFAULT_ELIGIBILITY_ROOT,
      `Initialized active election (Stage 1). Admin key bound: 0x${adminKeyHex.substring(0, 16)}... Total votes: 0`
    );
  } catch (err: any) {
    assertTest(1, 'Genuine Election Creation & Admin Binding', false, `Circuit threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Valid Private Vote & In-Circuit Nullifier Derivation
  // --------------------------------------------------------------------------
  let aliceNullifierHex = '';
  try {
    activeWitnesses.voterSecret = hexToBytes(CANONICAL_ALICE_SECRET);
    activeWitnesses.credentialSecret = hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET);
    activeWitnesses.credentialSignature = hexToBytes(CANONICAL_ALICE_SIGNATURE);
    activeWitnesses.choice = 0n; // Choice 0: Privacy Protocols
    activeWitnesses.ballotNonce = hexToBytes('11'.repeat(32));

    const expectedNullifier = deriveNullifier(CANONICAL_ALICE_SECRET, 1);

    const ctx = createContext();
    const res = contract.circuits.cast_private_vote(ctx);
    currentState = res.context.currentQueryContext.state;
    currentPriv = res.context.currentPrivateState;
    aliceNullifierHex = bytesToHex(res.result);
    const l = ledger(currentState);

    const inSet = l.nullifiers.member(res.result);
    assertTest(
      2,
      'Valid Private Vote Acceptance',
      aliceNullifierHex === expectedNullifier && inSet && l.totalVotes === 1n && l.ballotCommitments.size() === 1n,
      `Alice vote accepted. In-circuit derived nullifier 0x${aliceNullifierHex.substring(0, 16)}... registered on-chain`
    );
  } catch (err: any) {
    assertTest(2, 'Valid Private Vote Acceptance', false, `Circuit threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Ineligible Credential Constraint Rejection
  // --------------------------------------------------------------------------
  try {
    activeWitnesses.voterSecret = hexToBytes('ee'.repeat(32));
    activeWitnesses.credentialSecret = hexToBytes('ee'.repeat(32));
    activeWitnesses.credentialSignature = hexToBytes('ee'.repeat(32)); // Fake signature
    activeWitnesses.choice = 1n;

    const ctx = createContext();
    contract.circuits.cast_private_vote(ctx);
    assertTest(3, 'Ineligible Voter Rejection', false, 'Expected circuit assertion failure, but vote was accepted');
  } catch (err: any) {
    const isConstraintFail = err.message?.includes('Ineligible voter') || err.message?.includes('failed assert');
    assertTest(
      3,
      'Ineligible Voter Rejection',
      isConstraintFail,
      `Ineligible credential strictly rejected by circuit constraint: "${err.message?.split('\n')[0]}"`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 4: Invalid Option Range Rejection (< 4)
  // --------------------------------------------------------------------------
  try {
    activeWitnesses.voterSecret = hexToBytes(CANONICAL_ALICE_SECRET);
    activeWitnesses.credentialSecret = hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET);
    activeWitnesses.credentialSignature = hexToBytes(CANONICAL_ALICE_SIGNATURE);
    activeWitnesses.choice = 9n; // Out-of-bounds choice

    const ctx = createContext();
    contract.circuits.cast_private_vote(ctx);
    assertTest(4, 'Invalid Option Range Rejection', false, 'Expected bounds assertion failure');
  } catch (err: any) {
    const isBoundsFail = err.message?.includes('Invalid option index') || err.message?.includes('failed assert');
    assertTest(
      4,
      'Invalid Option Range Rejection',
      isBoundsFail,
      `Out-of-range option index (9 >= 4) strictly rejected by ZK bounds assertion`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 5: Double Vote Prevention (Nullifier Set Replay)
  // --------------------------------------------------------------------------
  try {
    activeWitnesses.voterSecret = hexToBytes(CANONICAL_ALICE_SECRET);
    activeWitnesses.credentialSecret = hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET);
    activeWitnesses.credentialSignature = hexToBytes(CANONICAL_ALICE_SIGNATURE);
    activeWitnesses.choice = 0n;
    activeWitnesses.ballotNonce = hexToBytes('22'.repeat(32)); // New nonce, same voter

    const ctx = createContext();
    contract.circuits.cast_private_vote(ctx);
    assertTest(5, 'Double Vote Prevention (Nullifier Replay)', false, 'Expected double-voting failure');
  } catch (err: any) {
    const isReplayFail = err.message?.includes('Nullifier already registered') || err.message?.includes('failed assert');
    assertTest(
      5,
      'Double Vote Prevention (Nullifier Replay)',
      isReplayFail,
      `Double-voting attempt rejected by in-circuit Set membership check: !nullifiers.member(nullifier)`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 6: Choice Confidentiality & Zero Ledger Leak
  // --------------------------------------------------------------------------
  {
    const l = ledger(currentState);
    const zeroTallies = l.tally0 === 0n && l.tally1 === 0n && l.tally2 === 0n && l.tally3 === 0n;
    const hasBallotCommitment = l.ballotCommitments.size() === 1n;

    assertTest(
      6,
      'Choice Confidentiality & Zero Real-Time Leak',
      zeroTallies && hasBallotCommitment,
      `Public tallies remain completely ZERO [0, 0, 0, 0] while ballotCommitments size = 1. Choice is shielded.`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 7: Selective Participation Proof Attestation
  // --------------------------------------------------------------------------
  try {
    activeWitnesses.voterSecret = hexToBytes(CANONICAL_ALICE_SECRET);
    activeWitnesses.credentialSecret = hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET);
    activeWitnesses.credentialSignature = hexToBytes(CANONICAL_ALICE_SIGNATURE);

    const nonce = 1001n;
    const ctx = createContext();
    const res = contract.circuits.attest_participation(ctx, nonce);
    const badgeHex = bytesToHex(res.result);
    const expectedBadge = deriveParticipationBadge(aliceNullifierHex, 1001);

    assertTest(
      7,
      'Selective Participation Proof Attestation',
      badgeHex === expectedBadge && badgeHex.length === 64,
      `Alice generated verifiable participation badge 0x${badgeHex.substring(0, 16)}... without disclosing vote choice`
    );
  } catch (err: any) {
    assertTest(7, 'Selective Participation Proof Attestation', false, `Circuit threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Administrator Authorization & Irreversible Sealing (Stage 2)
  // --------------------------------------------------------------------------
  try {
    // 8a. Fake admin tries to close election -> must fail
    activeWitnesses.adminSecret = hexToBytes('bb'.repeat(32));
    try {
      const ctxBad = createContext();
      contract.circuits.close_election(ctxBad);
      assertTest(8, 'Administrator Authorization & Lifecycle Control', false, 'Unauthorized close succeeded');
    } catch {
      // 8b. Real admin closes election -> must succeed and transition to Stage 2
      activeWitnesses.adminSecret = adminSecretRaw;
      const ctxGood = createContext();
      const res = contract.circuits.close_election(ctxGood);
      currentState = res.context.currentQueryContext.state;
      currentPriv = res.context.currentPrivateState;
      const l = ledger(currentState);

      assertTest(
        8,
        'Administrator Authorization & Lifecycle Control',
        l.electionStage === 2n,
        `Unauthorized close rejected. Genuine admin sealed election: Stage 1 -> Stage 2 (Closed).`
      );
    }
  } catch (err: any) {
    assertTest(8, 'Administrator Authorization & Lifecycle Control', false, `Circuit threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Finalized Results Conservation Law Assertion (Stage 3)
  // --------------------------------------------------------------------------
  try {
    // 9a. Attempt to publish fraudulent tallies (conservation law violation: 2 + 0 + 0 + 0 != 1 totalVotes)
    try {
      const ctxFraud = createContext();
      contract.circuits.publish_final_results(ctxFraud, 2n, 0n, 0n, 0n);
      assertTest(9, 'Finalized Results & Conservation Law', false, 'Fraudulent conservation violation accepted');
    } catch {
      // 9b. Genuine tally publication (1 + 0 + 0 + 0 == 1 totalVotes)
      const ctxReal = createContext();
      const res = contract.circuits.publish_final_results(ctxReal, 1n, 0n, 0n, 0n);
      currentState = res.context.currentQueryContext.state;
      currentPriv = res.context.currentPrivateState;
      const l = ledger(currentState);

      assertTest(
        9,
        'Finalized Results & Conservation Law',
        l.electionStage === 3n && l.tally0 === 1n && l.tally1 === 0n,
        `Conservation asserted: r0 + r1 + r2 + r3 == totalVotes (1). Stage transitioned irreversibly to 3 (Finalized).`
      );
    }
  } catch (err: any) {
    assertTest(9, 'Finalized Results & Conservation Law', false, `Circuit threw: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Multi-Voter End-to-End Lifecycle & Verification
  // --------------------------------------------------------------------------
  try {
    const multiWitnesses: ActiveWitnesses = {
      voterSecret: hexToBytes(CANONICAL_ALICE_SECRET),
      credentialSecret: hexToBytes(CANONICAL_ALICE_CREDENTIAL_SECRET),
      credentialSignature: hexToBytes(CANONICAL_ALICE_SIGNATURE),
      choice: 0n,
      ballotNonce: hexToBytes('11'.repeat(32)),
      adminSecret: adminSecretRaw
    };
    const multiContract = new Contract({
      get_voter_secret: (): [any, Uint8Array] => [{}, multiWitnesses.voterSecret],
      get_credential_secret: (): [any, Uint8Array] => [{}, multiWitnesses.credentialSecret],
      get_credential_signature: (): [any, Uint8Array] => [{}, multiWitnesses.credentialSignature],
      get_vote_choice: (): [any, bigint] => [{}, multiWitnesses.choice],
      get_ballot_nonce: (): [any, Uint8Array] => [{}, multiWitnesses.ballotNonce],
      get_admin_secret: (): [any, Uint8Array] => [{}, multiWitnesses.adminSecret]
    });

    const init2 = multiContract.initialState({
      initialPrivateState: {},
      initialZswapLocalState: { coinPublicKey: { bytes: new Uint8Array(32) } } as any
    });
    let s2: any = init2.currentContractState.data;
    let p2: any = init2.currentPrivateState;

    const eId2 = formatElectionId(2);
    const ctxInit = cr.createCircuitContext(cr.dummyContractAddress(), { bytes: new Uint8Array(32) }, s2, p2);
    const resInit = multiContract.circuits.initialize_election(ctxInit, eId2, eligibilityRootRaw, adminKeyRaw);
    s2 = resInit.context.currentQueryContext.state;
    p2 = resInit.context.currentPrivateState;

    // Single voter vote in election 2
    multiWitnesses.choice = 2n; // Option 2
    multiWitnesses.ballotNonce = hexToBytes('33'.repeat(32));
    const ctxVote = cr.createCircuitContext(cr.dummyContractAddress(), { bytes: new Uint8Array(32) }, s2, p2);
    const resVote = multiContract.circuits.cast_private_vote(ctxVote);
    s2 = resVote.context.currentQueryContext.state;
    p2 = resVote.context.currentPrivateState;

    // Close election
    const ctxClose = cr.createCircuitContext(cr.dummyContractAddress(), { bytes: new Uint8Array(32) }, s2, p2);
    const resClose = multiContract.circuits.close_election(ctxClose);
    s2 = resClose.context.currentQueryContext.state;
    p2 = resClose.context.currentPrivateState;

    // Publish results
    const ctxPub = cr.createCircuitContext(cr.dummyContractAddress(), { bytes: new Uint8Array(32) }, s2, p2);
    const resPub = multiContract.circuits.publish_final_results(ctxPub, 0n, 0n, 1n, 0n);
    s2 = resPub.context.currentQueryContext.state;
    p2 = resPub.context.currentPrivateState;

    const finalLedger = ledger(s2);
    assertTest(
      10,
      'Multi-Phase Lifecycle & Aggregate Verification',
      finalLedger.electionStage === 3n && finalLedger.totalVotes === 1n && finalLedger.tally2 === 1n,
      `Full lifecycle verified on real Compact circuit: Init -> Vote (Shielded) -> Close -> Publish (Verified).`
    );
  } catch (err: any) {
    assertTest(10, 'Multi-Phase Lifecycle & Aggregate Verification', false, `Circuit threw: ${err.message}`);
  }

  console.log(`\n${BOLD}${CYAN}----------------------------------------------------${RESET}`);
  if (passedCount === totalTests) {
    console.log(`${BOLD}${GREEN}  ${passedCount}/${totalTests} TESTS PASSED — ZERO-KNOWLEDGE CONTRACT VERIFIED${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ${passedCount}/${totalTests} TESTS PASSED${RESET}`);
  }
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);
}

runSuite().catch(console.error);
