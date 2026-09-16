import React, { useState } from 'react';
import { WalletState, MidnightNetwork } from '../lib/types';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectLace: () => void;
  onConnectMobileOrDev: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: (net: MidnightNetwork) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectLace,
  onConnectMobileOrDev,
  onDisconnect,
  onSwitchNetwork
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'extension' | 'mobile'>('extension');

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
            {/* Wallet Mode Selector */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-card-subtle)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px',
              gap: '4px'
            }}>
              <button
                type="button"
                className={`btn-ghost ${activeTab === 'extension' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('extension')}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
              >
                Desktop (Lace)
              </button>
              <button
                type="button"
                className={`btn-ghost ${activeTab === 'mobile' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('mobile')}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
              >
                📱 Mobile / All Devices
              </button>
            </div>

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
                <strong>Connection Alert:</strong> {wallet.error}
              </div>
            )}

            {activeTab === 'extension' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Connect your official <strong>Midnight Lace</strong> browser extension for Chrome, Brave, or Edge.
                </p>

                <button
                  className="btn-primary"
                  onClick={onConnectLace}
                  disabled={wallet.isConnecting}
                  style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                >
                  {wallet.isConnecting ? (
                    <span>Connecting to Lace...</span>
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

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  marginTop: '4px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    On mobile or don't have Lace extension installed?
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={onConnectMobileOrDev}
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.85rem' }}
                  >
                    📱 Use Mobile Device Enclave (Instant Access)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Mobile phones & tablets run an encrypted <strong>in-browser cryptographic enclave</strong> that stores your private zero-knowledge witnesses locally.
                </p>

                <button
                  className="btn-primary"
                  onClick={onConnectMobileOrDev}
                  style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="3" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                  </svg>
                  <span>Connect Mobile Device Enclave & Vote</span>
                </button>

                <div style={{
                  background: 'rgba(7, 8, 11, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)'
                }}>
                  <strong style={{ color: 'var(--violet-light)' }}>Cross-Platform Support:</strong> Compatible with iOS Safari, Android Chrome, iPadOS, and Desktop. Private keys never leave your device.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {wallet.walletName}
              </div>
              <div className="mono-field" style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{wallet.address}</span>
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
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wallet Balance</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
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
                  Shielded Session Ready
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
                Night Scan ↗
              </a>
              <button
                className="btn-secondary"
                onClick={onDisconnect}
                style={{ flex: 1, color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)', justifyContent: 'center' }}
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
