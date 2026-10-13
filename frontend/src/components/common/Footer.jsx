import React from 'react';
import { Shield, Heart, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="footer-section" id="main-footer">
      <div className="container footer-container">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <Shield className="footer-icon" size={20} />
            <span className="footer-title">DataRaksha AI</span>
          </div>
          <p className="footer-desc">
            Autonomous threat detection & privacy simplification platform. Protecting digital identities under modern data protection frameworks (DPDP / GDPR).
          </p>
        </div>

        <div className="footer-col disclaimer-col">
          <div className="disclaimer-badge">
            <ShieldCheck size={16} />
            <span>Privacy First Architecture</span>
          </div>
          <p className="footer-disclaimer-text">
            DataRaksha AI operates on zero persistent retention for raw scanned messages and policies. Analysis runs in-memory.
          </p>
        </div>

        <div className="footer-col bottom-col">
          <p className="copyright-text">
            © 2026 DataRaksha AI. Built with <Heart size={14} className="heart-icon" /> by Team DataRaksha.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
