import React, { useState } from 'react';
import { WalletState, MidnightNetwork } from '../lib/types';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectLace: () => void;
  onConnectDev: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: (net: MidnightNetwork) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectLace,
  onConnectDev,
  onDisconnect,
  onSwitchNetwork
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="modal-title font-display">Midnight Wallet</h3>
            <span className="network-badge" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
              {wallet.network.toUpperCase()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {!wallet.isConnected ? (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Connect your <strong>Midnight Lace</strong> browser extension or use the in-browser <strong>Dev Keystore</strong> to sign zero-knowledge voting transactions.
            </p>

            {wallet.error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: '#fda4af'
              }}>
                <strong>Connection Error:</strong> {wallet.error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={onConnectLace}
                disabled={wallet.isConnecting}
                style={{ width: '100%', padding: '12px' }}
              >
                {wallet.isConnecting ? (
                  <span>Connecting to Midnight Lace...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="4" />
                      <circle cx="16" cy="12" r="2" />
                    </svg>
                    <span>Connect Midnight Lace Extension</span>
                  </>
                )}
              </button>

              <button
                className="btn-secondary"
                onClick={onConnectDev}
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Instant In-Browser Dev Keystore (Sandbox)</span>
              </button>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginTop: '20px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ color: 'var(--violet-light)', fontWeight: 600 }}>Privacy Guarantee:</span> Your wallet address is never linked to your vote choice. The ZK circuit proves your eligibility off-chain without revealing your identity to consensus.
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {wallet.isDevKeystore ? 'DEV KEYSTORE ADDRESS (SANDBOX)' : 'TRANSPARENT ADDRESS'}
              </div>
              <div className="mono-field" style={{ marginBottom: '14px' }}>
                <span>{wallet.address}</span>
                <button
                  className="btn-ghost"
                  onClick={handleCopy}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wallet Balance</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                    {wallet.balance.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--violet-light)' }}>tDUST</span>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  Shielded Engine Active
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`${MIDNIGHT_CONFIG.explorerUrl}/address/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
              >
                Explorer ↗
              </a>
              <button
                className="btn-secondary"
                onClick={onDisconnect}
                style={{ flex: 1, color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
