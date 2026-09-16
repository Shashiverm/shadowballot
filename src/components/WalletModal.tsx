import React, { useState, useEffect } from 'react';
import { WalletState, MidnightNetwork } from '../lib/types';
import { MIDNIGHT_CONFIG } from '../lib/midnight';
import { discoverMidnightWallets, DiscoveredWallet } from '../lib/wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectInjected: (walletId?: string) => void;
  onConnectMobileOrEnclave: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: (net: MidnightNetwork) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectInjected,
  onConnectMobileOrEnclave,
  onDisconnect,
  onSwitchNetwork
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [discoveredWallets, setDiscoveredWallets] = useState<DiscoveredWallet[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDiscoveredWallets(discoverMidnightWallets());
    }
  }, [isOpen]);

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
            {/* Device Switcher */}
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
                className={`btn-ghost ${activeTab === 'desktop' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('desktop')}
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

            {/* Target Network Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '6px 10px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Network:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['preprod', 'testnet', 'preview'] as MidnightNetwork[]).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => onSwitchNetwork(net)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      borderRadius: '6px',
                      border: wallet.network === net ? '1px solid var(--violet-light)' : '1px solid transparent',
                      background: wallet.network === net ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                      color: wallet.network === net ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}
                  >
                    {net}
                  </button>
                ))}
              </div>
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
                <div style={{ marginBottom: '6px' }}>
                  <strong>Connection Notice:</strong> {wallet.error}
                </div>
                {/network\s*id\s*mismatch|mismatch/i.test(wallet.error) && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        onSwitchNetwork(wallet.network === 'preprod' ? 'testnet' : 'preprod');
                        onConnectInjected();
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      🔄 Switch to {wallet.network === 'preprod' ? 'TESTNET' : 'PREPROD'} & Reconnect
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onConnectMobileOrEnclave}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      🛡️ Use Enclave Keystore
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'desktop' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Connect using the official <strong>Midnight Lace</strong> browser extension implementing the Midnight DApp Connector standard.
                </p>

                {/* Detected wallets list or default Lace trigger */}
                {discoveredWallets.length > 0 ? (
                  discoveredWallets.map((w) => (
                    <button
                      key={w.id}
                      className="btn-primary"
                      onClick={() => onConnectInjected(w.id)}
                      disabled={wallet.isConnecting}
                      style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="4" />
                        <circle cx="16" cy="12" r="2" />
                      </svg>
                      <span>Connect {w.name} (Detected ✓)</span>
                    </button>
                  ))
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => onConnectInjected()}
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
                )}

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Don't have Lace extension installed on this browser?
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflim"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}
                    >
                      Install Lace ↗
                    </a>
                    <button
                      className="btn-secondary"
                      onClick={onConnectMobileOrEnclave}
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}
                    >
                      Use Enclave Keystore
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile / Universal Device Enclave */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  On iOS Safari, Android Chrome, and tablets, ShadowBallot uses an <strong>in-browser cryptographic enclave</strong> conforming to Midnight's private witness model.
                </p>

                <button
                  className="btn-primary"
                  onClick={onConnectMobileOrEnclave}
                  style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="3" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                  </svg>
                  <span>Connect Mobile Device Enclave</span>
                </button>

                <div style={{
                  background: 'rgba(7, 8, 11, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)'
                }}>
                  <strong style={{ color: 'var(--violet-light)' }}>Hardware Security:</strong> Private keys and voting entropy remain encrypted on your device. The blockchain never receives raw credentials or identity.
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
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Balance</div>
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
                  Connected & Shielded
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
