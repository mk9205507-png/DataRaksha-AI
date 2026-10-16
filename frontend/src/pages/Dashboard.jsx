import React, { useState } from 'react';
import InputBox from '../components/scanner/InputBox';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import {
  Mail,
  Globe,
  FileCode2,
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { useAuth } from '../context/AuthContext';

// Scenario quick-test presets for each specialized security module
const SCENARIO_PRESETS = {
  message: [
    {
      id: 'bank-kyc',
      label: '🏦 Bank KYC Alert',
      tag: 'Phishing',
      text: 'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours or your account will be permanently frozen.',
    },
    {
      id: 'lottery-fraud',
      label: '🎁 $1,000,000 Lottery',
      tag: 'Scam Prize',
      text: 'CONGRATULATIONS! Your mobile number won 1st prize of $1,000,000 in the International Mobile Rewards Draw. Claim immediately by emailing payout@reward-payout-online.com with your full legal name, PAN number, and bank account details.',
    },
    {
      id: 'job-phish',
      label: '💼 Remote Job Offer',
      tag: 'Extortion',
      text: 'Dear Applicant, Amazon HR selected your profile for Work-From-Home data reviewing paying $450/day. Immediate joining available. Please deposit $50 refundable registration fee to verify your corporate laptop dispatch.',
    },
    {
      id: 'safe-note',
      label: '✅ Safe Team Meeting',
      tag: 'Legitimate',
      text: 'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace. See you soon!',
    },
  ],
  link: [
    {
      id: 'phish-link',
      label: '🚨 Deceptive Login Portal',
      tag: 'Credential Trap',
      text: 'https://security-login-update-credentials.top/account/verify.php',
    },
    {
      id: 'ip-link',
      label: '⚠️ Raw IP Address Host',
      tag: 'Suspicious IP',
      text: 'http://192.168.1.100:8080/secure-update/login',
    },
    {
      id: 'obfuscated-link',
      label: '🔗 Obfuscated Redirect Link',
      tag: 'Deceptive Redirect',
      text: 'http://bit.ly/claim-bank-reward-2026',
    },
    {
      id: 'safe-link',
      label: '✅ Official Verified URL',
      tag: 'Safe Domain',
      text: 'https://www.google.com',
    },
  ],
  policy: [
    {
      id: 'data-broker-policy',
      label: '⚠️ Aggressive Data Selling',
      tag: 'Data Broker Risk',
      text: 'We collect your exact real-time GPS location, web browsing history, device identifiers, biometric facial scans, and contact lists. We reserve the unrestricted right to share, sell, lease, and monetize this information with third-party advertising partners, data brokers, and affiliate networks indefinitely without mandatory prior notice.',
    },
    {
      id: 'biometric-telemetry',
      label: '📱 Telemetry & Biometrics',
      tag: 'High Telemetry',
      text: 'This software continuously records microphone ambient noise, typing cadence, device accelerometer sensors, and application usage telemetry. Telemetry logs are retained indefinitely on commercial cloud servers and may be processed by commercial marketing partners.',
    },
    {
      id: 'privacy-friendly-policy',
      label: '🛡️ Privacy-First Minimalist',
      tag: 'Privacy Safe',
      text: 'We strictly respect your digital privacy. We only collect the minimal email address required to deliver our service. We never sell, rent, or monetize your personal data. All data is encrypted with AES-256 and immediately purged upon account deletion.',
    },
  ],
};

// Module definitions with rich styling tokens
const MODULES_INFO = {
  message: {
    id: 'message',
    title: 'Message & Email Scam Shield',
    badge: 'SMS & Email Defense',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    iconClass: 'cyan',
    icon: Mail,
    shortDesc: 'Deep heuristic analysis for phishing SMS, deceptive banking emails, credential theft, and exposed PII.',
    fullDesc: 'Evaluate suspicious SMS texts, WhatsApp messages, urgent bank notifications, and phishing emails in real-time. Our AI engine flags social engineering manipulation, credential harvesting links, psychological coercion, and exposed personal data (Aadhaar, PAN, payment cards).',
    features: [
      'Phishing & Impersonation Signature Catch',
      'Credential Harvester & OTP Extortion Trap',
      'Urgency & Coercive Language Scoring',
      'Exposed Sensitive PII (Aadhaar, PAN, Cards)',
    ],
    placeholder: 'Paste SMS, WhatsApp text, or email body to inspect...',
    buttonLabel: 'Launch Message Shield',
  },
  link: {
    id: 'link',
    title: 'Safe Link & URL Inspector',
    badge: 'Web & Domain Audit',
    accentColor: '#818cf8',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    iconClass: 'indigo',
    icon: Globe,
    shortDesc: 'Audit web destinations against Google Safe Browsing, evaluate typosquatted domains, and IP hostnames.',
    fullDesc: 'Inspect URLs and domains against Google Safe Browsing threat databases, identify IP address hostnames, deceptive subdomains, and obfuscated redirect chains before you click.',
    features: [
      'Google Safe Browsing v4 Cloud Intelligence',
      'Deceptive Domain & Typosquatting Audit',
      'Raw IP Hostname & Obfuscated Links',
      'Canonical Destination & Redirect Inspection',
    ],
    placeholder: 'Enter web address (e.g., https://example.com)...',
    buttonLabel: 'Launch URL Inspector',
  },
  policy: {
    id: 'policy',
    title: 'Privacy Policy Simplifier',
    badge: 'Legal & Data Privacy',
    accentColor: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    iconClass: 'emerald',
    icon: FileCode2,
    shortDesc: 'Translate 40-page corporate legal terms into plain English. Detect data broker selling and biometric tracking.',
    fullDesc: 'Cut through complex corporate legal jargon. Our privacy engine scans Terms of Service and Privacy Policies to highlight third-party data broker monetization, biometric telemetry, and non-consensual tracking.',
    features: [
      'Third-Party Data Broker Selling Flags',
      'Biometrics, Location & Telemetry Tracking',
      'Data Retention & Deletion Policy Evaluation',
      'One-Click Plain-English Executive Summary',
    ],
    placeholder: 'Paste privacy policy or terms of service text...',
    buttonLabel: 'Launch Policy Simplifier',
  },
};

export const Dashboard = () => {
  const { user } = useAuth();
  // 'hub' = 3-card overview suite; 'message' | 'link' | 'policy' = dedicated page
  const [activeModule, setActiveModule] = useState('hub');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  // Navigate to dedicated module page
  const handleOpenModule = (moduleId) => {
    setActiveModule(moduleId);
    setInputValue('');
    setResult(null);
    setAlert(null);
    setSelectedScenarioId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to Security Hub overview
  const handleBackToHub = () => {
    setActiveModule('hub');
    setInputValue('');
    setResult(null);
    setAlert(null);
    setSelectedScenarioId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load a realistic scenario preset
  const handleSelectScenario = (scenario) => {
    setSelectedScenarioId(scenario.id);
    setInputValue(scenario.text);
    setResult(null);
    setAlert(null);
  };

  const validateInput = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setAlert({
        type: 'warning',
        message: 'Please enter text or a URL to analyze.',
        canRetry: false,
      });
      return false;
    }

    if (trimmed.length > 20000) {
      setAlert({
        type: 'error',
        message: 'Content exceeds the maximum limit of 20,000 characters.',
        canRetry: false,
      });
      return false;
    }

    if (activeModule === 'link') {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
      const ipPattern = /^(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
      if (!urlPattern.test(trimmed) && !ipPattern.test(trimmed)) {
        setAlert({
          type: 'warning',
          message: 'Please enter a valid web address (e.g., https://example.com).',
          canRetry: false,
        });
        return false;
      }
    }

    return true;
  };

  const handleScan = async () => {
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      let scanResponse;

      if (activeModule === 'message') {
        scanResponse = await scanService.scanMessage(inputValue.trim());
      } else if (activeModule === 'link') {
        let targetUrl = inputValue.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = `https://${targetUrl}`;
        }
        scanResponse = await scanService.scanLink(targetUrl);
      } else if (activeModule === 'policy') {
        scanResponse = await scanService.scanPolicy(inputValue.trim());
      }

      setResult(scanResponse);
    } catch (error) {
      let message = 'Threat analysis service is temporarily unavailable. Please try again shortly.';
      const status = error.response?.status;

      if (status === 400) {
        message = 'Please enter text or a URL to analyze.';
      } else if (status === 422) {
        message = 'Please enter a valid web address (e.g., https://example.com).';
      } else if (status === 413) {
        message = 'Content exceeds the maximum limit of 20,000 characters.';
      } else if (status === 429) {
        message = 'Rate limit reached. Please wait a few moments before trying again.';
      } else if (status === 503) {
        message = 'Threat analysis service is temporarily unavailable. Please try again shortly.';
      } else if (error.response?.data?.detail) {
        message =
          typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : message;
      }

      setAlert({
        type: 'error',
        message,
        canRetry: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // VIEW 1: Specialized Dedicated Scanner Page (Message, Link, or Policy)
  // =========================================================================
  if (activeModule !== 'hub') {
    const currentModule = MODULES_INFO[activeModule];
    const CurrentIcon = currentModule.icon;
    const scenarios = SCENARIO_PRESETS[activeModule] || [];

    return (
      <div className="dedicated-module-page" id={`dedicated-page-${activeModule}`}>
        {/* Top Breadcrumb Navigation Bar */}
        <div className="scanner-breadcrumb-bar">
          <button
            type="button"
            className="back-to-hub-btn"
            onClick={handleBackToHub}
            id="back-to-suite-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Security Hub</span>
          </button>

          {/* Quick Module Switcher Pills */}
          <div className="quick-module-pills" role="tablist">
            {Object.values(MODULES_INFO).map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  id={`pill-switch-${mod.id}`}
                  className={`module-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleOpenModule(mod.id)}
                  disabled={isLoading}
                >
                  <Icon size={14} />
                  <span>{mod.title.split(' ')[0]} {mod.title.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Page Hero Header */}
        <div className="dashboard-hero">
          <div className="hero-badge">
            <CurrentIcon size={14} className="hero-badge-icon" />
            <span>{currentModule.badge}</span>
          </div>
          <h1 className="hero-title">
            {currentModule.title.split(' ')[0]} {currentModule.title.split(' ')[1]}{' '}
            <span className="gradient-text">
              {currentModule.title.split(' ').slice(2).join(' ') || 'Scanner'}
            </span>
          </h1>
          <p className="hero-subtitle">{currentModule.fullDesc}</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            action={
              alert.canRetry ? (
                <button
                  type="button"
                  className="btn btn-ghost alert-retry-btn"
                  onClick={() => {
                    setAlert(null);
                    handleScan();
                  }}
                >
                  <RotateCcw size={14} /> Retry
                </button>
              ) : null
            }
          />
        )}

        {/* Realistic Scenario Presets Bar */}
        <div className="scenario-selector-container">
          <span className="scenario-label">
            <Sparkles size={14} /> Quick Scenarios:
          </span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              id={`scenario-chip-${sc.id}`}
              className={`scenario-chip ${selectedScenarioId === sc.id ? 'selected' : ''}`}
              onClick={() => handleSelectScenario(sc)}
              disabled={isLoading}
              title={`Load sample: ${sc.label}`}
            >
              <span>{sc.label}</span>
            </button>
          ))}
        </div>

        {/* Main Scanner Input Box */}
        <InputBox
          scanType={activeModule}
          value={inputValue}
          onChange={(val) => {
            setInputValue(val);
            if (alert) setAlert(null);
            if (selectedScenarioId) setSelectedScenarioId(null);
          }}
          onSubmit={handleScan}
          isLoading={isLoading}
          onLoadSample={() => {
            if (scenarios.length > 0) {
              handleSelectScenario(scenarios[0]);
            }
          }}
          onClear={() => {
            setInputValue('');
            setResult(null);
            setAlert(null);
            setSelectedScenarioId(null);
          }}
        />

        {/* Loading Skeleton Animation */}
        {isLoading && (
          <div className="report-card glass-card skeleton-card" id="scan-loading-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-circle"></div>
              <div className="skeleton-lines">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-subtitle"></div>
              </div>
            </div>
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-full"></div>
              <div className="skeleton-line skeleton-full"></div>
              <div className="skeleton-line skeleton-half"></div>
            </div>
          </div>
        )}

        {/* Comprehensive Threat Report Result */}
        {!isLoading && result && <ResultCard report={result} />}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Master Security Suite Overview Hub (3 Specialized Modules)
  // =========================================================================
  return (
    <div className="dashboard-page" id="dashboard-view">
      {/* Top Welcome Hero */}
      <div className="dashboard-hero">
        <div className="hero-badge">
          <Shield size={14} className="hero-badge-icon" />
          <span>Threat Intelligence Grid Active</span>
        </div>
        <h1 className="hero-title">
          {user?.displayName ? (
            <>
              Welcome, <span className="gradient-text">{user.displayName}</span> — Digital Risk Shield
            </>
          ) : (
            <>
              Detect Digital Risks & Protect <span className="gradient-text">Personal Data</span>
            </>
          )}
        </h1>
        <p className="hero-subtitle">
          Select a specialized security defense module below to inspect suspicious messages, audit dangerous web links, or simplify corporate privacy policies.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* 3 Interactive Specialized Security Module Cards */}
      <div className="security-hub-container">
        <div className="security-modules-grid">
          {Object.values(MODULES_INFO).map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                id={`module-card-${mod.id}`}
                className="security-module-card glass-card"
                style={{
                  '--module-accent': mod.accentColor,
                  '--module-glow': mod.glowColor,
                }}
                onClick={() => handleOpenModule(mod.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenModule(mod.id);
                  }
                }}
              >
                <div className="module-card-top">
                  <div className={`module-icon-badge ${mod.iconClass}`}>
                    <Icon size={26} />
                  </div>
                  <div>
                    <h2 className="module-card-title">{mod.title}</h2>
                    <p className="module-card-desc">{mod.shortDesc}</p>
                  </div>

                  <div className="module-features-list">
                    {mod.features.map((feature, idx) => (
                      <div key={idx} className="module-feature-item">
                        <span className="module-feature-bullet"></span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="module-card-bottom">
                  <button
                    type="button"
                    className="module-launch-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModule(mod.id);
                    }}
                  >
                    <span>{mod.buttonLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Security Trust Pillars */}
        <div className="hub-trust-banner">
          <div className="trust-item">
            <Zap size={20} className="text-cyan" />
            <div>
              <strong>Sub-Second Heuristics</strong>
              <div className="text-muted">Instant AI & NLP signature matching</div>
            </div>
          </div>
          <div className="trust-item">
            <Lock size={20} className="text-cyan" />
            <div>
              <strong>Zero Log Retention</strong>
              <div className="text-muted">Analyzed in ephemeral sandbox memory</div>
            </div>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={20} className="text-cyan" />
            <div>
              <strong>Legal Rights Ready</strong>
              <div className="text-muted">1-Click DPDP & GDPR deletion letters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

