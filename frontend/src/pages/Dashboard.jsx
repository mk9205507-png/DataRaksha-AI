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
  Activity,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { historyService } from '../services/historyService';
import { useAuth } from '../context/AuthContext';

// Scenario quick-test presets for each specialized security module
const SCENARIO_PRESETS = {
  message: [
    {
      id: 'bank-kyc',
      label: '🏦 Bank KYC Alert',
      tag: 'Phishing',
      company: 'State Bank of India',
      text: 'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours or your account will be permanently frozen.',
    },
    {
      id: 'lottery-fraud',
      label: '🎁 $1,000,000 Lottery',
      tag: 'Scam Prize',
      company: 'International Rewards Syndicate',
      text: 'CONGRATULATIONS! Your mobile number won 1st prize of $1,000,000 in the International Mobile Rewards Draw. Claim immediately by emailing payout@reward-payout-online.com with your full legal name, PAN number, and bank account details.',
    },
    {
      id: 'job-phish',
      label: '💼 Remote Job Offer',
      tag: 'Extortion',
      company: 'Global Recruitment Portal',
      text: 'Dear Applicant, Amazon HR selected your profile for Work-From-Home data reviewing paying $450/day. Immediate joining available. Please deposit $50 refundable registration fee to verify your corporate laptop dispatch.',
    },
    {
      id: 'safe-note',
      label: '✅ Safe Team Meeting',
      tag: 'Legitimate',
      company: 'Internal Team',
      text: 'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace. See you soon!',
    },
  ],
  link: [
    {
      id: 'phish-link',
      label: '🚨 Deceptive Login Portal',
      tag: 'Credential Trap',
      company: 'Security Update Portal',
      text: 'https://security-login-update-credentials.top/account/verify.php',
    },
    {
      id: 'ip-link',
      label: '⚠️ Raw IP Address Host',
      tag: 'IP Hostname',
      company: 'Anonymous Host',
      text: 'http://192.168.1.100/secure-update-patch.exe',
    },
    {
      id: 'safe-link',
      label: '🛡️ Official Developer Portal',
      tag: 'Legitimate Web',
      company: 'Google Cloud',
      text: 'https://cloud.google.com/security/products',
    },
    {
      id: 'short-link',
      label: '🔗 Shortened Obfuscated URL',
      tag: 'Obfuscated Link',
      company: 'Unknown URL Shortener',
      text: 'http://bit.ly/claim-bank-cashback-instant',
    },
  ],
  policy: [
    {
      id: 'data-selling-policy',
      label: '⚠️ Aggressive Data Selling',
      tag: 'Data Broker Risk',
      company: 'Acme Social Network Inc.',
      text: 'We collect your exact real-time GPS location, web browsing history, device identifiers, biometric facial scans, and contact lists. We reserve the unrestricted right to share, sell, lease, and monetize this information with third-party advertising partners, data brokers, and affiliate networks indefinitely without mandatory prior notice.',
    },
    {
      id: 'biometric-telemetry',
      label: '📱 Telemetry & Biometrics',
      tag: 'High Telemetry',
      company: 'Smart Voice Telemetry Corp',
      text: 'This software continuously records microphone ambient noise, typing cadence, device accelerometer sensors, and application usage telemetry. Telemetry logs are retained indefinitely on commercial cloud servers and may be processed by commercial marketing partners.',
    },
    {
      id: 'privacy-friendly-policy',
      label: '🛡️ Privacy-First Minimalist',
      tag: 'Privacy Safe',
      company: 'OpenSource Privacy Org',
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

export const Dashboard = ({ onNavigateToLetters }) => {
  const { user } = useAuth();
  // 'hub' = 3-card overview suite; 'message' | 'link' | 'policy' = dedicated page
  const [activeModule, setActiveModule] = useState('hub');
  
  // Context preservation: store inputs per module so tab switches do not erase typing!
  const [moduleInputs, setModuleInputs] = useState({
    message: '',
    link: '',
    policy: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [detectedCompany, setDetectedCompany] = useState('');

  const currentInput = activeModule === 'hub' ? '' : moduleInputs[activeModule] || '';

  const handleInputChange = (text) => {
    if (activeModule !== 'hub') {
      setModuleInputs((prev) => ({ ...prev, [activeModule]: text }));
    }
  };

  // Navigate to dedicated module page
  const handleOpenModule = (moduleId) => {
    setActiveModule(moduleId);
    setResult(null);
    setAlert(null);
    setSelectedScenarioId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to Security Hub overview
  const handleBackToHub = () => {
    setActiveModule('hub');
    setResult(null);
    setAlert(null);
    setSelectedScenarioId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load a realistic scenario preset
  const handleSelectScenario = (scenario) => {
    setSelectedScenarioId(scenario.id);
    handleInputChange(scenario.text);
    if (scenario.company) setDetectedCompany(scenario.company);
    setResult(null);
    setAlert(null);
  };

  const handleClear = () => {
    handleInputChange('');
    setResult(null);
    setAlert(null);
    setSelectedScenarioId(null);
    setDetectedCompany('');
  };

  const validateInput = () => {
    const trimmed = currentInput.trim();

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
          message: 'Please enter a valid web address format (e.g., https://example.com).',
          canRetry: false,
        });
        return false;
      }
    }

    return true;
  };

  const handleScan = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    setAlert(null);
    setResult(null);

    try {
      let scanResponse;
      const textToScan = currentInput.trim();

      switch (activeModule) {
        case 'message':
          scanResponse = await scanService.scanMessage(textToScan);
          break;
        case 'link':
          scanResponse = await scanService.scanLink(textToScan);
          break;
        case 'policy':
          scanResponse = await scanService.scanPolicy(textToScan);
          break;
        default:
          throw new Error('Invalid analysis module selected.');
      }

      const reportData = {
        ...scanResponse,
        target_company: detectedCompany,
      };

      setResult(reportData);

      historyService.saveScanRecord({
        scan_type: activeModule,
        preview: textToScan,
        result: reportData,
        target_company: detectedCompany,
      });

      // Smooth scroll to report
      setTimeout(() => {
        const resultElement = document.getElementById('scan-result-card');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch (err) {
      let errorMessage = 'Threat analysis service is temporarily unavailable. Please try again shortly.';
      let statusCode = err?.response?.status;

      if (statusCode === 400) {
        errorMessage = err.response.data?.detail || 'Please enter text or a URL to analyze.';
      } else if (statusCode === 413) {
        errorMessage = 'Content exceeds the maximum limit of 20,000 characters.';
      } else if (statusCode === 422) {
        errorMessage = 'Please enter a valid web address (e.g., https://example.com).';
      } else if (statusCode === 429) {
        errorMessage = 'Analysis rate limit reached. Please wait a few moments before trying again.';
      } else if (statusCode === 503) {
        errorMessage = 'Cloud threat intelligence service is temporarily unavailable. Please try again.';
      }

      setAlert({
        type: 'error',
        message: errorMessage,
        canRetry: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cross-module action to draft letter
  const handleDraftLetterFromReport = (companyName, summary) => {
    if (onNavigateToLetters) {
      onNavigateToLetters({
        company_name: companyName || detectedCompany,
        custom_notes: summary,
      });
    }
  };

  // =========================================================================
  // VIEW 1: All-In-One Security Hub (Overview of 3 Modules)
  // =========================================================================
  if (activeModule === 'hub') {
    return (
      <div className="dashboard-container" id="dashboard-view">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-badge">
            <Shield size={14} className="hero-badge-icon text-cyan" />
            <span>AI-Powered Cybersecurity Protection Hub</span>
          </div>
          <h1 className="hero-title">
            Intelligent Threat & <span className="gradient-text">Privacy Defense</span>
          </h1>
          <p className="hero-subtitle">
            Autonomous heuristic analysis across suspicious messages, phishing URLs, and dense corporate privacy policies. Select a specialized security module below to begin.
          </p>
        </div>

        {/* Global Security Status Banner */}
        <div className="hub-status-banner glass-card">
          <div className="status-banner-left">
            <span className="live-pulse-dot"></span>
            <div>
              <span className="banner-title">Threat Detection Engines Active</span>
              <p className="banner-sub">
                Google Gemini Heuristic AI • Safe Browsing v4 Cloud Intelligence • Zero-PII In-Memory Processing
              </p>
            </div>
          </div>
          <div className="status-banner-right">
            <span className="hub-active-pill">
              <Activity size={13} /> Real-Time Protection
            </span>
          </div>
        </div>

        {/* 3 Specialized Module Cards */}
        <div className="modules-trio-grid">
          {/* Card 1: Message & Email Scam Shield */}
          <div className="module-feature-card glass-card cyan-theme" id="module-card-message">
            <div className="card-top-row">
              <div className="module-icon-box cyan">
                <Mail size={24} />
              </div>
              <span className="module-type-badge cyan">{MODULES_INFO.message.badge}</span>
            </div>
            <h3 className="module-title">{MODULES_INFO.message.title}</h3>
            <p className="module-desc">{MODULES_INFO.message.shortDesc}</p>
            <ul className="module-features-list">
              {MODULES_INFO.message.features.map((feat, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={13} className="text-cyan" /> {feat}
                </li>
              ))}
            </ul>
            <button
              id="open-module-message-btn"
              type="button"
              className="btn btn-primary full-width-btn"
              onClick={() => handleOpenModule('message')}
            >
              <span>{MODULES_INFO.message.buttonLabel}</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Card 2: Safe Link & URL Inspector */}
          <div className="module-feature-card glass-card indigo-theme" id="module-card-link">
            <div className="card-top-row">
              <div className="module-icon-box indigo">
                <Globe size={24} />
              </div>
              <span className="module-type-badge indigo">{MODULES_INFO.link.badge}</span>
            </div>
            <h3 className="module-title">{MODULES_INFO.link.title}</h3>
            <p className="module-desc">{MODULES_INFO.link.shortDesc}</p>
            <ul className="module-features-list">
              {MODULES_INFO.link.features.map((feat, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={13} className="text-indigo" /> {feat}
                </li>
              ))}
            </ul>
            <button
              id="open-module-link-btn"
              type="button"
              className="btn btn-secondary full-width-btn indigo-action"
              onClick={() => handleOpenModule('link')}
            >
              <span>{MODULES_INFO.link.buttonLabel}</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Card 3: Privacy Policy Simplifier */}
          <div className="module-feature-card glass-card emerald-theme" id="module-card-policy">
            <div className="card-top-row">
              <div className="module-icon-box emerald">
                <FileCode2 size={24} />
              </div>
              <span className="module-type-badge emerald">{MODULES_INFO.policy.badge}</span>
            </div>
            <h3 className="module-title">{MODULES_INFO.policy.title}</h3>
            <p className="module-desc">{MODULES_INFO.policy.shortDesc}</p>
            <ul className="module-features-list">
              {MODULES_INFO.policy.features.map((feat, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={13} className="text-emerald" /> {feat}
                </li>
              ))}
            </ul>
            <button
              id="open-module-policy-btn"
              type="button"
              className="btn btn-secondary full-width-btn emerald-action"
              onClick={() => handleOpenModule('policy')}
            >
              <span>{MODULES_INFO.policy.buttonLabel}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Trust & Privacy Guarantee Bar */}
        <div className="hub-trust-banner">
          <div className="trust-item">
            <Lock size={16} className="text-cyan" />
            <span>Zero-PII Retention: <strong>Raw text is never saved</strong></span>
          </div>
          <div className="trust-item">
            <Zap size={16} className="text-amber" />
            <span>Real-Time Latency: <strong>Sub-second heuristic classification</strong></span>
          </div>
          <div className="trust-item">
            <Shield size={16} className="text-emerald" />
            <span>Statutory Privacy: <strong>DPDP Act 2023 & GDPR Aligned</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Dedicated Specialized Scanning Engine Page
  // =========================================================================
  const mod = MODULES_INFO[activeModule];
  const ModIcon = mod.icon;
  const presets = SCENARIO_PRESETS[activeModule] || [];

  return (
    <div className="dashboard-container dedicated-module-view" id={`module-view-${activeModule}`}>
      {/* Top Breadcrumb Navigation */}
      <div className="module-page-topbar">
        <button
          type="button"
          className="btn btn-ghost action-sm back-to-hub-btn"
          onClick={handleBackToHub}
          title="Return to Security Overview Hub"
        >
          <ArrowLeft size={15} />
          <span>Back to All Security Modules</span>
        </button>

        {/* Quick Module Switcher Tabs */}
        <div className="header-module-tabs">
          {Object.values(MODULES_INFO).map((m) => {
            const TabIcon = m.icon;
            const isSelected = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`module-tab-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleOpenModule(m.id)}
              >
                <TabIcon size={14} />
                <span>{m.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Header */}
      <div className="dashboard-hero module-hero">
        <div className="hero-badge">
          <ModIcon size={14} className="hero-badge-icon" />
          <span>{mod.badge}</span>
        </div>
        <h1 className="hero-title">{mod.title}</h1>
        <p className="hero-subtitle">{mod.fullDesc}</p>
      </div>

      {/* Realistic Scenario Presets Bar */}
      {presets.length > 0 && (
        <div className="scenario-presets-bar glass-card">
          <div className="preset-bar-header">
            <div className="preset-header-title">
              <Sparkles size={14} className="text-cyan" />
              <span>Realistic Testing Scenarios:</span>
            </div>
            <span className="preset-hint">Click any preset to auto-fill input</span>
          </div>
          <div className="scenario-chips-row">
            {presets.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`scenario-chip ${selectedScenarioId === s.id ? 'selected' : ''}`}
                onClick={() => handleSelectScenario(s)}
                disabled={isLoading}
              >
                <span className="chip-label">{s.label}</span>
                <span className="chip-tag">{s.tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error & Warning Alert Banner */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          onRetry={alert.canRetry ? handleScan : null}
        />
      )}

      {/* Input Box Component */}
      <InputBox
        scanType={activeModule}
        value={currentInput}
        onChange={handleInputChange}
        onSubmit={handleScan}
        isLoading={isLoading}
        onClear={handleClear}
      />

      {/* Threat Report Card Output */}
      {result && (
        <ResultCard
          report={result}
          onDraftLetter={handleDraftLetterFromReport}
        />
      )}
    </div>
  );
};

export default Dashboard;
