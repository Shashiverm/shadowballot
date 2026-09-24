import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  get_voter_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_vote_choice(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_voter_eligibility(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>,
                    disclosedNullifier_0: Uint8Array,
                    optionChoice_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  attest_participation(context: __compactRuntime.CircuitContext<PS>,
                       electionNonce_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>,
                    disclosedNullifier_0: Uint8Array,
                    optionChoice_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  initialize_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  cast_private_vote(context: __compactRuntime.CircuitContext<PS>,
                    disclosedNullifier_0: Uint8Array,
                    optionChoice_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  attest_participation(context: __compactRuntime.CircuitContext<PS>,
                       electionNonce_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_election(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly electionActive: bigint;
  readonly totalVotes: bigint;
  readonly tally0: bigint;
  readonly tally1: bigint;
  readonly tally2: bigint;
  readonly tally3: bigint;
  readonly nullifiers: Set<string>;
  readonly lastNullifier?: Uint8Array;
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
