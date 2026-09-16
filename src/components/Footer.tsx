import React from 'react';
import { MIDNIGHT_CONFIG } from '../lib/midnight';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>SHADOWBALLOT</span>
          <span>—</span>
          <span>Private choices. Public truth.</span>
        </div>

        <div className="footer-links">
          <a
            href={MIDNIGHT_CONFIG.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Midnight Explorer ↗
          </a>
          <a
            href="https://docs.midnight.network"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Docs ↗
          </a>
          <a
            href="https://github.com/Shashiverm/shadowballot"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            GitHub ↗
          </a>
          <span>Apache 2.0</span>
        </div>
      </div>
    </footer>
  );
};
