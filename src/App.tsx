import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VotingPanel } from './components/VotingPanel';
import { ResultsView } from './components/ResultsView';
import { ParticipationProof } from './components/ParticipationProof';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { ContractInspector } from './components/ContractInspector';
import { WalletModal } from './components/WalletModal';
import { WalletGate } from './components/WalletGate';
import { Footer } from './components/Footer';
import { Election, WalletState, VoterCredential, VoteReceipt, MidnightNetwork } from './lib/types';
import { INITIAL_ELECTIONS } from './lib/midnight';
import { getOrCreateVoterCredential } from './lib/crypto';
import { connectInjectedWallet, connectMobileEnclave, discoverMidnightWallets } from './lib/wallet';

type PageTab = 'vote' | 'results' | 'proof' | 'organizer' | 'contract';

export const App: React.FC = () => {
  // Support clean pathname (/vote, /results, /proof, /organizer, /contract) and fallback hash
  const getTabFromLocation = (): PageTab => {
    if (typeof window === 'undefined') return 'vote';
    const cleanPath = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
    if (cleanPath === 'results' || cleanPath === 'proof' || cleanPath === 'organizer' || cleanPath === 'contract' || cleanPath === 'vote') {
      return cleanPath === 'vote' ? 'vote' : (cleanPath as PageTab);
    }
    const cleanHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (cleanHash === 'results' || cleanHash === 'proof' || cleanHash === 'organizer' || cleanHash === 'contract' || cleanHash === 'vote') {
      return cleanHash === 'vote' ? 'vote' : (cleanHash as PageTab);
    }
    return 'vote';
  };

  const [activeTab, setActiveTabState] = useState<PageTab>(getTabFromLocation);
  const [elections, setElections] = useState<Election[]>(INITIAL_ELECTIONS);
  const [selectedElectionId, setSelectedElectionId] = useState<number>(1);
  const [spentNullifiers, setSpentNullifiers] = useState<Set<string>>(new Set());
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [voterCred] = useState<VoterCredential>(getOrCreateVoterCredential());

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    isInstalled: false,
    address: '',
    balance: 0,
    network: 'preprod',
    walletName: '',
    isDevKeystore: false,
    error: null
  });

  // Multipage routing via HTML5 History API (no dirty # hashes)
  const setActiveTab = (tab: PageTab) => {
    setActiveTabState(tab);
    const targetPath = tab === 'vote' ? '/vote' : `/${tab}`;
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route redirection and popstate listener
  useEffect(() => {
    const currentTab = getTabFromLocation();
    const targetPath = currentTab === 'vote' ? '/vote' : `/${currentTab}`;

    // Clean up hash or bare '/' into proper multipage path
    if (window.location.hash || window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState(null, '', targetPath);
    }

    const handleLocationChange = () => {
      setActiveTabState(getTabFromLocation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Detect Midnight Lace extension
  useEffect(() => {
    const detected = discoverMidnightWallets();
    if (detected.length > 0) {
      setWallet((prev) => ({ ...prev, isInstalled: true }));
    }
  }, []);

  const handleConnectInjected = async (walletId?: string) => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const connectedState = await connectInjectedWallet(walletId, wallet.network);
      setWallet(connectedState);
      setWalletModalOpen(false);
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to connect Midnight Lace. Try the Mobile Enclave.'
      }));
    }
  };

  const handleConnectMobileOrEnclave = async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const connectedState = await connectMobileEnclave(wallet.network);
      setWallet(connectedState);
      setWalletModalOpen(false);
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to initialize device enclave.'
      }));
    }
  };

  const handleDisconnect = () => {
    setWallet({
      isConnected: false,
      isConnecting: false,
      isInstalled: wallet.isInstalled,
      address: '',
      balance: 0,
      network: 'preprod',
      walletName: '',
      isDevKeystore: false,
      error: null
    });
    setWalletModalOpen(false);
  };

  const handleSwitchNetwork = (network: MidnightNetwork) => {
    setWallet((prev) => ({ ...prev, network }));
  };

  const handleVoteSuccess = (electionId: number, optionId: number, receipt: VoteReceipt) => {
    setSpentNullifiers((prev) => {
      const next = new Set(prev);
      next.add(receipt.nullifierHash.replace('0x', ''));
      return next;
    });

    setElections((prev) =>
      prev.map((el) => {
        if (el.id !== electionId) return el;
        const updatedOptions = el.options.map((opt) =>
          opt.id === optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt
        );
        return {
          ...el,
          totalVotes: el.totalVotes + 1,
          options: updatedOptions
        };
      })
    );
  };

  const handleCreateElection = (newElData: Omit<Election, 'id'>) => {
    const newId = elections.length + 1;
    const created: Election = {
      ...newElData,
      id: newId,
      creatorAddress: wallet.address || newElData.creatorAddress
    };
    setElections((prev) => [created, ...prev]);
    setSelectedElectionId(newId);
    setActiveTab('organizer');
  };

  const handleToggleStatus = (electionId: number) => {
    setElections((prev) =>
      prev.map((el) => {
        if (el.id !== electionId) return el;
        // Strict Role-Based Permission: Only creator can seal or modify proposal
        if (wallet.address && el.creatorAddress && el.creatorAddress.toLowerCase() !== wallet.address.toLowerCase()) {
          alert(`Permission Denied: Only the verified creator (${el.creatorAddress}) has signature authority to modify this proposal.`);
          return el;
        }
        return { ...el, status: el.status === 'active' ? 'closed' : 'active' };
      })
    );
  };

  const totalBallots = elections.reduce((sum, e) => sum + e.totalVotes, 0);

  return (
    <div className="app-root">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        onOpenWallet={() => setWalletModalOpen(true)}
        onSwitchNetwork={handleSwitchNetwork}
      />

      {/* Role Navigation Ribbon: Each role has their own distinct workspace */}
      <div className="role-bar-container">
        <div className="container role-bar">
          <span className="role-label-txt">Choose Role:</span>
          <button
            className={`role-pill ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => setActiveTab('vote')}
          >
            <span>🗳️</span> Voter Portal
            <span className="role-duty-badge">Cast Ballot</span>
          </button>
          <button
            className={`role-pill ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <span>📊</span> Public Observer
            <span className="role-duty-badge">Live Tallies</span>
          </button>
          <button
            className={`role-pill ${activeTab === 'proof' ? 'active' : ''}`}
            onClick={() => setActiveTab('proof')}
          >
            <span>🛡️</span> Voter Attestation
            <span className="role-duty-badge">ZK Proofs</span>
          </button>
          <button
            className={`role-pill ${activeTab === 'organizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizer')}
          >
            <span>🏛️</span> Organizer Console
            <span className="role-duty-badge">Governance</span>
          </button>
          <button
            className={`role-pill ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            <span>🔍</span> Auditor Inspector
            <span className="role-duty-badge">Circuits & Ledger</span>
          </button>
        </div>
      </div>

      {/* Role Work Header Banner */}
      <div className="page-role-header">
        <div className="container page-role-header-inner">
          <div>
            <div className="role-tag-box">
              {activeTab === 'vote' && '👤 Role: Confidential Voter'}
              {activeTab === 'results' && '🌐 Role: Public Observer (Open Access)'}
              {activeTab === 'proof' && '🛡️ Role: Voter Attestation & Proofs'}
              {activeTab === 'organizer' && '🏛️ Role: Election Official & DAO Admin'}
              {activeTab === 'contract' && '🔍 Role: Independent Cryptographer & Auditor'}
            </div>
            <h2 className="page-role-title">
              {activeTab === 'vote' && 'Confidential Voting Portal'}
              {activeTab === 'results' && 'Decentralized Live Tally Observer'}
              {activeTab === 'proof' && 'Selective Disclosure & Participation Proof'}
              {activeTab === 'organizer' && 'Election Administration & Quorum Hub'}
              {activeTab === 'contract' && 'Midnight Contract & ZKIR Bytecode Inspector'}
            </h2>
            <p className="page-role-desc">
              {activeTab === 'vote' && 'Synthesize client-side PLONK zero-knowledge proofs. Your voter identity is cryptographically isolated from your cast ballot.'}
              {activeTab === 'results' && 'Monitor verified on-chain ballot counts in real-time. Publicly accessible to anyone on the web without connecting a wallet.'}
              {activeTab === 'proof' && 'Generate cryptographic attestation badges proving you participated in an election without revealing which candidate you selected.'}
              {activeTab === 'organizer' && 'Deploy confidential proposals, define ballot candidates, set voter whitelists, and finalize elections on the Midnight consensus ledger.'}
              {activeTab === 'contract' && 'Audit the Compact 0.23 smart contract rules, inspect compiled ZKIR circuits, and verify nullifier trees for zero double-voting.'}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="stat-card" style={{ padding: '10px 16px', minWidth: '140px' }}>
              <div className="stat-label">Active Proposals</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{elections.length}</div>
            </div>
            <div className="stat-card" style={{ padding: '10px 16px', minWidth: '140px' }}>
              <div className="stat-label">Total Votes Cast</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{totalBallots}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section: Rendered on Vote page to welcome voters */}
      {activeTab === 'vote' && (
        <header className="hero" style={{ paddingTop: '10px', paddingBottom: '30px' }}>
          <div className="container">
            {/* Privacy Matrix: Half Light, Half Shadow */}
            <div className="privacy-banner">
              <div className="privacy-grid">
                <div className="privacy-col shadow">
                  <div className="col-header shadow-title">
                    <span>🌑 SHADOW (Client-Side Off-Chain / Shielded)</span>
                  </div>
                  <ul className="privacy-list">
                    <li className="privacy-item">
                      <span className="item-badge badge-shielded">Voter Identity</span>
                      <span>Never transmitted or revealed to consensus</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-shielded">Ballot Choice</span>
                      <span>Witness memory only; zero raw choice on ledger</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-shielded">Voter Secret</span>
                      <span>Kept in browser enclave to derive nullifiers</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-shielded">Eligibility Flag</span>
                      <span>Proven in ZK circuit without disclosing credential</span>
                    </li>
                  </ul>
                </div>

                <div className="privacy-col light">
                  <div className="col-header light-title">
                    <span>🌕 LIGHT (Midnight Ledger / Deliberately Disclosed)</span>
                  </div>
                  <ul className="privacy-list">
                    <li className="privacy-item">
                      <span className="item-badge badge-public">Election Options</span>
                      <span>Public ballot metadata and voting window</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-public">Spent Nullifiers</span>
                      <span>Unique commitment preventing double-voting</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-public">Aggregate Tallies</span>
                      <span>Option counters publicly verifiable by everyone</span>
                    </li>
                    <li className="privacy-item">
                      <span className="item-badge badge-public">ZK Verification</span>
                      <span>Proof validity confirmed by Midnight consensus</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Pages with Security Gating */}
      <main>
        {/* Tab 1: Cast Vote — Strictly Gated behind Wallet */}
        {activeTab === 'vote' && (
          wallet.isConnected ? (
            <VotingPanel
              elections={elections}
              selectedElectionId={selectedElectionId}
              onSelectElection={setSelectedElectionId}
              wallet={wallet}
              voterCred={voterCred}
              spentNullifiers={spentNullifiers}
              onVoteSuccess={handleVoteSuccess}
              onNavigateResults={() => setActiveTab('results')}
              onNavigateProof={() => setActiveTab('proof')}
            />
          ) : (
            <WalletGate
              actionName="Cast Your Confidential Ballot"
              actionDescription="To guarantee one-person-one-vote and derive your cryptographic nullifier, you must connect an authorized Midnight wallet or mobile device enclave"
              onConnect={() => setWalletModalOpen(true)}
              onViewResults={() => setActiveTab('results')}
            />
          )
        )}

        {/* Tab 2: Live Results — PUBLICLY VIEWABLE WITHOUT WALLET */}
        {activeTab === 'results' && (
          <ResultsView
            elections={elections}
            selectedElectionId={selectedElectionId}
            onSelectElection={setSelectedElectionId}
            onNavigateVote={() => setActiveTab('vote')}
            onNavigateProof={() => setActiveTab('proof')}
          />
        )}

        {/* Tab 3: Participation Proof — Gated behind Wallet */}
        {activeTab === 'proof' && (
          wallet.isConnected ? (
            <ParticipationProof
              elections={elections}
              selectedElectionId={selectedElectionId}
              onSelectElection={setSelectedElectionId}
              voterCred={voterCred}
            />
          ) : (
            <WalletGate
              actionName="Generate Proof of Participation"
              actionDescription="A cryptographic participation badge proves you cast a ballot in the election without revealing your identity or choice, requiring local wallet witness access"
              onConnect={() => setWalletModalOpen(true)}
              onViewResults={() => setActiveTab('results')}
            />
          )
        )}

        {/* Tab 4: Organizer Hub — Gated behind Wallet */}
        {activeTab === 'organizer' && (
          wallet.isConnected ? (
            <OrganizerDashboard
              elections={elections}
              onCreateElection={handleCreateElection}
              onToggleStatus={handleToggleStatus}
              walletAddress={wallet.address}
              wallet={wallet}
            />
          ) : (
            <WalletGate
              actionName="Create or Manage Proposals"
              actionDescription="Election organizers must sign proposal deployment transactions with their Midnight wallet"
              onConnect={() => setWalletModalOpen(true)}
              onViewResults={() => setActiveTab('results')}
            />
          )
        )}

        {/* Tab 5: Contract Inspector — PUBLICLY VIEWABLE */}
        {activeTab === 'contract' && <ContractInspector />}
      </main>

      <Footer onNavigate={setActiveTab} network={wallet.network} />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onConnectInjected={handleConnectInjected}
        onConnectMobileOrEnclave={handleConnectMobileOrEnclave}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
      />
    </div>
  );
};
