import React, { useState } from 'react';
import { Election } from '../lib/types';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

interface OrganizerDashboardProps {
  elections: Election[];
  onCreateElection: (newElection: Omit<Election, 'id'>) => void;
  onToggleStatus: (electionId: number) => void;
  walletAddress: string;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  elections,
  onCreateElection,
  onToggleStatus,
  walletAddress
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Protocol Governance');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [quorum, setQuorum] = useState('50');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !opt0 || !opt1 || !opt2 || !opt3) {
      alert('Please fill all fields including 4 ballot options');
      return;
    }

    onCreateElection({
      title,
      description,
      category,
      status: 'active',
      totalVotes: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      creatorAddress: walletAddress || '020088b901a1827cf482a1782e4f019a82001',
      contractAddress: MIDNIGHT_CONFIG.contractAddress,
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
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            Election Organizer Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deploy new zero-knowledge private ballots and manage active elections on Midnight consensus.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel Creation' : '+ Create New Election'}
        </button>
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
                <option value="Community Grants">Community Grants</option>
                <option value="Security & Audits">Security & Audits</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Election Description & Scope
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the initiative, verification rules, and intent..."
              rows={3}
              required
              style={{
                width: '100%',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ffffff',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Ballot Choices (4 Required for Circuit)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                placeholder="Option 1 label"
                value={opt0}
                onChange={(e) => setOpt0(e.target.value)}
                required
                style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Option 2 label"
                value={opt1}
                onChange={(e) => setOpt1(e.target.value)}
                required
                style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Option 3 label"
                value={opt2}
                onChange={(e) => setOpt2(e.target.value)}
                required
                style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Option 4 label"
                value={opt3}
                onChange={(e) => setOpt3(e.target.value)}
                required
                style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Deploy Ballot to Midnight Preprod
            </button>
          </div>
        </form>
      )}

      {/* Active Elections Management List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {elections.map((el) => (
          <div
            key={el.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="category-tag">{el.category}</span>
                <span className={`status-pill ${el.status === 'active' ? 'status-active' : 'status-closed'}`}>
                  {el.status === 'active' ? '● Open for Voting' : '■ Ballot Box Sealed'}
                </span>
              </div>
              <h4 className="font-display" style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '4px' }}>
                {el.title}
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Total Verified Votes: <strong style={{ color: 'var(--violet-light)' }}>{el.totalVotes}</strong> | Quorum: {el.quorum} | Window: {el.startDate} to {el.endDate}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => onToggleStatus(el.id)}
                style={{ fontSize: '0.82rem' }}
              >
                {el.status === 'active' ? '🔒 Seal Ballot Box' : '🔓 Re-open Ballot Box'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
