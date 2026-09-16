import React from 'react';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

type PageTab = 'vote' | 'results' | 'proof' | 'organizer' | 'contract';

interface FooterProps {
  onNavigate?: (tab: PageTab) => void;
  network?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, network = 'PREPROD' }) => {
  const handleNav = (tab: PageTab, e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(tab);
    }
  };

  return (
    <footer className="footer-enhanced">
      <div className="container">
        {/* Top Section: Brand & Network Status */}
        <div className="footer-top">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="footerMoonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M50 8 A42 42 0 0 0 50 92 Z" fill="#0E121D" stroke="#8B5CF6" strokeWidth="2.5" />
                <path d="M50 8 A42 42 0 0 1 50 92 Z" fill="url(#footerMoonGrad)" />
              </svg>
              <div>
                <span className="footer-brand-title">SHADOWBALLOT</span>
                <span className="footer-brand-tag">v1.2.0 • Midnight Preprod</span>
              </div>
            </div>
            <p className="footer-mission">
              Decentralized confidential voting on Midnight Network. Your vote is yours. The result belongs to everyone.
            </p>
          </div>

          <div className="footer-status-card">
            <div className="status-row">
              <span className="pulse-dot" />
              <span style={{ fontWeight: 600, color: '#34d399' }}>Midnight {network.toUpperCase()} Live</span>
            </div>
            <div className="contract-tag">
              <span>Contract:</span>
              <code>{MIDNIGHT_CONFIG.contractAddress.substring(0, 8)}...{MIDNIGHT_CONFIG.contractAddress.substring(56)}</code>
            </div>
          </div>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="footer-columns">
          {/* Column 1: Roles & Workspaces */}
          <div className="footer-col">
            <h4 className="footer-col-title">Role Workspaces</h4>
            <ul className="footer-col-list">
              <li>
                <a href="/vote" onClick={(e) => handleNav('vote', e)} className="footer-col-link">
                  <span>🗳️</span> Voter Portal (Private Ballot)
                </a>
              </li>
              <li>
                <a href="/results" onClick={(e) => handleNav('results', e)} className="footer-col-link">
                  <span>📊</span> Public Observer (Live Tallies)
                </a>
              </li>
              <li>
                <a href="/proof" onClick={(e) => handleNav('proof', e)} className="footer-col-link">
                  <span>🛡️</span> Voter Attestation (Proof of Participation)
                </a>
              </li>
              <li>
                <a href="/organizer" onClick={(e) => handleNav('organizer', e)} className="footer-col-link">
                  <span>🏛️</span> Organizer Console (Create & Close)
                </a>
              </li>
              <li>
                <a href="/contract" onClick={(e) => handleNav('contract', e)} className="footer-col-link">
                  <span>🔍</span> Auditor Inspector (ZKIR & Nullifiers)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Cryptographic Architecture */}
          <div className="footer-col">
            <h4 className="footer-col-title">ZK Architecture</h4>
            <ul className="footer-col-list">
              <li className="footer-text-item">
                <strong>Proving System:</strong> Halo2 / PLONK SNARK
              </li>
              <li className="footer-text-item">
                <strong>Smart Contract:</strong> Compact Language v0.23
              </li>
              <li className="footer-text-item">
                <strong>Compiler:</strong> Compact 0.5.2 Toolchain
              </li>
              <li className="footer-text-item">
                <strong>Shielded State:</strong> Private off-chain witness
              </li>
              <li className="footer-text-item">
                <strong>Nullifier Tree:</strong> Replay & double-vote shield
              </li>
            </ul>
          </div>

          {/* Column 3: Consensus & Explorer */}
          <div className="footer-col">
            <h4 className="footer-col-title">Ledger & Verification</h4>
            <ul className="footer-col-list">
              <li>
                <a
                  href={`${MIDNIGHT_CONFIG.explorerUrl}/contract/${MIDNIGHT_CONFIG.contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Night Scan Contract Explorer ↗
                </a>
              </li>
              <li>
                <a
                  href={`${MIDNIGHT_CONFIG.explorerUrl}/tx/${MIDNIGHT_CONFIG.deploymentTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Deployment Transaction ↗
                </a>
              </li>
              <li>
                <a
                  href={MIDNIGHT_CONFIG.proofServerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Preprod Proof Server ↗
                </a>
              </li>
              <li>
                <a
                  href={MIDNIGHT_CONFIG.indexerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Consensus Indexer Endpoint ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Documentation & Protocol */}
          <div className="footer-col">
            <h4 className="footer-col-title">Protocol & Source</h4>
            <ul className="footer-col-list">
              <li>
                <a
                  href="https://github.com/Shashiverm/shadowballot"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  GitHub Repository ↗
                </a>
              </li>
              <li>
                <a
                  href="https://docs.midnight.network"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Midnight Documentation ↗
                </a>
              </li>
              <li>
                <a
                  href="https://docs.midnight.network/develop/tutorial/building/compact"
                  target="_blank"
                  rel="noreferrer"
                  className="footer-col-link"
                >
                  Compact Language Guide ↗
                </a>
              </li>
              <li className="footer-text-item">
                <strong>License:</strong> Apache 2.0 Open Source
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Privacy Guarantee & Timestamp */}
        <div className="footer-bottom">
          <div className="footer-bottom-privacy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>
              Client-Side Zero-Knowledge Privacy: Raw ballot choices and voter credentials never leave your browser enclave.
            </span>
          </div>
          <div className="footer-bottom-copy">
            © {new Date().getFullYear()} ShadowBallot Protocol. Built on Midnight.
          </div>
        </div>
      </div>
    </footer>
  );
};
