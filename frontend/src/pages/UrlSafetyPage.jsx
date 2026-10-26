import React, { useState, useRef, useEffect } from 'react';
import {
  Link2,
  Globe,
  Shield,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { scanService } from '../services/scanService';
import { historyService } from '../services/historyService';
import { useAuth } from '../context/AuthContext';

const EXAMPLE_URLS = [
  { label: 'https://google.com', tag: 'Safe' },
  { label: 'https://amazon.in', tag: 'Safe' },
  { label: 'https://bit.ly/claim-bank-cashback-instant', tag: 'Shortener' },
  { label: 'https://security-login-update-credentials.top/account/verify.php', tag: 'Deceptive' },
  { label: 'http://192.168.1.100/secure-update-patch.exe', tag: 'Raw IP' },
];

export const UrlSafetyPage = ({ onNavigateBack, onNavigateToLetters, initialData }) => {
  const { user, isOnline } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const resultRef = useRef(null);

  // Auto-populate when re-opened from Scan History
  useEffect(() => {
    if (initialData?.preview || initialData?.url) {
      const url = initialData.preview || initialData.url;
      setUrlInput(url);
      runUrlScan(url);
    }
  }, [initialData]);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const runUrlScan = async (targetUrl) => {
    const trimmed = (targetUrl || '').trim();
    if (!trimmed) {
      setAlert({
        type: 'warning',
        message: 'Please enter a website URL to evaluate.',
      });
      return;
    }

    if (!navigator.onLine || isOnline === false) {
      setAlert({
        type: 'warning',
        message: 'No internet connection. Please check your network and try again.',
      });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const data = await scanService.scanLink(trimmed);
      setResult(data);
      historyService.saveScanRecord({
        scan_type: 'url',
        preview: trimmed,
        result: data,
        target_company: trimmed,
        userId: user?.id,
      });
    } catch (err) {
      const errMsg =
        err.message ||
        err.response?.data?.detail ||
        'Failed to inspect URL. Ensure it includes http:// or https:// and try again.';

      setAlert({
        type: 'error',
        message: errMsg,
        action: (
          <button
            type="button"
            className="btn btn-secondary action-sm"
            onClick={() => runUrlScan(trimmed)}
          >
            Retry
          </button>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (url) => {
    setUrlInput(url);
    setAlert(null);
    runUrlScan(url);
  };

  const handleScanUrl = async (e) => {
    if (e) e.preventDefault();
    await runUrlScan(urlInput);
  };

  const handleClear = () => {
    setUrlInput('');
    setResult(null);
    setAlert(null);
  };

  return (
    <div className="url-safety-page" id="url-safety-view">
      {/* Top Page Header (Matching Reference Screen 3) */}
      <div className="inner-page-header">
        <div className="header-title-row">
          <div className="header-icon-box url-icon-box">
            <Link2 size={20} className="text-blue" />
          </div>
          <h1 className="header-title">URL Safety</h1>
        </div>
        <p className="header-subtitle">
          Check if a website is safe before you click.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main URL Safety Card */}
      <div className="url-main-card card">
        <form onSubmit={handleScanUrl} className="url-input-form">
          <div className="url-input-row">
            <div className="url-input-wrapper">
              <Globe size={18} className="url-input-icon text-muted" />
              <input
                id="url-input-field"
                type="text"
                className="input-field url-text-input"
                placeholder="Enter URL (e.g. https://example.com)"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (alert) setAlert(null);
                }}
                disabled={isLoading}
              />
              {urlInput && (
                <button
                  type="button"
                  className="url-clear-btn"
                  onClick={handleClear}
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              id="check-url-btn"
              type="submit"
              className="btn btn-primary url-submit-btn"
              disabled={isLoading || !urlInput.trim() || !isOnline}
              title={!isOnline ? 'No internet connection. Please check your network and try again.' : 'Check URL'}
            >
              {isLoading ? (
                <>
                  <div className="spinner sm" /> Checking...
                </>
              ) : !isOnline ? (
                <>
                  <Globe size={16} /> Offline
                </>
              ) : (
                <>
                  <Globe size={16} /> Check URL
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example URLs Section (Matching Reference Screen 3) */}
        <div className="example-urls-section">
          <span className="example-label">Example URLs</span>
          <div className="example-chips-list">
            {EXAMPLE_URLS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={`example-chip ${urlInput === item.label ? 'active' : ''}`}
                onClick={() => handleSelectExample(item.label)}
                disabled={isLoading}
                title={`Test ${item.tag}: ${item.label}`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guidance Illustration Box: Globe & Shield (Matching Reference Screen 3) */}
        {!result && (
          <div className="url-guidance-box" id="url-guidance-banner">
            <div className="globe-illustration-container">
              <div className="globe-circle-grid">
                <Globe size={56} className="globe-icon-svg" />
                <div className="globe-shield-badge">
                  <Shield size={20} className="globe-shield-icon" />
                </div>
              </div>
            </div>
            <h3 className="guidance-title">Stay safe. Check before you click.</h3>
            <p className="guidance-subtitle">
              Avoid phishing, malware and fake websites.
            </p>
          </div>
        )}

        {/* Scan Result Report */}
        {result && (
          <div className="url-result-container" ref={resultRef}>
            <ResultCard
              report={result}
              onDraftLetter={onNavigateToLetters}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlSafetyPage;
