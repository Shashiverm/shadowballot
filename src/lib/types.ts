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
  balance: number;
  network: MidnightNetwork;
  walletName: string;
  isDevKeystore: boolean;
  error: string | null;
}

export interface VoterCredential {
  secret: string;
  voterId: string;
  publicCommitment: string;
  isEligible: boolean;
}

export interface VoteReceipt {
  txHash: string;
  nullifierHash: string;
  electionId: number;
  timestamp: string;
  blockHeight: number;
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
