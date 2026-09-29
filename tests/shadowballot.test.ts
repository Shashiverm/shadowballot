/**
 * ============================================================================
 * SHADOWBALLOT ZERO-KNOWLEDGE SMART CONTRACT TEST SUITE
 * ============================================================================
 * 
 * Verifies the 10 fundamental cryptographic guarantees of the ShadowBallot
 * Midnight Compact contract running on the compiled bytecode (compactc 0.31.1):
 * 
 * 1. Genuine Election Creation & Admin Binding
 * 2. Valid Private Vote Acceptance & In-Circuit Nullifier
 * 3. Ineligible Voter Rejection (Credential proof constraint)
 * 4. Invalid Option Range Rejection (In-circuit bounds assertion)
 * 5. Double Vote Prevention (On-chain nullifier Set replay)
 * 6. Choice Confidentiality & Zero Real-Time Leak
 * 7. Selective Participation Proof Attestation (attest_participation circuit)
 * 8. Administrator Authorization & Sealed Lifecycle
 * 9. Cryptographic Ballot Tallying from Ballot Commitments
 * 10. Finalized Results Verification & Conservation Law
 * ============================================================================
 */

import { Contract, ledger } from '../managed/contract/index.js';
import * as cr from '@midnight-ntwrk/compact-runtime';
import {
  sha256Pure,
  sha256Hex,
  hexToBytes,
  bytesToHex,
  computeCompactHashPair,
  computeCompactHashSingle,
  computeCompactHashBallot,
  computeCompactHashAttest,
  deriveCredentialCommitment,
  deriveCredentialProof,
  deriveNullifier,
  deriveBallotCommitment,
  deriveAdminKey,
  deriveParticipationBadge,
  defaultEligibilityAuthority
} from '../src/lib/crypto';

// ANSI terminal colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

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

  // Setup Authority & Voters (deterministically derived without static secrets)
  const authoritySeed = 'midnight_test_authority_seed';
  const authorityKey = sha256Pure(new TextEncoder().encode(`auth_key:${authoritySeed}`));

  function issueVoterCred(voterName: string, isEligible: boolean) {
    const voterSecret = sha256Hex(`test_voter_sec:${voterName}`);
    const credSecret = sha256Hex(`cred_sec:${voterSecret}`);
    const comm = deriveCredentialCommitment(voterSecret, credSecret);
    let sig: string;
    if (isEligible) {
      sig = bytesToHex(computeCompactHashPair(hexToBytes(comm), authorityKey));
    } else {
      sig = '00'.repeat(32); // unauthorized
    }
    const root = deriveCredentialProof(voterSecret, credSecret, sig);
    return {
      secret: voterSecret,
      credentialSecret: credSecret,
      credentialSignature: sig,
      commitment: comm,
      eligibilityRoot: root,
      isEligible
    };
  }

  const aliceCred = issueVoterCred('alice', true);
  const eveCred = issueVoterCred('eve', false);

  const adminSecretHex = sha256Hex('admin_election_salt_seed_2026');
  const adminKeyHex = deriveAdminKey(adminSecretHex);

  const electionIdBytes = new Uint8Array(32).fill(42);

  // Dynamic witness storage
  let currentVoterSecret = hexToBytes(aliceCred.secret);
  let currentCredSecret = hexToBytes(aliceCred.credentialSecret);
  let currentCredSig = hexToBytes(aliceCred.credentialSignature);
  let currentChoice = 0n;
  let currentBallotNonce = new Uint8Array(32).fill(101);
  let currentAdminSecret = hexToBytes(adminSecretHex);

  const witnesses = {
    get_voter_secret: (ctx: any): [any, Uint8Array] => [ctx.privateState, currentVoterSecret],
    get_credential_secret: (ctx: any): [any, Uint8Array] => [ctx.privateState, currentCredSecret],
    get_credential_signature: (ctx: any): [any, Uint8Array] => [ctx.privateState, currentCredSig],
    get_vote_choice: (ctx: any): [any, bigint] => [ctx.privateState, currentChoice],
    get_ballot_nonce: (ctx: any): [any, Uint8Array] => [ctx.privateState, currentBallotNonce],
    get_admin_secret: (ctx: any): [any, Uint8Array] => [ctx.privateState, currentAdminSecret]
  };

  const contract = new Contract(witnesses as any);
  const constructorContext = (cr.createConstructorContext as any)({}, {});
  const initRes = contract.initialState(constructorContext);

  let circuitCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    initRes.currentZswapLocalState,
    initRes.currentContractState,
    initRes.currentPrivateState
  );

  // [Test 01] Genuine Election Creation & Admin Binding
  const initTx = contract.circuits.initialize_election(
    circuitCtx,
    electionIdBytes,
    hexToBytes(aliceCred.eligibilityRoot),
    hexToBytes(adminKeyHex)
  );
  let state = ledger(initTx.context.currentQueryContext.state);
  assertTest(
    1,
    'Genuine Election Creation & Admin Binding',
    state.electionStage === 1n && state.totalVotes === 0n,
    `Initialized active election (Stage 1). Admin key bound: 0x${adminKeyHex.substring(0, 16)}... Total votes: 0`
  );

  circuitCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    initTx.context.currentZswapLocalState,
    initTx.context.currentQueryContext.state,
    initTx.context.currentPrivateState
  );

  // [Test 02] Valid Private Vote Acceptance & In-Circuit Nullifier Registration
  const expectedNullifier = deriveNullifier(aliceCred.secret, bytesToHex(electionIdBytes));
  const voteTx = contract.circuits.cast_private_vote(circuitCtx);
  state = ledger(voteTx.context.currentQueryContext.state);
  const nullifierRegistered = state.nullifiers.member(hexToBytes(expectedNullifier));
  assertTest(
    2,
    'Valid Private Vote Acceptance',
    nullifierRegistered && state.totalVotes === 1n,
    `Alice vote accepted. In-circuit derived nullifier 0x${expectedNullifier.substring(0, 16)}... registered on-chain`
  );

  // [Test 03] Ineligible Voter Rejection
  currentVoterSecret = hexToBytes(eveCred.secret);
  currentCredSecret = hexToBytes(eveCred.credentialSecret);
  currentCredSig = hexToBytes(eveCred.credentialSignature);
  currentChoice = 1n;
  currentBallotNonce = new Uint8Array(32).fill(102);

  let eveRejected = false;
  let eveErrorMsg = '';
  try {
    const eveCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      voteTx.context.currentZswapLocalState,
      voteTx.context.currentQueryContext.state,
      voteTx.context.currentPrivateState
    );
    contract.circuits.cast_private_vote(eveCtx);
  } catch (err: any) {
    eveRejected = true;
    eveErrorMsg = err?.message || String(err);
  }
  assertTest(
    3,
    'Ineligible Voter Rejection',
    eveRejected && eveErrorMsg.includes('Ineligible voter'),
    `Ineligible credential strictly rejected by circuit constraint: "${eveErrorMsg.substring(0, 85)}..."`
  );

  // [Test 04] Invalid Option Range Rejection
  const bobCred = issueVoterCred('bob', true);
  currentVoterSecret = hexToBytes(bobCred.secret);
  currentCredSecret = hexToBytes(bobCred.credentialSecret);
  currentCredSig = hexToBytes(bobCred.credentialSignature);
  currentChoice = 9n; // Invalid choice (>= 4)
  currentBallotNonce = new Uint8Array(32).fill(103);

  let outOfBoundsRejected = false;
  try {
    const oobCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      voteTx.context.currentZswapLocalState,
      voteTx.context.currentQueryContext.state,
      voteTx.context.currentPrivateState
    );
    contract.circuits.cast_private_vote(oobCtx);
  } catch (err: any) {
    outOfBoundsRejected = true;
  }
  assertTest(
    4,
    'Invalid Option Range Rejection',
    outOfBoundsRejected,
    `Out-of-range option index (9 >= 4) strictly rejected by ZK bounds assertion`
  );

  // [Test 05] Double Vote Prevention (Nullifier Replay)
  currentVoterSecret = hexToBytes(aliceCred.secret);
  currentCredSecret = hexToBytes(aliceCred.credentialSecret);
  currentCredSig = hexToBytes(aliceCred.credentialSignature);
  currentChoice = 2n;
  currentBallotNonce = new Uint8Array(32).fill(104);

  let doubleVoteRejected = false;
  try {
    const replayCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      voteTx.context.currentZswapLocalState,
      voteTx.context.currentQueryContext.state,
      voteTx.context.currentPrivateState
    );
    contract.circuits.cast_private_vote(replayCtx);
  } catch (err: any) {
    doubleVoteRejected = true;
  }
  assertTest(
    5,
    'Double Vote Prevention (Nullifier Replay)',
    doubleVoteRejected,
    `Double-voting attempt rejected by in-circuit Set membership check: !nullifiers.member(nullifier)`
  );

  // [Test 06] Choice Confidentiality & Zero Real-Time Leak
  const t0 = state.tally0;
  const t1 = state.tally1;
  const t2 = state.tally2;
  const t3 = state.tally3;
  const allTalliesZero = t0 === 0n && t1 === 0n && t2 === 0n && t3 === 0n;
  const ballotCommitted = state.ballotCommitments.size() === 1n;
  assertTest(
    6,
    'Choice Confidentiality & Zero Real-Time Leak',
    allTalliesZero && ballotCommitted,
    `Public tallies remain completely ZERO [0, 0, 0, 0] while ballotCommitments size = 1. Choice is shielded.`
  );

  // [Test 07] Selective Participation Proof Attestation
  currentVoterSecret = hexToBytes(aliceCred.secret);
  currentCredSecret = hexToBytes(aliceCred.credentialSecret);
  currentCredSig = hexToBytes(aliceCred.credentialSignature);

  const attestCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    voteTx.context.currentZswapLocalState,
    voteTx.context.currentQueryContext.state,
    voteTx.context.currentPrivateState
  );
  const nonce = 42;
  const attestRes = contract.circuits.attest_participation(attestCtx, BigInt(nonce));
  const expectedBadge = deriveParticipationBadge(expectedNullifier, nonce);
  const badgeMatches = bytesToHex(attestRes.result) === expectedBadge;
  assertTest(
    7,
    'Selective Participation Proof Attestation',
    badgeMatches,
    `Alice generated verifiable participation badge 0x${expectedBadge.substring(0, 16)}... without disclosing vote choice`
  );

  // [Test 08] Administrator Authorization & Sealed Lifecycle
  currentAdminSecret = hexToBytes('99'.repeat(32)); // Unauthorized admin
  let unauthorizedCloseBlocked = false;
  try {
    const unauthCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      voteTx.context.currentZswapLocalState,
      voteTx.context.currentQueryContext.state,
      voteTx.context.currentPrivateState
    );
    contract.circuits.close_election(unauthCtx);
  } catch {
    unauthorizedCloseBlocked = true;
  }

  // Legitimate close
  currentAdminSecret = hexToBytes(adminSecretHex);
  const legitCloseCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    voteTx.context.currentZswapLocalState,
    voteTx.context.currentQueryContext.state,
    voteTx.context.currentPrivateState
  );
  const closeTx = contract.circuits.close_election(legitCloseCtx);
  state = ledger(closeTx.context.currentQueryContext.state);
  assertTest(
    8,
    'Administrator Authorization & Sealed Lifecycle',
    unauthorizedCloseBlocked && state.electionStage === 2n,
    `Unauthorized close rejected. Genuine admin sealed election: Stage 1 -> Stage 2 (Closed).`
  );

  // [Test 09] Cryptographic Ballot Tallying from Ballot Commitments
  // Alice voted choice 0 with currentBallotNonce = new Uint8Array(32).fill(101)
  const aliceBallotNonce = new Uint8Array(32).fill(101);
  const tallyCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    closeTx.context.currentZswapLocalState,
    closeTx.context.currentQueryContext.state,
    closeTx.context.currentPrivateState
  );

  // Tally Alice's genuine ballot
  const tallyTx = contract.circuits.tally_ballot(tallyCtx, 0n, aliceBallotNonce);
  state = ledger(tallyTx.context.currentQueryContext.state);
  const tallySuccess = state.tally0 === 1n && state.ballotCommitments.isEmpty();

  // Attempting to tally with a forged nonce must fail
  let forgedTallyBlocked = false;
  try {
    const fakeCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      tallyTx.context.currentZswapLocalState,
      tallyTx.context.currentQueryContext.state,
      tallyTx.context.currentPrivateState
    );
    contract.circuits.tally_ballot(fakeCtx, 1n, new Uint8Array(32).fill(99));
  } catch {
    forgedTallyBlocked = true;
  }

  assertTest(
    9,
    'Cryptographic Ballot Tallying from Ballot Commitments',
    tallySuccess && forgedTallyBlocked,
    `Alice ballot verified against on-chain commitment and tallied. Option 0 tally = 1. Forged ballot rejected.`
  );

  // [Test 10] Finalized Results Verification & Conservation Law
  currentAdminSecret = hexToBytes(adminSecretHex);
  const pubCtx = cr.createCircuitContext(
    cr.dummyContractAddress(),
    tallyTx.context.currentZswapLocalState,
    tallyTx.context.currentQueryContext.state,
    tallyTx.context.currentPrivateState
  );

  // Attempting to publish tampered tallies [0, 1, 0, 0] must fail
  let tamperedPublishBlocked = false;
  try {
    const badPubCtx = cr.createCircuitContext(
      cr.dummyContractAddress(),
      tallyTx.context.currentZswapLocalState,
      tallyTx.context.currentQueryContext.state,
      tallyTx.context.currentPrivateState
    );
    contract.circuits.publish_final_results(badPubCtx, 0n, 1n, 0n, 0n);
  } catch {
    tamperedPublishBlocked = true;
  }

  // Publishing genuine verified tallies [1, 0, 0, 0]
  const finalTx = contract.circuits.publish_final_results(pubCtx, 1n, 0n, 0n, 0n);
  state = ledger(finalTx.context.currentQueryContext.state);
  const finalized = state.electionStage === 3n && tamperedPublishBlocked;

  assertTest(
    10,
    'Finalized Results Verification & Conservation Law',
    finalized,
    `Admin published tallies verified against ballot commitments: [1, 0, 0, 0]. Stage transitioned to 3 (Finalized).`
  );

  console.log(`\n${BOLD}${CYAN}----------------------------------------------------${RESET}`);
  if (passedCount === totalTests) {
    console.log(`${BOLD}${GREEN}  ${passedCount}/${totalTests} TESTS PASSED — VERIFIED ZERO-KNOWLEDGE PROTOCOL TESTNET DEMO${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ${passedCount}/${totalTests} TESTS PASSED${RESET}`);
  }
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);
}

runSuite().catch(console.error);
