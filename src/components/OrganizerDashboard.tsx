import React, { useState } from 'react';
import { Election, WalletState } from '../lib/types';
import { MIDNIGHT_CONFIG, MIDNIGHT_NETWORKS, executeDeployBallotContract } from '../lib/midnight';

interface OrganizerDashboardProps {
  elections: Election[];
  onCreateElection: (newElection: Omit<Election, 'id'>) => void;
  onCloseElection: (electionId: number) => Promise<void>;
  onPublishResults: (electionId: number) => Promise<void>;
  walletAddress: string;
  wallet?: WalletState;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  elections,
  onCreateElection,
  onCloseElection,
  onPublishResults,
  walletAddress,
  wallet
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Protocol Governance');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [quorum, setQuorum] = useState('50');
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  // Publish Results Modal State
  const [publishElectionId, setPublishElectionId] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const truncate = (str: string) => {
    if (!str || str.length <= 14) return str;
    return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
  };

  const isOwner = (el: Election) => {
    if (!walletAddress) return false;
    return el.creatorAddress.toLowerCase() === walletAddress.toLowerCase();
  };

  const myCount = elections.filter(isOwner).length;
  const displayedElections = filter === 'my' ? elections.filter(isOwner) : elections;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !opt0 || !opt1 || !opt2 || !opt3) {
      alert('Please fill all fields including 4 ballot options');
      return;
    }

    if (!walletAddress || !wallet?.isConnected) {
      alert('Wallet Required: Connect an authorized Midnight DApp Connector wallet (such as Midnight Lace) to sign and deploy the smart contract on Midnight consensus.');
      return;
    }

    setIsDeploying(true);
    setDeployStep('Initializing Midnight contract deployment pipeline...');

    try {
      const deployResult = await executeDeployBallotContract(
        wallet,
        {
          title,
          description,
          category,
          quorum: parseInt(quorum) || 50,
          options: [opt0, opt1, opt2, opt3]
        },
        (step) => setDeployStep(step)
      );

      onCreateElection({
        title,
        description,
        category,
        status: 'active',
        electionStage: 1,
        totalVotes: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        creatorAddress: walletAddress,
        contractAddress: deployResult.contractAddress,
        quorum: parseInt(quorum) || 50,
        adminSecret: deployResult.adminSecret,
        adminKey: deployResult.adminKey,
        eligibilityRoot: deployResult.eligibilityRoot,
        options: [
          { id: 0, label: opt0, description: 'Option 1 selection', voteCount: 0 },
          { id: 1, label: opt1, description: 'Option 2 selection', voteCount: 0 },
          { id: 2, label: opt2, description: 'Option 3 selection', voteCount: 0 },
          { id: 3, label: opt3, description: 'Option 4 selection', voteCount: 0 }
        ]
      });

      // Reset form
      setTitle('');
      setDescription('');
      setOpt0('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setIsCreating(false);
    } catch (err: any) {
      alert(`Contract Deployment Failed: ${err?.message || err}`);
    } finally {
      setIsDeploying(false);
      setDeployStep('');
    }
  };

  const handleOpenPublish = (el: Election) => {
    setPublishElectionId(el.id);
    setPublishError(null);
  };

  const handleExecutePublish = async () => {
    if (!publishElectionId) return;
    const el = elections.find((e) => e.id === publishElectionId);
    if (!el) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      await onPublishResults(publishElectionId);
      setPublishElectionId(null);
    } catch (err: any) {
      setPublishError(err?.message || 'Failed to publish results to Midnight contract.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Dashboard Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div className="hero-pill" style={{ marginBottom: '8px' }}>
            <span>🏛️ Election Authority Console</span>
          </div>
          <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
            Governance Administration & Quorum Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deploy verifiable Compact voting contracts, configure eligibility roots, and execute irreversible election lifecycle controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`btn-secondary ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
            style={{ fontSize: '0.85rem' }}
          >
            All Proposals ({elections.length})
          </button>
          <button
            className={`btn-secondary ${filter === 'my' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('my')}
            style={{ fontSize: '0.85rem' }}
          >
            My Admin Proposals ({myCount})
          </button>
          <button
            className="btn-primary"
            onClick={() => setIsCreating(true)}
            style={{ fontSize: '0.85rem' }}
          >
            <span>+ Deploy New Election</span>
          </button>
        </div>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--violet-light)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '1.4rem', color: '#ffffff' }}>
              Deploy Confidential Election to Midnight Consensus
            </h3>
            <button className="btn-ghost" onClick={() => setIsCreating(false)}>✕ Close</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                PROPOSAL TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Developer Priorities Proposal 02"
                required
                style={{
                  width: '100%',
                  background: '#07090e',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '12px 14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                GOVERNANCE CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: '#07090e',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '12px 14px'
                }}
              >
                <option value="Protocol Governance">Protocol Governance</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Treasury & Grants">Treasury & Grants</option>
                <option value="Security & Audits">Security & Audits</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                PROPOSAL DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed rationale for this vote..."
                rows={3}
                required
                style={{
                  width: '100%',
                  background: '#07090e',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '12px 14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  OPTION 0 (INDEX 0)
                </label>
                <input
                  type="text"
                  value={opt0}
                  onChange={(e) => setOpt0(e.target.value)}
                  placeholder="Option 1"
                  required
                  style={{ width: '100%', background: '#07090e', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#ffffff', padding: '10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  OPTION 1 (INDEX 1)
                </label>
                <input
                  type="text"
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  placeholder="Option 2"
                  required
                  style={{ width: '100%', background: '#07090e', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#ffffff', padding: '10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  OPTION 2 (INDEX 2)
                </label>
                <input
                  type="text"
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  placeholder="Option 3"
                  required
                  style={{ width: '100%', background: '#07090e', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#ffffff', padding: '10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  OPTION 3 (INDEX 3)
                </label>
                <input
                  type="text"
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  placeholder="Option 4"
                  required
                  style={{ width: '100%', background: '#07090e', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#ffffff', padding: '10px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                QUORUM THRESHOLD (MINIMUM VOTES)
              </label>
              <input
                type="number"
                value={quorum}
                onChange={(e) => setQuorum(e.target.value)}
                min="1"
                required
                style={{ width: '140px', background: '#07090e', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#ffffff', padding: '10px' }}
              />
            </div>

            {isDeploying && (
              <div style={{ color: 'var(--violet-light)', fontSize: '0.88rem', fontWeight: 600 }}>
                ⏳ {deployStep}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isDeploying}
                style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              >
                {isDeploying ? 'Deploying to Midnight...' : 'Confirm & Deploy Contract'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCreating(false)}
                disabled={isDeploying}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publish Results Modal */}
      {publishElectionId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--violet-light)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%'
          }}>
            <h3 className="font-display" style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
              Publish Final Verified Results
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              The <code>publish_final_results</code> circuit enforces cryptographic conservation: the sum of the 4 option tallies must exactly equal the total votes recorded on-chain.
            </p>

            {publishError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {publishError}
              </div>
            )}

            {(() => {
              const publishElection = elections.find((e) => e.id === publishElectionId);
              if (!publishElection) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                    ON-CHAIN DERIVED TALLIES (VERIFIED VIA TALLY_BALLOT):
                  </div>
                  {publishElection.options.map((opt, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 500 }}>
                        Option {idx}: {opt.label}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--violet-light)', fontWeight: 600 }}>
                        {opt.voteCount} votes
                      </span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '10px',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>Total Recorded Votes:</span>
                    <span className="font-mono" style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 700 }}>
                      {publishElection.totalVotes}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => setPublishElectionId(null)}
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleExecutePublish}
                disabled={isPublishing}
              >
                {isPublishing ? 'Sealing Finalized Tallies...' : 'Irreversibly Finalize Election'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayedElections.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            No proposals found matching filter.
          </div>
        ) : (
          displayedElections.map((el) => {
            const userOwnsThis = isOwner(el);
            const isActive = el.status === 'active';
            const isClosed = el.status === 'closed';
            const isFinalized = el.status === 'finalized';

            return (
              <div
                key={el.id}
                style={{
                  background: 'var(--bg-card)',
                  border: userOwnsThis ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="category-tag">{el.category}</span>
                    <span className={`status-pill ${isActive ? 'status-active' : 'status-closed'}`}>
                      {isActive ? '● Open for Voting' : isClosed ? '■ Ballot Box Sealed' : '✓ Results Finalized'}
                    </span>
                    {userOwnsThis ? (
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: 'var(--violet-light)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        👑 Created by You (Full Admin Authority)
                      </span>
                    ) : (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        🔒 Creator: {truncate(el.creatorAddress)} (Read-Only)
                      </span>
                    )}
                  </div>
                  <h4 className="font-display" style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '4px' }}>
                    {el.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total Verified Votes: <strong style={{ color: 'var(--violet-light)' }}>{el.totalVotes}</strong> | Quorum: {el.quorum} | Window: {el.startDate} to {el.endDate}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const manifest = {
                        protocol: 'ShadowBallot Confidential Voting',
                        contractAddress: el.contractAddress || MIDNIGHT_CONFIG.contractAddress,
                        deploymentTx: MIDNIGHT_CONFIG.deploymentTx,
                        electionId: el.id,
                        title: el.title,
                        category: el.category,
                        status: el.status,
                        stage: el.electionStage || (isActive ? 1 : isClosed ? 2 : 3),
                        creatorAddress: el.creatorAddress,
                        adminKey: el.adminKey,
                        eligibilityRoot: el.eligibilityRoot,
                        totalVerifiedVotes: el.totalVotes,
                        quorumThreshold: el.quorum,
                        quorumAchieved: el.totalVotes >= el.quorum,
                        options: el.options,
                        startDate: el.startDate,
                        endDate: el.endDate,
                        nullifierStorage: 'Set<Bytes<32>>',
                        ballotStorage: 'Set<Bytes<32>>',
                        exportedAt: new Date().toISOString()
                      };
                      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `shadowballot_manifest_election_${el.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{ fontSize: '0.82rem' }}
                  >
                    📜 Export Audit Manifest (JSON)
                  </button>

                  {userOwnsThis ? (
                    <>
                      {isActive && (
                        <button
                          className="btn-secondary"
                          onClick={() => onCloseElection(el.id)}
                          style={{
                            fontSize: '0.82rem',
                            borderColor: 'rgba(244, 63, 94, 0.4)',
                            color: '#f43f5e'
                          }}
                        >
                          🔒 Irreversibly Seal Ballot Box
                        </button>
                      )}

                      {isClosed && (
                        <button
                          className="btn-primary"
                          onClick={() => handleOpenPublish(el)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          📊 Publish Final Verified Results
                        </button>
                      )}

                      {isFinalized && (
                        <span style={{
                          fontSize: '0.82rem',
                          color: '#34d399',
                          fontWeight: 600,
                          padding: '6px 12px',
                          background: 'rgba(52, 211, 153, 0.1)',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          borderRadius: '8px'
                        }}>
                          ✓ Results Finalized on Consensus
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn-secondary"
                      disabled
                      title={`Only the creator of this proposal (${el.creatorAddress}) has signature authority.`}
                      style={{
                        fontSize: '0.82rem',
                        opacity: 0.4,
                        cursor: 'not-allowed',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      🔒 Admin Protected
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
