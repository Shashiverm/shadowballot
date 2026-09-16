import React, { useState } from 'react';
import { WalletState, MidnightNetwork } from '../lib/types';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

interface NavbarProps {
  activeTab: 'vote' | 'results' | 'proof' | 'organizer' | 'contract';
  setActiveTab: (tab: 'vote' | 'results' | 'proof' | 'organizer' | 'contract') => void;
  wallet: WalletState;
  onOpenWallet: () => void;
  onSwitchNetwork: (net: MidnightNetwork) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wallet,
  onOpenWallet,
  onSwitchNetwork
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const truncate = (str: string) => {
    if (!str || str.length <= 12) return str;
    return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
  };

  const handleNavClick = (tab: 'vote' | 'results' | 'proof' | 'organizer' | 'contract') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        {/* Brand */}
        <div className="brand-wrap" onClick={() => handleNavClick('vote')}>
          <svg className="brand-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <linearGradient id="slotGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" stroke="#2D3748" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M50 8 A42 42 0 0 0 50 92 Z" fill="#0E121D" stroke="#8B5CF6" strokeWidth="2.5" />
            <path d="M50 8 A42 42 0 0 1 50 92 Z" fill="url(#moonGrad)" />
            <rect x="46" y="32" width="8" height="36" rx="4" fill="#07080B" stroke="url(#slotGrad)" strokeWidth="2" />
            <rect x="42" y="24" width="16" height="18" rx="2" fill="#F8FAFC" opacity="0.9" />
            <line x1="45" y1="29" x2="55" y2="29" stroke="#7C3AED" strokeWidth="1.5" />
            <line x1="45" y1="34" x2="52" y2="34" stroke="#7C3AED" strokeWidth="1.5" />
          </svg>
          <div className="brand-text">
            <span className="brand-title">SHADOWBALLOT</span>
            <span className="brand-tagline">Private choices. Public truth.</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-only">
          <button
            className={`nav-btn ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => handleNavClick('vote')}
          >
            <span>🗳️</span> Cast Vote
          </button>
          <button
            className={`nav-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => handleNavClick('results')}
          >
            <span>📊</span> Live Results
          </button>
          <button
            className={`nav-btn ${activeTab === 'proof' ? 'active' : ''}`}
            onClick={() => handleNavClick('proof')}
          >
            <span>🛡️</span> Proof of Participation
          </button>
          <button
            className={`nav-btn ${activeTab === 'organizer' ? 'active' : ''}`}
            onClick={() => handleNavClick('organizer')}
          >
            <span>🏛️</span> Organizer Hub
          </button>
          <button
            className={`nav-btn ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => handleNavClick('contract')}
          >
            <span>🔍</span> Inspector
          </button>
        </div>

        {/* Right Actions & Mobile Hamburger */}
        <div className="nav-right">
          <div className="network-badge desktop-only">
            <span className="pulse-dot" />
            <span>{wallet.network.toUpperCase()}</span>
          </div>

          <button
            className="btn-primary wallet-btn"
            onClick={onOpenWallet}
          >
            {wallet.isConnected ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="wallet-addr-txt">{truncate(wallet.address)}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="4" />
                  <circle cx="16" cy="12" r="2" />
                </svg>
                <span>Connect</span>
              </>
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-hamburger-btn mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <span style={{ fontSize: '1.4rem' }}>&times;</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer mobile-only">
          <button
            className={`mobile-drawer-link ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => handleNavClick('vote')}
          >
            <span>🗳️</span> Cast Vote
          </button>
          <button
            className={`mobile-drawer-link ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => handleNavClick('results')}
          >
            <span>📊</span> Live Results (Public)
          </button>
          <button
            className={`mobile-drawer-link ${activeTab === 'proof' ? 'active' : ''}`}
            onClick={() => handleNavClick('proof')}
          >
            <span>🛡️</span> Participation Proof
          </button>
          <button
            className={`mobile-drawer-link ${activeTab === 'organizer' ? 'active' : ''}`}
            onClick={() => handleNavClick('organizer')}
          >
            <span>🏛️</span> Organizer Hub
          </button>
          <button
            className={`mobile-drawer-link ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => handleNavClick('contract')}
          >
            <span>🔍</span> Inspector (Public)
          </button>

          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '14px',
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Network</span>
            <span className="network-badge" style={{ fontSize: '0.72rem' }}>
              <span className="pulse-dot" />
              Midnight {wallet.network.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
};
