import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileCode,
  RotateCcw,
  Globe,
  ClipboardPaste,
} from 'lucide-react';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { scanService } from '../services/scanService';
import { historyService } from '../services/historyService';

const POLICY_PRESETS = [
  {
    id: 'data-broker',
    label: '⚠️ Aggressive Data Selling Policy',
    company: 'Acme Social Ad-Tech',
    text:
      'We collect your exact real-time GPS location, web browsing history, device identifiers, biometric facial scans, and contact lists. We reserve the unrestricted right to share, sell, lease, and monetize this information with third-party advertising partners, data brokers, and affiliate networks indefinitely without mandatory prior notice.',
  },
  {
    id: 'telemetry',
    label: '📱 Audio & Sensor Telemetry Harvesting',
    company: 'SmartVoice Devices Corp',
    text:
      'This software continuously records microphone ambient noise, typing cadence, device accelerometer sensors, and application usage telemetry. Telemetry logs are retained indefinitely on commercial cloud servers and may be processed by commercial marketing partners for behavioral profiling.',
  },
  {
    id: 'safe-privacy',
    label: '🛡️ Privacy-First Minimalist Policy',
    company: 'OpenSource Privacy Org',
    text:
      'We strictly respect your digital privacy. We only collect the minimal email address required to deliver our service. We never sell, rent, or monetize your personal data. All data is encrypted with AES-256 and immediately purged upon account deletion.',
  },
];

export const PrivacyPolicyPage = ({ onNavigateBack, onNavigateToLetters, initialData }) => {
  const [policyText, setPolicyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  // Auto-populate when re-opened from Scan History
  useEffect(() => {
    if (initialData?.preview || initialData?.policy_text) {
      const text = initialData.preview || initialData.policy_text;
      setPolicyText(text);
      runPolicyScan(text);
    }
  }, [initialData]);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const checkIfUrl = (str) => {
    const trimmed = (str || '').trim();
    if (!trimmed || /\n|\r/.test(trimmed)) return false;
    if (/^https?:\/\//i.test(trimmed)) return true;
    return !/\s/.test(trimmed) && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed);
  };

  const handleSwitchToManualPaste = () => {
    setPolicyText('');
    setAlert({
      type: 'info',
      message: 'Website URL cleared. Paste the privacy policy text directly into the box below and click Analyse Policy.',
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const runPolicyScan = async (textToScan) => {
    const trimmed = (textToScan || '').trim();
    if (!trimmed) {
      setAlert({
        type: 'warning',
        message: 'Please paste privacy policy terms or enter a website URL to evaluate.',
      });
      return;
    }

    const isUrl = checkIfUrl(trimmed);

    // Text terms need meaningful length, whereas a URL like example.com can be short
    if (!isUrl && trimmed.length < 20) {
      setAlert({
        type: 'warning',
        message: 'Please provide at least 20 characters of policy terms for an accurate assessment.',
      });
      return;
    }

    setIsLoading(true);
    setAlert(null);
    if (isUrl) {
      setLoadingMessage('Fetching webpage and extracting privacy policy terms...');
    } else {
      setLoadingMessage('Analysing privacy policy terms with DataRaksha AI...');
    }

    try {
      const data = await scanService.scanPolicy(trimmed);
      setResult(data);
      historyService.saveScanRecord({
        scan_type: 'policy',
        preview: trimmed,
        result: data,
        target_company: 'Privacy Policy Document',
      });
    } catch (err) {
      const errMsg =
        err.message ||
        err.response?.data?.detail ||
        'Failed to simplify policy. Please check the text or URL and try again.';

      setAlert({
        type: 'error',
        message: errMsg,
        action: isUrl ? (
          <button
            type="button"
            className="btn btn-secondary action-sm alert-paste-manual-btn"
            onClick={handleSwitchToManualPaste}
          >
            <ClipboardPaste size={14} /> Paste Policy Text Manually
          </button>
        ) : null,
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSelectPreset = (preset) => {
    setPolicyText(preset.text);
    setAlert(null);
    runPolicyScan(preset.text);
  };

  const handleScanPolicy = async () => {
    await runPolicyScan(policyText);
  };

  const handleClear = () => {
    setPolicyText('');
    setResult(null);
    setAlert(null);
  };

  const isCurrentInputUrl = checkIfUrl(policyText);

  return (
    <div className="privacy-policy-page" id="privacy-policy-view">
      {/* Top Page Header */}
      <div className="inner-page-header">
        <div className="header-title-row">
          <div className="header-icon-box policy-icon-box">
            <FileText size={20} className="text-blue" />
          </div>
          <h1 className="header-title">Privacy Policy</h1>
        </div>
        <p className="header-subtitle">
          Get a quick summary of any privacy policy and understand how your data is used.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          action={alert.action}
          onClose={() => setAlert(null)}
        />
      )}

      {/* 2-Column Responsive Layout */}
      <div className="policy-safety-grid">
        {/* Left Column: Textarea Editor & Submit */}
        <div className="policy-main-column">
          <div className="policy-input-card card">
            {/* Quick Sample Presets */}
            <div className="policy-presets-bar">
              <span className="preset-label">
                <Sparkles size={14} /> Quick Samples:
              </span>
              {POLICY_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="preset-chip"
                  onClick={() => handleSelectPreset(p)}
                  disabled={isLoading}
                  title={`Load: ${p.label}`}
                >
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Textarea Input with Input Type Badge & Character Counter */}
            <div className="policy-textarea-container">
              <textarea
                ref={textareaRef}
                id="policy-input-textarea"
                className={`textarea-field policy-textarea ${isCurrentInputUrl ? 'textarea-url-detected' : ''}`}
                value={policyText}
                onChange={(e) => {
                  setPolicyText(e.target.value);
                  if (alert) setAlert(null);
                }}
                placeholder="Paste the privacy policy text or enter the website URL (e.g. https://example.com/privacy)"
                rows={8}
                maxLength={5000}
                disabled={isLoading}
              />
              <div className="policy-textarea-footer">
                <div className="policy-input-type-badge">
                  {isCurrentInputUrl ? (
                    <span className="input-type-pill url-pill">
                      <Globe size={13} /> Web URL Detected — DataRaksha will fetch & extract terms
                    </span>
                  ) : policyText.trim().length > 0 ? (
                    <span className="input-type-pill text-pill">
                      <FileText size={13} /> Policy Text ({policyText.length} chars)
                    </span>
                  ) : null}
                </div>
                <span className="policy-char-count">
                  {policyText.length}/5000
                </span>
              </div>
            </div>

            {/* Actions Bar & Loading Banner */}
            <div className="policy-actions-bar">
              {policyText && (
                <button
                  type="button"
                  className="btn btn-ghost action-sm"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear
                </button>
              )}
              <button
                id="analyse-policy-btn"
                type="button"
                className="btn btn-primary policy-submit-btn"
                onClick={handleScanPolicy}
                disabled={isLoading || !policyText.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="spinner sm" />
                    <span>{isCurrentInputUrl ? 'Fetching & Analysing...' : 'Analysing Policy...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Analyse Policy
                  </>
                )}
              </button>
            </div>

            {isLoading && (
              <div className="policy-loading-banner" id="policy-loading-indicator">
                <div className="spinner sm" />
                <span className="loading-message-text">{loadingMessage}</span>
              </div>
            )}
          </div>


          {/* Result Card: Rendered immediately upon analysis */}
          {result && (
            <div className="policy-result-wrapper" ref={resultRef}>
              <ResultCard
                report={result}
                onDraftLetter={onNavigateToLetters}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar Column: What You'll Get (Matching Reference Screen 4) */}
        <div className="policy-side-column">
          <div className="what-you-get-card card">
            <div className="what-you-get-content">
              <h3 className="sidebar-card-title">What you'll get</h3>
              <ul className="benefit-items-list">
                <li className="benefit-item">
                  <div className="benefit-check-icon">
                    <CheckCircle2 size={18} className="text-blue" />
                  </div>
                  <span>Key data collection details</span>
                </li>
                <li className="benefit-item">
                  <div className="benefit-check-icon">
                    <CheckCircle2 size={18} className="text-blue" />
                  </div>
                  <span>How your data is used</span>
                </li>
                <li className="benefit-item">
                  <div className="benefit-check-icon">
                    <CheckCircle2 size={18} className="text-blue" />
                  </div>
                  <span>Data sharing information</span>
                </li>
                <li className="benefit-item">
                  <div className="benefit-check-icon">
                    <CheckCircle2 size={18} className="text-blue" />
                  </div>
                  <span>Your rights and options</span>
                </li>
              </ul>
            </div>

            {/* Decorative Shield Icon Outline (Matching Reference Screen 4) */}
            <div className="what-you-get-shield" aria-hidden="true">
              <Shield size={72} className="shield-outline-svg" />
            </div>
          </div>

          {/* Statutory DPDP & GDPR Action Card */}
          <div className="legal-rights-card card">
            <div className="rights-card-header">
              <FileCode size={20} className="text-blue" />
              <h4 className="rights-title">Enforce Your Legal Rights</h4>
            </div>
            <p className="rights-desc">
              Exercising rights under the Indian <strong>DPDP Act 2023</strong> or European <strong>GDPR</strong>? Draft a legally binding erasure notice in seconds.
            </p>
            <button
              type="button"
              className="btn btn-secondary action-sm w-full"
              onClick={() =>
                onNavigateToLetters({
                  company_name: 'Identified Data Controller',
                  letter_type: 'erasure',
                  legal_basis: 'dpdp',
                })
              }
            >
              Draft Deletion Notice <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
