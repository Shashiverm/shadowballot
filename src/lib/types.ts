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
  status: 'active' | 'closed' | 'finalized';
  options: BallotOption[];
  totalVotes: number;
  startDate: string;
  endDate: string;
  creatorAddress: string;
  contractAddress: string;
  quorum: number;
  eligibilityRoot?: string;
  adminKey?: string;
  adminSecret?: string;
  electionStage?: number; // 1 = Active, 2 = Closed, 3 = Finalized
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
  secret: string;              // 32-byte voter secret key
  credentialSecret: string;    // 32-byte private credential secret
  credentialSignature: string; // 32-byte issuer signature / auth code
  voterId: string;             // Public pseudonym
  publicCommitment: string;    // H(secret + credentialSecret)
  authorityRoot: string;       // Matches election eligibilityRoot
  isEligible: boolean;
  issuedAt?: string;
}

export interface VoteReceipt {
  txId: string;
  txHash: string;
  nullifierHash: string;
  ballotCommitment?: string;
  electionId: number;
  timestamp: string;
  blockHeight: number;
  blockHash?: string;
  status: string;
  contractAddress: string;
  networkId: MidnightNetwork;
  proofTimeMs: number;
  zkCircuit: string;
  choiceShielded: boolean;
}

export interface ParticipationAttestation {
  attestationId: string;
  electionId: number;
  electionTitle: string;
  nullifier: string;
  attestationBadge: string;
  proofHash: string;
  issuedAt: string;
  contractAddress: string;
  circuitSignature: string;
  selectiveDisclosureClaim: string;
  verifiedOnChain: boolean;
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
