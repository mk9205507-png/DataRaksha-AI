import React from 'react';
import {
  Shield,
  Mail,
  Link2,
  FileText,
  ArrowRight,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.displayName || user?.name || 'User';

  const handleGetStarted = () => {
    if (isAuthenticated) {
      onNavigate('dashboard');
    } else if (onOpenAuth) {
      onOpenAuth('login', 'Sign in or create an account to start protecting your digital privacy.');
    } else {
      onNavigate('auth');
    }
  };

  return (
    <div className="landing-page light-theme" id="landing-home">
      {/* Top Navigation Bar */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          {/* Logo & Brand */}
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Shield size={24} className="shield-icon" />
            </div>
            <span className="landing-brand-title">DataRaksha AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="landing-nav-links">
            <a href="#capabilities" className="landing-nav-link">Capabilities</a>
            <a href="#footer" className="landing-nav-link">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  id="landing-dashboard-btn"
                  className="btn btn-secondary landing-btn-signin"
                  onClick={() => onNavigate('dashboard')}
                  title="Open Dashboard"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard ({displayName})</span>
                </button>
                <button
                  type="button"
                  id="landing-signout-btn"
                  className="btn btn-ghost landing-btn-signout"
                  onClick={async () => {
                    await logout();
                  }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="landing-getstarted-btn"
                className="btn btn-primary landing-btn-getstarted"
                onClick={handleGetStarted}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-container simple-hero">
          <div className="landing-hero-content text-center max-w-2xl mx-auto">
            {/* Pill Badge */}
            <div className="hero-pill-badge mx-auto">
              <span>AI-Powered Privacy & Digital Risk Protection</span>
            </div>

            {/* Exact Required Heading */}
            <h1 className="hero-headline">
              Your Privacy. <span className="hero-headline-highlight">Our Priority.</span>
            </h1>

            {/* Exact Required Description */}
            <p className="hero-description">
              Detect digital risks, understand privacy policies, and make safer decisions online with AI-powered analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Small Section: Three Capabilities */}
      <section className="landing-capabilities-section" id="capabilities">
        <div className="landing-section-container">
          <div className="section-header text-center">
            <h2 className="section-title">Core Security Capabilities</h2>
            <p className="section-desc">
              Three essential tools designed to safeguard your online identity and personal information.
            </p>
          </div>

          <div className="capabilities-grid">
            {/* Capability 1: Email Security */}
            <div
              className="capability-card card"
              onClick={handleGetStarted}
              role="button"
              tabIndex={0}
            >
              <div className="capability-icon-box icon-email-bg">
                <Mail size={26} className="text-blue" />
              </div>
              <h3 className="capability-card-title">Email Security</h3>
              <p className="capability-card-text">
                Scan suspicious messages and emails for phishing tactics, urgent coercion cues, and exposed sensitive personal identifiers before clicking.
              </p>
              <div className="capability-card-link">
                <span>Explore Email Security</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Capability 2: URL Security */}
            <div
              className="capability-card card"
              onClick={handleGetStarted}
              role="button"
              tabIndex={0}
            >
              <div className="capability-icon-box icon-url-bg">
                <Link2 size={26} className="text-cyan" />
              </div>
              <h3 className="capability-card-title">URL Security</h3>
              <p className="capability-card-text">
                Verify suspicious web links and domains against real-time threat intelligence feeds to protect against malicious websites and credential theft.
              </p>
              <div className="capability-card-link">
                <span>Explore URL Security</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Capability 3: Privacy Policy Analysis */}
            <div
              className="capability-card card"
              onClick={handleGetStarted}
              role="button"
              tabIndex={0}
            >
              <div className="capability-icon-box icon-policy-bg">
                <FileText size={26} className="text-indigo" />
              </div>
              <h3 className="capability-card-title">Privacy Policy Analysis</h3>
              <p className="capability-card-text">
                Translate dense terms and privacy policies into clear, plain language summaries to uncover third-party data selling, continuous telemetry, and statutory rights.
              </p>
              <div className="capability-card-link">
                <span>Explore Policy Analysis</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="landing-footer" id="footer">
        <div className="landing-footer-container">
          <div className="footer-left">
            <div className="landing-brand">
              <div className="landing-brand-icon sm">
                <Shield size={18} />
              </div>
              <span className="landing-brand-title">DataRaksha AI</span>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} DataRaksha AI. Empowering digital privacy & risk protection.
            </p>
          </div>
          <div className="footer-links">
            <a href="#capabilities">Capabilities</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
