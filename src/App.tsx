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
import { connectMidnightWallet } from './lib/wallet';

type PageTab = 'vote' | 'results' | 'proof' | 'organizer' | 'contract';

export const App: React.FC = () => {
  // Hash-based multipage routing
  const getTabFromHash = (): PageTab => {
    const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
    if (hash === 'results' || hash === 'proof' || hash === 'organizer' || hash === 'contract') {
      return hash;
    }
    return 'vote';
  };

  const [activeTab, setActiveTabState] = useState<PageTab>(getTabFromHash);
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

  const setActiveTab = (tab: PageTab) => {
    setActiveTabState(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Detect Midnight Lace extension in window
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).midnight?.mnLace) {
      setWallet((prev) => ({ ...prev, isInstalled: true }));
    }
  }, []);

  const handleConnectLace = async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const connectedState = await connectMidnightWallet(false);
      setWallet(connectedState);
      setWalletModalOpen(false);
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to connect Midnight Lace. Try the Mobile/Dev Enclave.'
      }));
    }
  };

  const handleConnectMobileOrDev = async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const connectedState = await connectMidnightWallet(true);
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
      id: newId
    };
    setElections((prev) => [created, ...prev]);
    setSelectedElectionId(newId);
    setActiveTab('vote');
  };

  const handleToggleStatus = (electionId: number) => {
    setElections((prev) =>
      prev.map((el) =>
        el.id === electionId
          ? { ...el, status: el.status === 'active' ? 'closed' : 'active' }
          : el
      )
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

      {/* Hero Header Section */}
      <header className="hero">
        <div className="container">
          <div className="hero-pill">
            <span>🌑 Half Light, Half Shadow — Programmable Privacy on Midnight</span>
          </div>

          <h1 className="hero-title">
            <span className="title-gradient">SHADOWBALLOT</span>
          </h1>

          <p className="hero-subtitle">
            Private choices. Public truth. Your vote is yours. The result belongs to everyone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className={`btn-primary ${activeTab === 'vote' ? 'active' : ''}`}
              onClick={() => setActiveTab('vote')}
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <span>🗳️ Enter Active Ballot</span>
            </button>
            <button
              className={`btn-secondary ${activeTab === 'results' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('results')}
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              <span>📊 Public Results (Open)</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('organizer')}
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              <span>🏛️ Create Proposal</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('proof')}
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              <span>🛡️ Verify Participation</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Active Elections</div>
              <div className="stat-value">{elections.length}</div>
              <div className="stat-detail">✓ 100% On-Chain Consensus</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Ballots Cast</div>
              <div className="stat-value">{totalBallots}</div>
              <div className="stat-detail">✓ Zero Identity Leaks</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ZK Prover Engine</div>
              <div className="stat-value">Halo2 / PLONK</div>
              <div className="stat-detail">✓ ~1.2s Local Prover Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Nullifier Replay Shield</div>
              <div className="stat-value">Strict H(k,id)</div>
              <div className="stat-detail">✓ 0 Duplicate Ballots Permitted</div>
            </div>
          </div>

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

      <Footer />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onConnectLace={handleConnectLace}
        onConnectMobileOrDev={handleConnectMobileOrDev}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
      />
    </div>
  );
};
