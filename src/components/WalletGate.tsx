import React from 'react';

interface WalletGateProps {
  actionName: string;
  actionDescription: string;
  onConnect: () => void;
  onViewResults: () => void;
}

export const WalletGate: React.FC<WalletGateProps> = ({
  actionName,
  actionDescription,
  onConnect,
  onViewResults
}) => {
  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-active)',
        borderRadius: '24px',
        padding: 'clamp(24px, 5vw, 48px)',
        maxWidth: '680px',
        margin: '0 auto',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Security Lock Badge */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--violet-light)'
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="hero-pill" style={{ marginBottom: '14px', display: 'inline-flex' }}>
          <span>🔒 Cryptographic Authentication Required</span>
        </div>

        <h3 className="font-display" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', color: '#ffffff', marginBottom: '12px' }}>
          Connect Wallet to {actionName}
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
          {actionDescription}. In accordance with ShadowBallot's zero-knowledge security guarantees, public results can be audited freely, but casting a ballot or generating proofs requires an authenticated Midnight wallet or mobile device enclave.
        </p>

        {/* Security badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          background: 'var(--bg-card-subtle)',
          padding: '16px',
          borderRadius: '14px',
          marginBottom: '32px',
          textAlign: 'left',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <span>✓</span>
            <span>Zero-Knowledge Privacy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <span>✓</span>
            <span>Mobile Device Enclave</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <span>✓</span>
            <span>Strict One-Person-One-Vote</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn-primary"
            onClick={onConnect}
            style={{ width: '100%', padding: '16px', fontSize: '1rem', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="4" />
              <circle cx="16" cy="12" r="2" />
            </svg>
            <span>Connect Midnight Wallet & Vote</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onViewResults}
            style={{ width: '100%', padding: '14px', fontSize: '0.9rem', justifyContent: 'center' }}
          >
            <span>📊 View Public Results Without Connecting</span>
          </button>
        </div>
      </div>
    </div>
  );
};
