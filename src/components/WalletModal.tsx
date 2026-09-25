import React, { useState, useEffect } from 'react';
import { WalletState, MidnightNetwork } from '../lib/types';
import { MIDNIGHT_NETWORKS } from '../lib/midnight';
import { discoverMidnightWallets, DiscoveredWallet } from '../lib/wallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectInjected: (walletId?: string) => void;
  onDisconnect: () => void;
  onSwitchNetwork: (net: MidnightNetwork) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectInjected,
  onDisconnect,
  onSwitchNetwork
}) => {
  const [copied, setCopied] = useState(false);
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

  const activeNetConfig = MIDNIGHT_NETWORKS[wallet.network] || MIDNIGHT_NETWORKS.preprod;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="modal-title font-display">Midnight DApp Connector</h3>
            <span className="network-badge" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
              {wallet.network.toUpperCase()}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {!wallet.isConnected ? (
          <div>
            {/* Target Network Selector */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>Target Consensus Network</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>setNetworkId()</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onSwitchNetwork('preprod')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: wallet.network === 'preprod' ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                    background: wallet.network === 'preprod' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.02)',
                    color: wallet.network === 'preprod' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: wallet.network === 'preprod' ? 700 : 500,
                    textAlign: 'center'
                  }}
                >
                  <div>Midnight Preprod</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>Primary Testnet</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchNetwork('preview')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    border: wallet.network === 'preview' ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: wallet.network === 'preview' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: wallet.network === 'preview' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: wallet.network === 'preview' ? 700 : 500,
                    textAlign: 'center'
                  }}
                >
                  <div>Midnight Preview</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>Next-Gen Testnet</div>
                </button>
              </div>
            </div>

            {wallet.error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '0.82rem',
                color: '#fda4af'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Wallet Connection Notice:</strong> {wallet.error}
                </div>
                {/network\s*id\s*mismatch|mismatch/i.test(wallet.error) && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const alt = wallet.network === 'preprod' ? 'preview' : 'preprod';
                        onSwitchNetwork(alt);
                        onConnectInjected();
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      🔄 Auto-switch to {wallet.network === 'preprod' ? 'PREVIEW' : 'PREPROD'} & Reconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Connect via the official <strong>Midnight DApp Connector</strong> specification (CAIP-372). All transaction balancing and proving are securely signed by your authenticated wallet.
              </p>

              {/* Detected DApp Connector Wallets */}
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
                    <span>Authenticating with Midnight Lace...</span>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="4" />
                        <circle cx="16" cy="12" r="2" />
                      </svg>
                      <span>Connect Midnight Lace (DApp Connector)</span>
                    </>
                  )}
                </button>
              )}

              {/* Install Extension Notice */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px',
                marginTop: '6px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  Need the Midnight Lace Extension?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                  Install the official Midnight Lace browser extension from the Chrome Web Store to manage private keys and sign zero-knowledge transactions.
                </div>
                <a
                  href="https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflim"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }}
                >
                  Install Midnight Lace Extension ↗
                </a>
              </div>
            </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {wallet.walletName}
                </span>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  ● Connected ({wallet.network.toUpperCase()})
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>UNSHIELDED ACCOUNT ADDRESS</div>
                <div className="mono-field" style={{ fontSize: '0.75rem' }}>
                  <span style={{ wordBreak: 'break-all' }}>{wallet.address}</span>
                  <button
                    className="btn-ghost"
                    onClick={handleCopy}
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {wallet.shieldedAddress && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>SHIELDED ADDRESS (ZK-PRIVATE)</div>
                  <div className="mono-field" style={{ fontSize: '0.72rem' }}>
                    <span style={{ wordBreak: 'break-all', color: 'var(--violet-light)' }}>
                      {wallet.shieldedAddress.substring(0, 24)}...{wallet.shieldedAddress.substring(wallet.shieldedAddress.length - 8)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>DUST BALANCE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {wallet.balance.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--violet-light)' }}>tDUST</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>DAPP CONNECTOR API</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                    v{wallet.apiVersion || '4.0.1'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`${activeNetConfig.explorerUrl}/address/${wallet.address}`}
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
