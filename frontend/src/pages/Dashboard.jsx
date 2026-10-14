import React, { useState } from 'react';
import ScannerTabs from '../components/scanner/ScannerTabs';
import InputBox from '../components/scanner/InputBox';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { Sparkles, RotateCcw } from 'lucide-react';
import { scanService } from '../services/scanService';

const SAMPLE_INPUTS = {
  message:
    'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your PIN.',
  link: 'https://security-login-update-credentials.top/account',
  policy:
    'We collect your exact GPS location, browser history, device identifiers, and biometric data. We share and monetize this information with third-party advertising partners and data brokers indefinitely without mandatory prior notice.',
};

export const Dashboard = () => {
  const [scanType, setScanType] = useState('message');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);

  const handleLoadSample = () => {
    setInputValue(SAMPLE_INPUTS[scanType]);
    setResult(null);
    setAlert(null);
  };

  const validateInput = () => {
    const trimmed = inputValue.trim();

    // 400: Empty input check
    if (!trimmed) {
      setAlert({
        type: 'warning',
        message: 'Please enter text or a URL to analyze.',
        canRetry: false,
      });
      return false;
    }

    // 413: Payload too large (exceeding 20,000 characters)
    if (trimmed.length > 20000) {
      setAlert({
        type: 'error',
        message: 'Content exceeds the maximum limit of 20,000 characters.',
        canRetry: false,
      });
      return false;
    }

    // 422: Invalid URL format check on link tab
    if (scanType === 'link') {
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

      if (scanType === 'message') {
        scanResponse = await scanService.scanMessage(inputValue.trim());
      } else if (scanType === 'link') {
        let targetUrl = inputValue.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = `https://${targetUrl}`;
        }
        scanResponse = await scanService.scanLink(targetUrl);
      } else if (scanType === 'policy') {
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

  return (
    <div className="dashboard-page" id="dashboard-view">
      {/* Hero Title Section */}
      <div className="dashboard-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-badge-icon" />
          <span>Core AI & Threat Detection Engines</span>
        </div>
        <h1 className="hero-title">
          Detect Digital Risks & Protect <span className="gradient-text">Personal Data</span>
        </h1>
        <p className="hero-subtitle">
          Instantly evaluate suspicious messages for phishing and credential leaks, check links against Google Safe Browsing, and simplify complex privacy policies.
        </p>
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

      {/* Main Scanner Workspace */}
      <div className="scanner-workspace-layout">
        {/* Scanner Type Switcher */}
        <ScannerTabs
          currentType={scanType}
          disabled={isLoading}
          onSelectType={(type) => {
            setScanType(type);
            setResult(null);
            setAlert(null);
            setInputValue('');
          }}
        />

        {/* Quick Sample Test Toolbar */}
        <div className="quick-test-bar">
          <span className="quick-test-label">Quick Test:</span>
          <button
            type="button"
            className="btn btn-ghost quick-test-btn"
            onClick={handleLoadSample}
            disabled={isLoading}
          >
            Load Sample{' '}
            {scanType === 'message'
              ? 'Phishing Message'
              : scanType === 'link'
              ? 'Malicious Link'
              : 'Predatory Policy'}
          </button>
        </div>

        {/* Scanner Input Box */}
        <InputBox
          scanType={scanType}
          value={inputValue}
          onChange={(val) => {
            setInputValue(val);
            if (alert) setAlert(null);
          }}
          onSubmit={handleScan}
          isLoading={isLoading}
          onLoadSample={handleLoadSample}
          onClear={() => {
            setInputValue('');
            setResult(null);
            setAlert(null);
          }}
        />

        {/* Loading Skeleton Indicator */}
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

        {/* Threat Report Result */}
        {!isLoading && result && <ResultCard report={result} />}
      </div>
    </div>
  );
};

export default Dashboard;
