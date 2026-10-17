import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { scanService } from '../services/scanService';

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

export const PrivacyPolicyPage = ({ onNavigateBack, onNavigateToLetters }) => {
  const [policyText, setPolicyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const runPolicyScan = async (textToScan) => {
    const trimmed = (textToScan || '').trim();
    if (!trimmed) {
      setAlert({
        type: 'warning',
        message: 'Please paste privacy policy terms or text to evaluate.',
      });
      return;
    }

    if (trimmed.length < 20) {
      setAlert({
        type: 'warning',
        message: 'Please provide at least 20 characters of policy terms for an accurate assessment.',
      });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const data = await scanService.scanPolicy(trimmed);
      setResult(data);
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.response?.data?.detail ||
          'Failed to simplify policy. Please check the text and try again.',
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="privacy-policy-page" id="privacy-policy-view">
      {/* Top Page Header (Matching Reference Screen 4) */}
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
          onClose={() => setAlert(null)}
        />
      )}

      {/* 2-Column Responsive Layout (Matching Reference Screen 4) */}
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

            {/* Textarea Input with Character Counter */}
            <div className="policy-textarea-container">
              <textarea
                id="policy-input-textarea"
                className="textarea-field policy-textarea"
                value={policyText}
                onChange={(e) => {
                  setPolicyText(e.target.value);
                  if (alert) setAlert(null);
                }}
                placeholder="Paste the privacy policy text or enter the website URL"
                rows={8}
                maxLength={5000}
                disabled={isLoading}
              />
              <div className="policy-textarea-footer">
                <span className="policy-char-count">
                  {policyText.length}/5000
                </span>
              </div>
            </div>

            {/* Actions Bar */}
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
                    <div className="spinner sm" /> Analysing Policy...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Analyse Policy
                  </>
                )}
              </button>
            </div>
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
