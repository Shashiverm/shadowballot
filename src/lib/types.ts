export type MidnightNetwork = 'preprod' | 'preview';

export interface BallotOption {
  id: number;
  label: string;
  description: string;
  voteCount: number;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'closed';
  options: BallotOption[];
  totalVotes: number;
  startDate: string;
  endDate: string;
  creatorAddress: string;
  contractAddress: string;
  quorum: number;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isInstalled: boolean;
  address: string;
  shieldedAddress?: string;
  balance: number;
  dustBalance?: bigint;
  network: MidnightNetwork;
  walletName: string;
  isDevKeystore: boolean;
  error: string | null;
  dappApiInstance?: any;
}

export interface VoterCredential {
  secret: string;
  voterId: string;
  publicCommitment: string;
  isEligible: boolean;
}

export interface VoteReceipt {
  txId: string;
  txHash: string;
  nullifierHash: string;
  electionId: number;
  timestamp: string;
  blockHeight: number;
  blockHash?: string;
  status: string;
  contractAddress: string;
  networkId: MidnightNetwork;
  proofTimeMs: number;
  zkCircuit: string;
}

export interface ParticipationAttestation {
  attestationId: string;
  electionId: number;
  electionTitle: string;
  proofHash: string;
  issuedAt: string;
  circuitSignature: string;
  selectiveDisclosureClaim: string;
}

export interface ContractVerificationEvidence {
  contractAddress: string;
  networkId: MidnightNetwork;
  compactVersion: string;
  compilerVersion: string;
  sourceCodeHash: string;
  circuitZkirHash: string;
  verifierKeyHash: string;
  deployedBytecodeMatched: boolean;
  verifiedAt: string;
  circuits: string[];
  publicLedgerFields: string[];
}
