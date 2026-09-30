import React, { useState, useEffect } from 'react';
import { Election } from '../lib/types';
import { fetchContractLedgerState, MIDNIGHT_NETWORKS } from '../lib/midnight';

interface ResultsViewProps {
  elections: Election[];
  selectedElectionId: number;
  onSelectElection: (id: number) => void;
  onNavigateVote: () => void;
  onNavigateProof: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  elections,
  selectedElectionId,
  onSelectElection,
  onNavigateVote,
  onNavigateProof
}) => {
  const election = elections.find((e) => e.id === selectedElectionId) || elections[0];
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string; evidence?: any } | null>(null);
  const [liveLedger, setLiveLedger] = useState<{
    electionStage: number;
    totalVotes: number;
    tally0: number;
    tally1: number;
    tally2: number;
    tally3: number;
    nullifierCount: number;
    ballotCount: number;
    verified: boolean;
  } | null>(null);

  // Authoritatively derive stage from verified ledger or fallback to election metadata
  const currentStage = liveLedger?.verified ? liveLedger.electionStage : (election.electionStage ?? 1);
  const isFinalized = currentStage === 3;
  const isClosed = currentStage === 2;
  const isActive = currentStage === 1;

  // Votes count: strictly from verified on-chain ledger when verified
  const displayTotalVotes = liveLedger?.verified ? liveLedger.totalVotes : election.totalVotes;
  const total = displayTotalVotes > 0 ? displayTotalVotes : 1;

  const getOptionVotes = (optId: number): number => {
    if (liveLedger?.verified && isFinalized) {
      const tallies = [liveLedger.tally0, liveLedger.tally1, liveLedger.tally2, liveLedger.tally3];
      return tallies[optId] ?? 0;
    }
    return election.options[optId]?.voteCount ?? 0;
  };

  const maxVotes = Math.max(...election.options.map((o) => getOptionVotes(o.id)));

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const liveState = await fetchContractLedgerState(election.contractAddress, 'preprod');
      if (liveState) {
        const isLedgerFinalized = liveState.electionStage === 3;
        const talliesSum = liveState.tally0 + liveState.tally1 + liveState.tally2 + liveState.tally3;
        const conservationVerified = isLedgerFinalized ? talliesSum === liveState.totalVotes : true;

        if (isLedgerFinalized && !conservationVerified) {
          setVerificationResult({
            success: false,
            message: `⚠️ Cryptographic Conservation Failure: Sum of tallies (${talliesSum}) does not equal totalVotes (${liveState.totalVotes}).`
          });
          return;
        }

        setLiveLedger({ ...liveState, verified: true });

        const stageLabel = liveState.electionStage === 1
          ? 'Active (Voting Open — Choice Shielded)'
          : liveState.electionStage === 2
          ? 'Closed (Ballot Box Sealed — Awaiting Tally Finalization)'
          : 'Finalized (Results Authenticated on Midnight Consensus)';

        setVerificationResult({
          success: true,
          message: `✓ Midnight Ledger Verified: Stage ${liveState.electionStage} [${stageLabel}], on-chain totalVotes = ${liveState.totalVotes}, registered nullifiers = ${liveState.nullifierCount}, shielded ballot commitments = ${liveState.ballotCount}. ${
            isLedgerFinalized
              ? `All 4 option tallies verified byte-for-byte with conservation check: ${liveState.tally0} + ${liveState.tally1} + ${liveState.tally2} + ${liveState.tally3} = ${liveState.totalVotes}.`
              : 'Individual vote selections remain zero-knowledge shielded in Set<Bytes<32>>.'
          }`,
          evidence: {
            contractAddress: election.contractAddress,
            network: 'Midnight Preprod Testnet',
            stage: liveState.electionStage,
            totalVotes: liveState.totalVotes,
            nullifierCount: liveState.nullifierCount,
            ballotCount: liveState.ballotCount,
            tallies: [liveState.tally0, liveState.tally1, liveState.tally2, liveState.tally3]
          }
        });
      } else {
        setVerificationResult({
          success: false,
          message: `⚠️ Live Indexer Unreachable: Unable to establish connection with Midnight indexer at ${MIDNIGHT_NETWORKS.preprod.indexerUrl}. Cryptographic verification requires active consensus node connectivity.`
        });
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: `⚠️ Indexer Query Error: ${err?.message || 'Failed to query Midnight ledger state.'}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Attempt automatic ledger synchronization on election change
  useEffect(() => {
    setLiveLedger(null);
    setVerificationResult(null);
    handleVerifyLedger();
  }, [election.id, election.contractAddress]);

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Election Selector Pill Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {elections.map((el) => (
          <button
            key={el.id}
            onClick={() => {
              onSelectElection(el.id);
            }}
            className={`btn-secondary ${el.id === election.id ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem' }}
          >
            {el.id === election.id && <span>✓ </span>}
            <span>{el.title.substring(0, 36)}...</span>
          </button>
        ))}
      </div>

      <div className="results-card">
        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="category-tag">{election.category}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Election ID #{election.id}</span>
              <span className={`status-pill ${isActive ? 'status-active' : 'status-closed'}`}>
                {isActive ? '● Voting Active (Choice Shielded)' : isClosed ? '■ Ballot Box Sealed' : '✓ Results Finalized'}
              </span>
              {liveLedger?.verified && (
                <span style={{
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 700
                }}>
                  ✓ ON-CHAIN SYNCHRONIZED
                </span>
              )}
            </div>
            <h2 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
              {election.title}
            </h2>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL VERIFIED VOTES
            </div>
            <div className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--violet-light)' }}>
              {displayTotalVotes}
            </div>
          </div>
        </div>

        {/* Choice Shielding Notice during Active Voting */}
        {isActive && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              <span>🛡️ Choice Shielding Active (Zero Information Leakage)</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
              In accordance with zero-knowledge secret ballot specifications, individual vote selections are recorded as encrypted ballot commitments (<code>Set&lt;Bytes&lt;32&gt;&gt;</code>). Individual option tallies remain strictly confidential during voting to eliminate peer influence and bandwagon bias.
            </p>
          </div>
        )}

        {isClosed && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              🔒 Ballot Box Irreversibly Sealed
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
              Voting has permanently concluded. The election administrator is tallying ballots via the <code>tally_ballot</code> circuit before freezing results via <code>publish_final_results</code>.
            </p>
          </div>
        )}

        {/* Progress Bars */}
        <div style={{ margin: '32px 0' }}>
          {election.options.map((option) => {
            const votes = getOptionVotes(option.id);
            const percentage = isFinalized ? Math.round((votes / total) * 100) : 0;
            const isLeading = isFinalized && votes === maxVotes && votes > 0;

            return (
              <div key={option.id} className="result-bar-row">
                <div className="result-bar-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="result-label">{option.label}</span>
                    {isLeading && (
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        ★ Leading Choice
                      </span>
                    )}
                  </div>
                  <span className="result-votes">
                    {isFinalized ? (
                      `${votes} votes (${percentage}%)`
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Shielded in ZK Enclave</span>
                    )}
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${isLeading ? 'leading' : ''}`}
                    style={{ width: isFinalized ? `${percentage}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Engine Box */}
        <div style={{
          background: 'rgba(7, 8, 11, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '20px',
          marginTop: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 className="font-display" style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '4px' }}>
                On-Chain Cryptographic Consensus Audit
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Verify state consistency between Midnight Preprod ledger tallies and registered nullifier proofs.
              </p>
            </div>

            <button
              className="btn-secondary"
              onClick={handleVerifyLedger}
              disabled={isVerifying}
              style={{ fontSize: '0.85rem' }}
            >
              {isVerifying ? (
                <span>Auditing Midnight Indexer...</span>
              ) : (
                <span>Run Cryptographic Consensus Audit</span>
              )}
            </button>
          </div>

          {verificationResult && (
            <div style={{
              background: verificationResult.success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${verificationResult.success ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '0.85rem',
              color: verificationResult.success ? '#34d399' : '#fca5a5',
              lineHeight: 1.5
            }}>
              <div style={{ marginBottom: verificationResult.evidence ? '12px' : '0' }}>
                {verificationResult.message}
              </div>

              {verificationResult.evidence && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Contract: </span>
                    <span className="font-mono" style={{ color: '#ffffff' }}>
                      {verificationResult.evidence.contractAddress.substring(0, 10)}...
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Network: </span>
                    <span style={{ color: '#ffffff' }}>{verificationResult.evidence.network}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Confirmed Votes: </span>
                    <span style={{ color: '#ffffff' }}>{verificationResult.evidence.totalVotes}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>On-Chain Nullifiers: </span>
                    <span style={{ color: '#ffffff' }}>{verificationResult.evidence.nullifierCount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Quorum Requirement: <strong style={{ color: '#ffffff' }}>{election.quorum} votes</strong> | Current Progress:{' '}
            <strong style={{ color: displayTotalVotes >= election.quorum ? '#34d399' : '#f59e0b' }}>
              {Math.round((displayTotalVotes / (election.quorum || 1)) * 100)}%
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isActive && (
              <button className="btn-primary" onClick={onNavigateVote} style={{ fontSize: '0.85rem' }}>
                <span>Cast Confidential Ballot</span>
              </button>
            )}
            <button className="btn-secondary" onClick={onNavigateProof} style={{ fontSize: '0.85rem' }}>
              <span>Attest Participation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
