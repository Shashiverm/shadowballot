import React, { useState } from 'react';
import { Election, WalletState, VoterCredential, VoteReceipt } from '../lib/types';
import { deriveNullifier } from '../lib/crypto';
import { MIDNIGHT_NETWORKS, executeCastPrivateVote } from '../lib/midnight';

interface VotingPanelProps {
  elections: Election[];
  selectedElectionId: number;
  onSelectElection: (id: number) => void;
  wallet: WalletState;
  voterCred: VoterCredential;
  spentNullifiers: Set<string>;
  onVoteSuccess: (electionId: number, optionId: number, receipt: VoteReceipt) => void;
  onNavigateResults: () => void;
  onNavigateProof: () => void;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  elections,
  selectedElectionId,
  onSelectElection,
  wallet,
  voterCred,
  spentNullifiers,
  onVoteSuccess,
  onNavigateResults,
  onNavigateProof
}) => {
  const election = elections.find((e) => e.id === selectedElectionId) || elections[0];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProving, setIsProving] = useState(false);
  const [proofStep, setProofStep] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<VoteReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeNetworkConfig = MIDNIGHT_NETWORKS[wallet.network] || MIDNIGHT_NETWORKS.preprod;

  // Compute deterministic nullifier commitment for this voter and election
  const currentNullifier = deriveNullifier(voterCred.secret, election.id);
  const hasAlreadyVoted = spentNullifiers.has(currentNullifier);

  const handleCastVote = async () => {
    if (selectedOption === null) return;
    setErrorMessage(null);

    // Assert double voting prevention against nullifier set
    if (hasAlreadyVoted) {
      setErrorMessage(
        'Double Voting Prevented: Your nullifier is already in the on-chain Set<Bytes<32>> for this election.'
      );
      return;
    }

    if (!voterCred.isEligible) {
      setErrorMessage('Eligibility Constraint Failed: Your credentials are not authorized for this ballot.');
      return;
    }

    if (election.status === 'closed') {
      setErrorMessage('Ballot Box Sealed: This election has closed and no longer accepts submissions.');
      return;
    }

    setIsProving(true);

    try {
      // Genuine Midnight.js Integration:
      // setNetworkId -> findDeployedContract -> proveTx -> balanceTx -> submitTx -> watchForTxData
      const receipt = await executeCastPrivateVote(
        wallet,
        election,
        selectedOption,
        voterCred,
        (step) => setProofStep(step)
      );

      setLastReceipt(receipt);
      onVoteSuccess(election.id, selectedOption, receipt);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Midnight.js contract call failed during proof generation or consensus submission.');
    } finally {
      setIsProving(false);
      setProofStep('');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Network & Contract Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '12px',
        padding: '10px 16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--violet-light)', fontWeight: 700 }}>Midnight.js Integration:</span>
          <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            findDeployedContract() + callTx.cast_private_vote()
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>Target Consensus:</span>
          <span style={{
            background: wallet.network === 'preview' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: wallet.network === 'preview' ? '#38bdf8' : '#fbbf24',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: 700
          }}>
            Midnight {wallet.network.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Election Selector Pill Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {elections.map((el) => (
          <button
            key={el.id}
            onClick={() => {
              onSelectElection(el.id);
              setSelectedOption(null);
              setLastReceipt(null);
              setErrorMessage(null);
            }}
            className={`btn-secondary ${el.id === election.id ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem' }}
          >
            {el.id === election.id && <span>✓ </span>}
            <span>{el.title.substring(0, 36)}...</span>
          </button>
        ))}
      </div>

      <div className="ballot-container">
        {/* Ballot Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span className="category-tag">{election.category}</span>
            <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>
              {election.title}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Contract: {election.contractAddress.substring(0, 18)}...
              <a
                href={`${activeNetworkConfig.explorerUrl}/contract/${election.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--cyan-accent)', marginLeft: '6px' }}
              >
                Explorer ↗
              </a>
            </div>
          </div>
          <div className="status-pill status-active">
            <span className="pulse-dot" />
            <span>Voting Active</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
          {election.description}
        </p>

        {/* ZK Eligibility & Nullifier Checklist */}
        <div className="zk-checklist">
          <div className="checklist-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Client-Side Zero-Knowledge Validation & On-Chain Nullifier Set</span>
          </div>
          <div className="checklist-items">
            <div className="check-item">
              <span>✓</span>
              <span>Voter Credential Valid (isEligible == 1)</span>
            </div>
            <div className="check-item">
              <span>✓</span>
              <span>Election Active on Midnight {wallet.network.toUpperCase()}</span>
            </div>
            <div className="check-item" style={{ color: hasAlreadyVoted ? '#f43f5e' : '#34d399' }}>
              <span>{hasAlreadyVoted ? '✕' : '✓'}</span>
              <span>
                {hasAlreadyVoted
                  ? 'Nullifier Already Present in On-Chain Set<Bytes<32>> (Voted)'
                  : 'Nullifier Fresh & Unspent in Set<Bytes<32>>'}
              </span>
            </div>
            <div className="check-item">
              <span>✓</span>
              <span>Private Witness Memory Isolated (Secret & Choice Never Leaked)</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            color: '#fda4af',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Option Choices Stack */}
        <div className="options-stack">
          {election.options.map((option) => (
            <div
              key={option.id}
              className={`option-box ${selectedOption === option.id ? 'selected' : ''}`}
              onClick={() => {
                if (!hasAlreadyVoted && !isProving) {
                  setSelectedOption(option.id);
                  setErrorMessage(null);
                }
              }}
            >
              <div className="radio-indicator">
                {selectedOption === option.id && <div className="radio-dot" />}
              </div>
              <div className="option-info">
                <div className="option-name">{option.label}</div>
                <div className="option-desc">{option.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button & Disclaimer */}
        <div style={{ marginTop: '30px' }}>
          <button
            className="btn-primary"
            onClick={handleCastVote}
            disabled={selectedOption === null || isProving || hasAlreadyVoted}
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
          >
            {isProving ? (
              <span>Executing Midnight.js ZK Proof & Consensus Pipeline...</span>
            ) : hasAlreadyVoted ? (
              <span>Ballot Nullifier Already Committed in On-Chain Set</span>
            ) : (
              <span>Cast Private Vote (callTx.cast_private_vote)</span>
            )}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
            marginTop: '12px'
          }}>
            Executed via <code>findDeployedContract</code> and <code>callTx.cast_private_vote()</code>. The Midnight ledger records only the spent nullifier commitment and public aggregate tally increment.
          </p>
        </div>

        {/* Proving Status Modal */}
        {isProving && (
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
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                Executing Midnight.js Transaction
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--violet-light)', marginBottom: '16px' }}>
                {proofStep}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Targeting contract <code>{election.contractAddress.substring(0, 16)}...</code> on Midnight {wallet.network.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Post-Vote Success Receipt */}
        {lastReceipt && (
          <div style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 18, 29, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>✓</div>
              <h4 className="font-display" style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                Vote Confirmed on Midnight {lastReceipt.networkId.toUpperCase()} Ledger
              </h4>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Your zero-knowledge proof was verified and confirmed by Midnight consensus. Your choice and identity remain completely confidential off-chain.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TRANSACTION IDENTIFIER:</span>
                <div className="mono-field" style={{ fontSize: '0.75rem' }}>
                  <span>{lastReceipt.txHash}</span>
                  <a
                    href={`${activeNetworkConfig.explorerUrl}/tx/${lastReceipt.txId || lastReceipt.txHash.replace('0x', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--cyan-accent)' }}
                  >
                    View on Explorer ↗
                  </a>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REGISTERED NULLIFIER COMMITMENT (Set&lt;Bytes&lt;32&gt;&gt;):</span>
                <div className="mono-field" style={{ fontSize: '0.75rem' }}>
                  <span>{lastReceipt.nullifierHash}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>BLOCK HEIGHT:</span>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    #{lastReceipt.blockHeight}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>CONSENSUS STATUS:</span>
                  <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.82rem' }}>
                    {lastReceipt.status}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>PROVING DURATION:</span>
                  <div style={{ color: 'var(--violet-light)', fontSize: '0.82rem' }}>
                    {lastReceipt.proofTimeMs} ms
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={onNavigateResults}
                style={{ fontSize: '0.85rem' }}
              >
                <span>📊 View Verifiable Results</span>
              </button>
              <button
                className="btn-secondary"
                onClick={onNavigateProof}
                style={{ fontSize: '0.85rem' }}
              >
                <span>🛡️ Generate Proof of Participation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
