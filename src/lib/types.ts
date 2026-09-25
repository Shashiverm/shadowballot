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
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
  dustAddress?: string;
  balance: number;
  dustBalance?: bigint;
  dustCap?: bigint;
  network: MidnightNetwork;
  walletName: string;
  rdns?: string;
  apiVersion?: string;
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

export interface CircuitVerificationInfo {
  name: string;
  zkirHash: string;
  verifierKeyHash: string;
  proverKeyHash: string;
  sizeBytes: number;
}

export interface ContractVerificationEvidence {
  contractAddress: string;
  networkId: MidnightNetwork;
  compactVersion: string;
  compilerVersion: string;
  deploymentTx: string;
  blockHeight: number;
  blockHash: string;
  sourceCodeHash: string;
  circuitZkirHash: string;
  verifierKeyHash: string;
  circuits: CircuitVerificationInfo[];
  deployedBytecodeMatched: boolean;
  verifiedAt: string;
  publicLedgerFields: string[];
  explorerUrl: string;
  indexerUrl: string;
  proofServerUrl: string;
}
