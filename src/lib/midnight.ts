import { Election } from './types';

export const MIDNIGHT_CONFIG = {
  contractAddress: '02009c8b7f14e3d65a8820c741e2b5894f09d84e1b8c63479ae7a52cd48911f93e2a',
  deploymentTx: '0x3f98a21d4c728e10b4f8812c3e4599a0b1297e6840d2811a7e4e1a0b3f5c7198',
  network: 'Midnight Preprod',
  networkId: 'preprod',
  explorerUrl: 'https://explorer.preprod.midnight.network',
  proofServerUrl: 'https://proof-server.preprod.midnight.network',
  indexerUrl: 'https://indexer.preprod.midnight.network',
  compactVersion: '0.23.0',
  compiler: 'compact 0.5.2',
  provingSystem: 'PLONK / Halo2 ZK-SNARK'
};

export const INITIAL_ELECTIONS: Election[] = [
  {
    id: 1,
    title: 'Midnight Developer Priorities Proposal 01',
    description: 'Determine community priority for core protocol developer tooling and ecosystem infrastructure in Q4 2026.',
    category: 'Protocol Governance',
    status: 'active',
    totalVotes: 124,
    startDate: '2026-09-10',
    endDate: '2026-09-24',
    creatorAddress: '020088b901a1827cf482a1782e4f019a82001',
    contractAddress: MIDNIGHT_CONFIG.contractAddress,
    quorum: 100,
    options: [
      {
        id: 0,
        label: 'Privacy Protocols & Shielded State',
        description: 'Advanced recursive SNARKs, multi-party private state transitions, and custom ZK gadgets.',
        voteCount: 52
      },
      {
        id: 1,
        label: 'Developer Tooling & TypeScript SDKs',
        description: 'Next-gen Compact IDE extensions, local prover browser packages, and automated mock ledger tools.',
        voteCount: 38
      },
      {
        id: 2,
        label: 'Community Grants & Ecosystem Incubation',
        description: 'Direct builder funding for private DeFi, confidential voting, and encrypted messaging dApps.',
        voteCount: 21
      },
      {
        id: 3,
        label: 'Cross-Chain Interoperability Bridges',
        description: 'ZK light client state relayers connecting Midnight confidential states to Cardano and EVM networks.',
        voteCount: 13
      }
    ]
  },
  {
    id: 2,
    title: 'Zero-Knowledge Proof Server Decentralization',
    description: 'Vote on migrating community proof generation nodes to an incentivized stake-weighted decentralized relayer pool.',
    category: 'Infrastructure',
    status: 'active',
    totalVotes: 86,
    startDate: '2026-09-12',
    endDate: '2026-09-28',
    creatorAddress: '0200fa4e87a27d2c3882a939f3714b3d8819445e',
    contractAddress: MIDNIGHT_CONFIG.contractAddress,
    quorum: 80,
    options: [
      {
        id: 0,
        label: 'Incentivized Relayer Stake Pool',
        description: 'Open node registration with bonded security deposits and proving reward distribution.',
        voteCount: 47
      },
      {
        id: 1,
        label: 'Hybrid Client Proving First',
        description: 'Enforce in-browser proving by default with fallback to federated zero-knowledge provers.',
        voteCount: 29
      },
      {
        id: 2,
        label: 'Maintain Current Preprod Cluster',
        description: 'Keep managed infrastructure until mainnet genesis.',
        voteCount: 10
      },
      {
        id: 3,
        label: 'Abstain / Further Discussion',
        description: 'Return proposal to the technical architecture committee for additional benchmarks.',
        voteCount: 0
      }
    ]
  }
];
