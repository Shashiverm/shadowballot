import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VotingPanel } from './components/VotingPanel';
import { ResultsView } from './components/ResultsView';
import { ParticipationProof } from './components/ParticipationProof';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { ContractInspector } from './components/ContractInspector';
import { WalletModal } from './components/WalletModal';
import { Footer } from './components/Footer';
import { Election, WalletState, VoterCredential, VoteReceipt, MidnightNetwork } from './lib/types';
import { INITIAL_ELECTIONS } from './lib/midnight';
import { getOrCreateVoterCredential } from './lib/crypto';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vote' | 'results' | 'proof' | 'organizer' | 'contract'>('vote');
  const [elections, setElections] = useState<Election[]>(INITIAL_ELECTIONS);
  const [selectedElectionId, setSelectedElectionId] = useState<number>(1);
  const [spentNullifiers, setSpentNullifiers] = useState<Set<string>>(new Set());
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [voterCred, setVoterCred] = useState<VoterCredential>(getOrCreateVoterCredential());

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

  // Check for Midnight Lace extension in window
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).midnight?.mnLace) {
      setWallet((prev) => ({ ...prev, isInstalled: true }));
    }
  }, []);

  const handleConnectLace = async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const mn = (window as any).midnight;
      if (mn && mn.mnLace) {
        const lace = mn.mnLace;
        const api = await lace.enable();
        const accounts = await api.getUnshieldedAddresses();
        const address = accounts[0] || '020088b901a1827cf482a1782e4f019a82001';
        setWallet({
          isConnected: true,
          isConnecting: false,
          isInstalled: true,
          address,
          balance: 2450,
          network: 'preprod',
          walletName: 'Midnight Lace Extension',
          isDevKeystore: false,
          error: null
        });
        setWalletModalOpen(false);
      } else {
        // Fallback to Dev Keystore if extension is not installed
        handleConnectDev();
      }
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Failed to connect Midnight Lace. Try the Dev Keystore.'
      }));
    }
  };

  const handleConnectDev = () => {
    setWallet({
      isConnected: true,
      isConnecting: false,
      isInstalled: true,
      address: '0200fa4e87a27d2c3882a939f3714b3d8819445eeea8910b8cf9ffca14d59a202a0b',
      balance: 15000,
      network: 'preprod',
      walletName: 'Midnight Dev Keystore',
      isDevKeystore: true,
      error: null
    });
    setWalletModalOpen(false);
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

  // When a vote is successfully cast
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

      {/* Hero Section */}
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className={`btn-primary ${activeTab === 'vote' ? 'active' : ''}`}
              onClick={() => setActiveTab('vote')}
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <span>🗳️ Enter Active Election</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('organizer')}
              style={{ padding: '12px 24px' }}
            >
              <span>🏛️ Create Proposal</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('proof')}
              style={{ padding: '12px 24px' }}
            >
              <span>🛡️ Verify Participation</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Active Elections</div>
              <div className="stat-value">{elections.length}</div>
              <div className="stat-detail">✓ 100% On-Chain Quorum Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Ballots Cast</div>
              <div className="stat-value">{totalBallots}</div>
              <div className="stat-detail">✓ Zero Identity Leaks</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ZK Prover Engine</div>
              <div className="stat-value">Halo2 / PLONK</div>
              <div className="stat-detail">✓ ~1.2s Local Proving Time</div>
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

      {/* Main Tab View */}
      <main>
        {activeTab === 'vote' && (
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
        )}

        {activeTab === 'results' && (
          <ResultsView
            elections={elections}
            selectedElectionId={selectedElectionId}
            onSelectElection={setSelectedElectionId}
            onNavigateVote={() => setActiveTab('vote')}
            onNavigateProof={() => setActiveTab('proof')}
          />
        )}

        {activeTab === 'proof' && (
          <ParticipationProof
            elections={elections}
            selectedElectionId={selectedElectionId}
            onSelectElection={setSelectedElectionId}
            voterCred={voterCred}
          />
        )}

        {activeTab === 'organizer' && (
          <OrganizerDashboard
            elections={elections}
            onCreateElection={handleCreateElection}
            onToggleStatus={handleToggleStatus}
            walletAddress={wallet.address}
          />
        )}

        {activeTab === 'contract' && <ContractInspector />}
      </main>

      <Footer />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onConnectLace={handleConnectLace}
        onConnectDev={handleConnectDev}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
      />
    </div>
  );
};
