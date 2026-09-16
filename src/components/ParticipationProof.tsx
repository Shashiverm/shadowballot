import React, { useState } from 'react';
import { Election, VoterCredential, ParticipationAttestation } from '../lib/types';
import { createParticipationAttestation } from '../lib/crypto';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

interface ParticipationProofProps {
  elections: Election[];
  selectedElectionId: number;
  onSelectElection: (id: number) => void;
  voterCred: VoterCredential;
}

export const ParticipationProof: React.FC<ParticipationProofProps> = ({
  elections,
  selectedElectionId,
  onSelectElection,
  voterCred
}) => {
  const election = elections.find((e) => e.id === selectedElectionId) || elections[0];
  const [attestation, setAttestation] = useState<ParticipationAttestation | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    const newAttest = createParticipationAttestation(voterCred.secret, election.id, election.title);
    setAttestation(newAttest);
    setIsGenerating(false);
  };

  const handleCopyHash = () => {
    if (attestation) {
      navigator.clipboard.writeText(attestation.proofHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCertificate = () => {
    if (!attestation) return;
    const blob = new Blob([JSON.stringify(attestation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowballot-attestation-${attestation.attestationId.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="hero-pill" style={{ marginBottom: '14px' }}>
            <span>🛡️ Selective Disclosure Engine</span>
          </div>
          <h2 className="font-display" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
            Zero-Knowledge Participation Proof
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
            Generate a standalone cryptographic attestation proving you cast a ballot in this election without disclosing your identity, wallet address, or vote choice.
          </p>
        </div>

        {/* Election Selector Pill Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {elections.map((el) => (
            <button
              key={el.id}
              onClick={() => {
                onSelectElection(el.id);
                setAttestation(null);
              }}
              className={`btn-secondary ${el.id === election.id ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.85rem' }}
            >
              {el.id === election.id && <span>✓ </span>}
              <span>{el.title.substring(0, 32)}...</span>
            </button>
          ))}
        </div>

        {/* Generator Box */}
        {!attestation ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '36px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 20px'
            }}>
              🔏
            </div>

            <h3 className="font-display" style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '8px' }}>
              Prove Participation in "{election.title}"
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 28px' }}>
              The local prover will execute <code>attest_participation</code> circuit logic to construct a verifiable ZK signature over the election parameters.
            </p>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              {isGenerating ? (
                <span>Synthesizing Participation Proof...</span>
              ) : (
                <span>Generate Proof of Participation</span>
              )}
            </button>
          </div>
        ) : (
          /* Attestation Card */
          <div className="attestation-card">
            <div className="attestation-badge">
              ✓ Cryptographically Verified
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: 'var(--violet-light)',
                padding: '8px',
                borderRadius: '10px'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.35rem', color: '#ffffff' }}>
                  Certificate of Ballot Participation
                </h3>
                <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ID: {attestation.attestationId}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {attestation.selectiveDisclosureClaim}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ELECTION:</span>
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>
                  {attestation.electionTitle}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROOF HASH (SELECTIVE DISCLOSURE):</span>
                <div className="mono-field" style={{ fontSize: '0.78rem' }}>
                  <span>{attestation.proofHash}</span>
                  <button
                    className="btn-ghost"
                    onClick={handleCopyHash}
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CIRCUIT SIGNATURE:</span>
                <div className="mono-field" style={{ fontSize: '0.78rem' }}>
                  <span>{attestation.circuitSignature}</span>
                </div>
              </div>
            </div>

            {/* Privacy Matrix Reminder */}
            <div style={{
              background: 'rgba(7, 8, 11, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Voter Identity:</span>
                <div style={{ color: '#c4b5fd', fontWeight: 600 }}>🛡️ Shielded (Hidden)</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Ballot Option Choice:</span>
                <div style={{ color: '#c4b5fd', fontWeight: 600 }}>🛡️ Shielded (Hidden)</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Participation Status:</span>
                <div style={{ color: '#34d399', fontWeight: 600 }}>✓ Verified Publicly</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={handleDownloadCertificate}
                style={{ fontSize: '0.85rem' }}
              >
                <span>📥 Download Certificate (JSON)</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => setAttestation(null)}
                style={{ fontSize: '0.85rem' }}
              >
                <span>Generate New Proof</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
