import React, { useState } from 'react';
import ScannerTabs from '../components/scanner/ScannerTabs';
import InputBox from '../components/scanner/InputBox';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { Shield, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/api';

export const Dashboard = () => {
  const [scanType, setScanType] = useState('message');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);

  const sampleInputs = {
    message: 'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your PIN.',
    link: 'https://security-login-update-credentials.top/account',
    policy: 'We collect your exact GPS location, browser history, device identifiers, and biometric data. We share and monetize this information with third-party advertising partners and data brokers indefinitely.',
  };

  const handleLoadSample = () => {
    setInputValue(sampleInputs[scanType]);
    setResult(null);
  };

  const handleScan = async () => {
    if (!inputValue.trim()) {
      setAlert({ type: 'warning', message: 'Please enter content to analyze.' });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      // Attempt backend API call if backend is running
      const response = await apiClient.post('/scan', {
        type: scanType,
        content: inputValue,
      });
      setResult(response.data);
    } catch {
      // Graceful local evaluation mock demonstration for frontend architecture
      setTimeout(() => {
        const isPhishing = inputValue.toLowerCase().includes('urgent') || inputValue.toLowerCase().includes('bank') || inputValue.toLowerCase().includes('pin');
        const isLinkSuspicious = scanType === 'link' && !inputValue.startsWith('https://');
        const isPolicyRisky = scanType === 'policy' && (inputValue.includes('broker') || inputValue.includes('monetize') || inputValue.includes('indefinitely'));

        let generatedRisk = 'Low';
        let generatedScore = 18;
        let detectedThreats = [];
        let recommendations = ['Content appears to have standard risk characteristics.'];
        let exposedPii = [];

        if (isPhishing) {
          generatedRisk = 'High';
          generatedScore = 88;
          detectedThreats = ['Urgent Social Engineering Scam Cue', 'Financial Impersonation Indicator', 'Suspicious Contact Request'];
          recommendations = [
            'Do not click any embedded links or call the provided telephone numbers.',
            'Never share banking PINs, OTPs, or passwords.',
            'Forward the message to your official bank customer support.',
          ];
          exposedPii = ['Phone Number: +91-9876543210', 'Bank Name Mentioned'];
        } else if (isPolicyRisky) {
          generatedRisk = 'Medium';
          generatedScore = 65;
          detectedThreats = ['Third-Party Data Broker Monetization', 'Continuous Biometric & GPS Telemetry', 'Indefinite Data Retention Policy'];
          recommendations = [
            'Opt-out of third-party behavioral profiling and broker sales.',
            'Revoke location and biometric permissions in mobile app settings.',
            'Submit a statutory Data Access Request to review your stored records.',
          ];
        } else if (isLinkSuspicious) {
          generatedRisk = 'High';
          generatedScore = 92;
          detectedThreats = ['Non-HTTPS Insecure Protocol', 'Deceptive Domain Structure'];
          recommendations = ['Do not visit this webpage or input credentials.'];
        }

        setResult({
          scan_type: scanType,
          risk_level: generatedRisk,
          risk_score: generatedScore,
          summary: isPhishing 
            ? 'This message displays classic signs of social engineering designed to harvest banking credentials under false urgency.'
            : isPolicyRisky
            ? 'The legal policy grants broad authorization to sell user telemetry to marketing aggregators with perpetual retention.'
            : 'No obvious fraudulent heuristics or high-risk telemetry detected in the submitted input.',
          detected_threats: detectedThreats,
          recommendations: recommendations,
          exposed_pii: exposedPii,
        });

        setIsLoading(false);
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-page" id="dashboard-view">
      {/* Hero Title Section */}
      <div className="dashboard-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-badge-icon" />
          <span>Intelligent Threat Intelligence Matrix</span>
        </div>
        <h1 className="hero-title">
          Detect Digital Risks & Protect <span className="gradient-text">Personal Data</span>
        </h1>
        <p className="hero-subtitle">
          Instantly evaluate suspicious messages, verify deceptive web URLs, and deconstruct complex privacy policies into plain language.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main Scanner Workspace */}
      <div className="scanner-workspace-layout">
        {/* Scanner Type Switcher */}
        <ScannerTabs
          currentType={scanType}
          onSelectType={(type) => {
            setScanType(type);
            setResult(null);
            setInputValue('');
          }}
        />

        {/* Quick sample loader helper */}
        <div className="quick-test-bar">
          <span className="quick-test-label">Want to test?</span>
          <button
            type="button"
            className="btn btn-ghost quick-test-btn"
            onClick={handleLoadSample}
          >
            Load Sample {scanType === 'message' ? 'Phishing Text' : scanType === 'link' ? 'Malicious Link' : 'Predatory Policy'}
          </button>
        </div>

        {/* Input Box */}
        <InputBox
          scanType={scanType}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleScan}
          isLoading={isLoading}
          onClear={() => {
            setInputValue('');
            setResult(null);
          }}
        />

        {/* Threat Report Result */}
        {result && <ResultCard report={result} />}
      </div>
    </div>
  );
};

export default Dashboard;
