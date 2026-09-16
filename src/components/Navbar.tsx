import React from 'react';
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
  const truncate = (str: string) => {
    if (!str || str.length <= 14) return str;
    return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <div className="brand-wrap" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('vote')}>
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
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="46" stroke="#2D3748" strokeWidth="2" strokeDasharray="3 3" />
            {/* Dark Moon Hemisphere */}
            <path d="M50 8 A42 42 0 0 0 50 92 Z" fill="#0E121D" stroke="#8B5CF6" strokeWidth="2.5" />
            {/* Light Moon Hemisphere */}
            <path d="M50 8 A42 42 0 0 1 50 92 Z" fill="url(#moonGrad)" />
            {/* Cryptographic Ballot Slot */}
            <rect x="46" y="32" width="8" height="36" rx="4" fill="#07080B" stroke="url(#slotGrad)" strokeWidth="2" />
            {/* Ballot Card Slid In */}
            <rect x="42" y="24" width="16" height="18" rx="2" fill="#F8FAFC" opacity="0.9" />
            <line x1="45" y1="29" x2="55" y2="29" stroke="#7C3AED" strokeWidth="1.5" />
            <line x1="45" y1="34" x2="52" y2="34" stroke="#7C3AED" strokeWidth="1.5" />
          </svg>
          <div className="brand-text">
            <span className="brand-title">SHADOWBALLOT</span>
            <span className="brand-tagline">Private choices. Public truth.</span>
          </div>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'vote' ? 'active' : ''}`}
            onClick={() => setActiveTab('vote')}
          >
            <span>🗳️</span> Cast Vote
          </button>
          <button
            className={`nav-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <span>📊</span> Live Results
          </button>
          <button
            className={`nav-btn ${activeTab === 'proof' ? 'active' : ''}`}
            onClick={() => setActiveTab('proof')}
          >
            <span>🛡️</span> Participation Proof
          </button>
          <button
            className={`nav-btn ${activeTab === 'organizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizer')}
          >
            <span>🏛️</span> Organizer
          </button>
          <button
            className={`nav-btn ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            <span>🔍</span> Inspector
          </button>
        </div>

        <div className="nav-right">
          <div className="network-badge">
            <span className="pulse-dot" />
            <span>Midnight Preprod</span>
          </div>

          <button
            className="btn-primary"
            onClick={onOpenWallet}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {wallet.isConnected ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{truncate(wallet.address)}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="4" />
                  <circle cx="16" cy="12" r="2" />
                </svg>
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
