import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  get_voter_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_credential_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_credential_signature(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_vote_choice(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_ballot_nonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_admin_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>,
                      newElectionId_0: Uint8Array,
                      initialEligibilityRoot_0: Uint8Array,
                      adminCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publish_final_results(context: __compactRuntime.CircuitContext<PS>,
                        r0_0: bigint,
                        r1_0: bigint,
                        r2_0: bigint,
                        r3_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  attest_participation(context: __compactRuntime.CircuitContext<PS>,
                       electionNonce_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>,
                      newElectionId_0: Uint8Array,
                      initialEligibilityRoot_0: Uint8Array,
                      adminCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publish_final_results(context: __compactRuntime.CircuitContext<PS>,
                        r0_0: bigint,
                        r1_0: bigint,
                        r2_0: bigint,
                        r3_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  attest_participation(context: __compactRuntime.CircuitContext<PS>,
                       electionNonce_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>,
                      newElectionId_0: Uint8Array,
                      initialEligibilityRoot_0: Uint8Array,
                      adminCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publish_final_results(context: __compactRuntime.CircuitContext<PS>,
                        r0_0: bigint,
                        r1_0: bigint,
                        r2_0: bigint,
                        r3_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  attest_participation(context: __compactRuntime.CircuitContext<PS>,
                       electionNonce_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly electionId: Uint8Array;
  readonly eligibilityRoot: Uint8Array;
  readonly adminKey: Uint8Array;
  readonly electionStage: bigint;
  readonly totalVotes: bigint;
  readonly tally0: bigint;
  readonly tally1: bigint;
  readonly tally2: bigint;
  readonly tally3: bigint;
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  ballotCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
