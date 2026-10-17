import React from 'react';
import {
  Shield,
  Mail,
  Link2,
  FileText,
  Bot,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  ChevronRight,
  Sparkles,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const displayName =
    user?.displayName ||
    user?.name ||
    (isAuthenticated ? localStorage.getItem('dataraksha_person_name') : '') ||
    '';

  const handleProtectedNavigate = (targetTab = 'dashboard') => {
    if (isAuthenticated) {
      onNavigate(targetTab);
    } else {
      if (onOpenAuth) {
        onOpenAuth(targetTab, 'Please sign in to continue.');
      } else {
        onNavigate('auth');
      }
    }
  };

  return (
    <div className="landing-page" id="landing-home">
      {/* Top Navigation Bar (Matching Reference Screen 1) */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          {/* Brand Logo */}
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Shield size={24} className="shield-icon" />
            </div>
            <span className="landing-brand-title">DataRaksha AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="landing-nav-links">
            <a href="#landing-home" className="landing-nav-link active">Home</a>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#about" className="landing-nav-link">About</a>
          </nav>

          {/* Auth Action Buttons with Sign Out */}
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  id="landing-welcome-btn"
                  className="btn btn-secondary landing-btn-signin"
                  onClick={() => onNavigate('dashboard')}
                  title="Open Dashboard"
                >
                  <User size={14} className="text-blue" />
                  <span>Welcome, <strong>{displayName}</strong></span>
                </button>
                <button
                  type="button"
                  id="landing-signout-btn"
                  className="btn btn-ghost landing-btn-signout"
                  onClick={async () => {
                    await logout();
                    if (onNavigate) onNavigate('home');
                  }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="landing-signin-btn"
                className="btn btn-secondary landing-btn-signin"
                onClick={() => (onOpenAuth ? onOpenAuth('dashboard') : onNavigate('auth'))}
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              id="landing-getstarted-btn"
              className="btn btn-primary landing-btn-getstarted"
              onClick={() => handleProtectedNavigate('dashboard')}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-container">
          {/* Left Hero Content */}
          <div className="landing-hero-content">
            {/* Pill Badge */}
            <div className="hero-pill-badge">
              <span>AI-Powered Privacy & Digital Risk Protection</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-headline">
              Stay Safe in the<br />
              <span className="hero-headline-highlight">Digital World</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-description">
              DataRaksha AI helps you detect digital threats, analyse suspicious
              content and protect your privacy with the power of AI.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-group">
              <button
                type="button"
                id="hero-cta-getstarted"
                className="btn btn-primary hero-btn-main"
                onClick={() => handleProtectedNavigate('dashboard')}
              >
                <span>Get Started</span>
              </button>
              <a
                href="#features"
                className="btn btn-secondary hero-btn-sub"
              >
                <span>Learn More</span>
              </a>
            </div>

            {/* Quick Feature Chips Row (Matching Reference) */}
            <div className="hero-feature-chips">
              <button
                type="button"
                className="feature-chip chip-email"
                onClick={() => handleProtectedNavigate('email')}
                title="Open Email Safety Scanner"
              >
                <Mail size={16} className="chip-icon icon-email" />
                <span>Email Safety</span>
              </button>

              <button
                type="button"
                className="feature-chip chip-url"
                onClick={() => handleProtectedNavigate('url')}
                title="Open URL Security Scanner"
              >
                <Link2 size={16} className="chip-icon icon-url" />
                <span>URL Security</span>
              </button>

              <button
                type="button"
                className="feature-chip chip-policy"
                onClick={() => handleProtectedNavigate('policy')}
                title="Open Privacy Policy Simplifier"
              >
                <FileText size={16} className="chip-icon icon-policy" />
                <span>Privacy Policy</span>
              </button>

              <button
                type="button"
                className="feature-chip chip-ai"
                onClick={() => handleProtectedNavigate('dashboard')}
                title="View AI Threat Dashboard"
              >
                <Bot size={16} className="chip-icon icon-ai" />
                <span>AI Analysis</span>
              </button>
            </div>
          </div>

          {/* Right Hero Graphic / Illustration (Matching Reference Screen 1) */}
          <div className="landing-hero-graphic" aria-hidden="true">
            <div className="graphic-backdrop-cloud"></div>

            {/* Floating Card: Email Icon */}
            <div className="floating-card float-mail">
              <div className="float-icon-box mail-box">
                <Mail size={22} />
              </div>
            </div>

            {/* Floating Card: URL Link Chain */}
            <div className="floating-card float-link">
              <div className="float-icon-box link-box">
                <Link2 size={22} />
              </div>
            </div>

            {/* Floating Card: Privacy Policy Document */}
            <div className="floating-card float-doc">
              <div className="float-icon-box doc-box">
                <FileText size={22} />
              </div>
            </div>

            {/* Center Laptop Illustration with Shield & Lock */}
            <div className="laptop-illustration">
              <div className="laptop-screen">
                <div className="screen-inner-display">
                  <div className="screen-shield-badge">
                    <Shield size={54} className="screen-shield-icon" />
                    <Lock size={20} className="screen-lock-icon" />
                  </div>
                  <div className="screen-glow-ring"></div>
                </div>
              </div>
              <div className="laptop-base">
                <div className="laptop-notch"></div>
              </div>
              <div className="laptop-shadow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="landing-features-section" id="features">
        <div className="landing-section-container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Enterprise-Grade Protection</span>
            <h2 className="section-title">Comprehensive AI Safety Modules</h2>
            <p className="section-desc">
              Protect your digital presence against deceptive phishing campaigns, predatory policies, and malicious links.
            </p>
          </div>

          <div className="features-grid">
            <div
              className="feature-card card"
              onClick={() => handleProtectedNavigate('email')}
              role="button"
              tabIndex={0}
            >
              <div className="feature-card-icon icon-email-bg">
                <Mail size={26} className="text-blue" />
              </div>
              <h3 className="feature-card-title">Email & Message Safety</h3>
              <p className="feature-card-text">
                Detect phishing tactics, high-pressure urgency cues, and exposed sensitive PII before clicking or responding.
              </p>
              <div className="feature-card-link">
                <span>Scan Email Now</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div
              className="feature-card card"
              onClick={() => handleProtectedNavigate('url')}
              role="button"
              tabIndex={0}
            >
              <div className="feature-card-icon icon-url-bg">
                <Link2 size={26} className="text-cyan" />
              </div>
              <h3 className="feature-card-title">URL Security Inspector</h3>
              <p className="feature-card-text">
                Scan suspicious links and domains against Google Safe Browsing threat feeds to prevent credential theft.
              </p>
              <div className="feature-card-link">
                <span>Check Website</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div
              className="feature-card card"
              onClick={() => handleProtectedNavigate('policy')}
              role="button"
              tabIndex={0}
            >
              <div className="feature-card-icon icon-policy-bg">
                <FileText size={26} className="text-indigo" />
              </div>
              <h3 className="feature-card-title">Privacy Policy Simplifier</h3>
              <p className="feature-card-text">
                Demystify lengthy legal policies into plain language summaries, uncover data-broker sharing, and enforce DPDP rights.
              </p>
              <div className="feature-card-link">
                <span>Simplify Policy</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="landing-about-section" id="about">
        <div className="landing-section-container">
          <div className="about-banner card">
            <div className="about-banner-content">
              <div className="about-badge">
                <Sparkles size={16} />
                <span>Built for Everyday Users & Organizations</span>
              </div>
              <h2 className="about-title">Why Trust DataRaksha AI?</h2>
              <div className="about-points">
                <div className="about-point">
                  <CheckCircle2 size={20} className="point-icon" />
                  <div>
                    <strong>Zero-Log Retention Architecture</strong>
                    <p>Scanned messages and links are analyzed in ephemeral memory and never sold or persisted without consent.</p>
                  </div>
                </div>
                <div className="about-point">
                  <CheckCircle2 size={20} className="point-icon" />
                  <div>
                    <strong>Statutory Rights Ready (DPDP Act 2023 & GDPR)</strong>
                    <p>Generate legally compliant data erasure and access request notices directly from policy scan findings.</p>
                  </div>
                </div>
                <div className="about-point">
                  <CheckCircle2 size={20} className="point-icon" />
                  <div>
                    <strong>Real-time AI Heuristics</strong>
                    <p>Sub-second threat classification powered by Google Gemini AI and threat pattern matching.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-banner-action">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleProtectedNavigate('dashboard')}
              >
                Explore Live Dashboard <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-left">
            <div className="landing-brand">
              <div className="landing-brand-icon sm">
                <Shield size={18} />
              </div>
              <span className="landing-brand-title">DataRaksha AI</span>
            </div>
            <p className="footer-copy">© 2026 DataRaksha AI. Empowering digital privacy & safety.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => (onOpenAuth ? onOpenAuth('dashboard') : onNavigate('auth'))}
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
