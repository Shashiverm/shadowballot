import React, { useState } from 'react';
import { Election, WalletState } from '../lib/types';
import { MIDNIGHT_CONFIG, MIDNIGHT_NETWORKS, executeDeployBallotContract } from '../lib/midnight';

interface OrganizerDashboardProps {
  elections: Election[];
  onCreateElection: (newElection: Omit<Election, 'id'>) => void;
  onToggleStatus: (electionId: number) => void;
  walletAddress: string;
  wallet?: WalletState;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  elections,
  onCreateElection,
  onToggleStatus,
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
      alert('Wallet Required: Connect Midnight Lace or Mobile Enclave to sign and deploy the smart contract on Midnight consensus.');
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
        totalVotes: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        creatorAddress: walletAddress,
        contractAddress: deployResult.contractAddress,
        quorum: parseInt(quorum) || 50,
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
      setFilter('my');
    } catch (err: any) {
      alert(`Deployment Failed: ${err?.message || 'Error executing deployContract()'}`);
    } finally {
      setIsDeploying(false);
      setDeployStep('');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            Election Organizer Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deploy new zero-knowledge private ballots and manage your authorized elections on Midnight consensus.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel Creation' : '+ Create New Election'}
        </button>
      </div>

      {/* Connected Organizer Identity & Scope Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '14px',
        padding: '12px 18px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Connected Organizer Identity & Signature Authority
            </div>
            <div className="font-mono" style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
              {walletAddress ? truncate(walletAddress) : 'No Wallet Connected'}
            </div>
          </div>
        </div>

        {/* Ownership & Scope Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn-ghost ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            All Proposals ({elections.length})
          </button>
          <button
            type="button"
            className={`btn-ghost ${filter === 'my' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('my')}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            👑 My Proposals ({myCount})
          </button>
        </div>
      </div>

      {/* Organizer Responsibilities Workflow Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ borderLeft: '3px solid #8B5CF6', paddingLeft: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase' }}>Duty 1: Proposal Setup</div>
          <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '4px' }}>Draft confidential questions, define candidates, and initialize ballot state on Midnight.</div>
        </div>
        <div style={{ borderLeft: '3px solid #38BDF8', paddingLeft: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Duty 2: Whitelist Root</div>
          <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '4px' }}>Commit eligible voter Merkle tree root to enable cryptographic eligibility verification.</div>
        </div>
        <div style={{ borderLeft: '3px solid #34D399', paddingLeft: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Duty 3: Quorum Monitoring</div>
          <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '4px' }}>Track participation in real-time without ever viewing raw votes or voter identities.</div>
        </div>
        <div style={{ borderLeft: '3px solid #F59E0B', paddingLeft: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Duty 4: Finalize & Seal</div>
          <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '4px' }}>Execute close_election.zkir state transition to seal the ballot box and export audit manifests.</div>
        </div>
      </div>

      {/* Creation Form Modal / Card */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}
        >
          <h3 className="font-display" style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#ffffff' }}>
            New Confidential Ballot Proposal
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Election Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Community Treasury Allocation 2026"
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="Protocol Governance">Protocol Governance</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Community Treasury">Community Treasury</option>
                <option value="Core Development">Core Development</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Purpose
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the scope of this proposal for community voter review..."
              rows={3}
              required
              style={{
                width: '100%',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Ballot Options (Required: 4 Options for Compact ZK Circuit)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                value={opt0}
                onChange={(e) => setOpt0(e.target.value)}
                placeholder="Option 1 label"
                required
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                value={opt1}
                onChange={(e) => setOpt1(e.target.value)}
                placeholder="Option 2 label"
                required
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                value={opt2}
                onChange={(e) => setOpt2(e.target.value)}
                placeholder="Option 3 label"
                required
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                value={opt3}
                onChange={(e) => setOpt3(e.target.value)}
                placeholder="Option 4 label"
                required
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Quorum Threshold (Minimum Votes)
              </label>
              <input
                type="number"
                value={quorum}
                onChange={(e) => setQuorum(e.target.value)}
                min="1"
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Eligible Voter Whitelist Root (Merkle Tree)
              </label>
              <input
                type="text"
                value="0x7b84c01d9f45610e7a2b91c834e590a21bc9081e4d3a201b5f7e8a91c034b156"
                disabled
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'var(--violet-light)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreating(false)}
              disabled={isDeploying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isDeploying}
            >
              {isDeploying ? 'Deploying to Midnight...' : `Deploy Ballot to Midnight ${(wallet?.network || 'preprod').toUpperCase()}`}
            </button>
          </div>
        </form>
      )}

      {/* Deployment Progress Modal */}
      {isDeploying && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: 'var(--violet-primary)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Deploying Midnight Contract
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--violet-light)', marginBottom: '16px' }}>
              {deployStep}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Executing <code>deployContract()</code> on Midnight {(wallet?.network || 'preprod').toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Active Elections Management List with Ownership & Permissions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayedElections.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>📭</div>
            <h4 style={{ color: '#ffffff', marginBottom: '6px', fontSize: '1.1rem' }}>No Proposals Created by Your Wallet Yet</h4>
            <p style={{ fontSize: '0.84rem', maxWidth: '460px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              On Midnight, proposals can only be modified or sealed by their verified creator wallet. Click below to deploy your first confidential election.
            </p>
            <button className="btn-primary" onClick={() => setIsCreating(true)}>
              + Create Your First Election
            </button>
          </div>
        ) : (
          displayedElections.map((el) => {
            const userOwnsThis = isOwner(el);
            return (
              <div
                key={el.id}
                style={{
                  background: 'var(--bg-card)',
                  border: userOwnsThis ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: userOwnsThis ? '0 0 20px rgba(139, 92, 246, 0.08)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="category-tag">{el.category}</span>
                    <span className={`status-pill ${el.status === 'active' ? 'status-active' : 'status-closed'}`}>
                      {el.status === 'active' ? '● Open for Voting' : '■ Ballot Box Sealed'}
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
                        👑 Created by You (Full Control)
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
                        creatorAddress: el.creatorAddress,
                        totalVerifiedVotes: el.totalVotes,
                        quorumThreshold: el.quorum,
                        quorumAchieved: el.totalVotes >= el.quorum,
                        options: el.options,
                        startDate: el.startDate,
                        endDate: el.endDate,
                        circuitBytecodeHash: '0x2fd7eec3b567793f109866a56f5c9ae7882b7f6dc50bbe5cb407425d5217be3b',
                        nullifierStorage: 'Set<Bytes<32>>',
                        merkleStateRoot: '0x7b84c01d9f45610e7a2b91c834e590a21bc9081e4d3a201b5f7e8a91c034b156',
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
                    <button
                      className="btn-secondary"
                      onClick={() => onToggleStatus(el.id)}
                      style={{
                        fontSize: '0.82rem',
                        borderColor: 'rgba(139, 92, 246, 0.4)',
                        color: el.status === 'active' ? '#f43f5e' : '#34d399'
                      }}
                    >
                      {el.status === 'active' ? '🔒 Seal Ballot Box' : '🔓 Re-open Ballot Box'}
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      disabled
                      title={`Only the creator of this proposal (${el.creatorAddress}) has permission to seal or modify it.`}
                      style={{
                        fontSize: '0.82rem',
                        opacity: 0.4,
                        cursor: 'not-allowed',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      🔒 Sealed (Creator Only)
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
