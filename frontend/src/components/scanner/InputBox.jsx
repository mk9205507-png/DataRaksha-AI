import React from 'react';
import { Clipboard, Trash2, ShieldAlert, Sparkles, AlertTriangle, Activity } from 'lucide-react';

const MAX_CHAR_LIMIT = 20000;
const WARNING_THRESHOLD = 18000;

export const InputBox = ({
  scanType,
  value,
  onChange,
  onSubmit,
  isLoading,
  onClear,
  onLoadSample,
}) => {
  const placeholders = {
    message: 'Paste SMS, WhatsApp text, email, or chat message to analyze for phishing and fraud...',
    link: 'Enter web address (e.g., https://example.com or suspicious redirect domain)...',
    policy: 'Paste corporate privacy policy or terms of service text to extract data broker monetization clauses...',
  };

  const charCount = value ? value.length : 0;
  const isApproachingLimit = charCount >= WARNING_THRESHOLD && charCount <= MAX_CHAR_LIMIT;
  const isOverLimit = charCount > MAX_CHAR_LIMIT;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      // Fallback if clipboard permissions blocked in browser
    }
  };

  return (
    <div
      className={`scanner-input-container glass-card ${isLoading ? 'is-scanning-active' : ''}`}
      id="scanner-input-box"
    >
      {/* Scanning Radar Micro-Animation Beam */}
      {isLoading && (
        <div className="scanner-radar-beam" aria-hidden="true">
          <div className="radar-glow-line"></div>
        </div>
      )}

      <div className="input-header">
        <label htmlFor="scanner-input" className="input-label">
          {scanType === 'message' && 'Message / Email Content'}
          {scanType === 'link' && 'Link / Target URL'}
          {scanType === 'policy' && 'Privacy Policy / Terms of Service'}
        </label>
        <div className="input-actions-top">
          {onLoadSample && (
            <button
              type="button"
              className="btn btn-ghost action-sm quick-sample-btn"
              onClick={onLoadSample}
              disabled={isLoading}
              title="Load realistic sample data"
            >
              <Sparkles size={14} /> Sample
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost action-sm"
            onClick={handlePaste}
            disabled={isLoading}
            title="Paste from clipboard"
          >
            <Clipboard size={14} /> Paste
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost action-sm"
              onClick={onClear}
              disabled={isLoading}
              title="Clear input"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {scanType === 'link' ? (
        <div className="input-field-relative">
          <input
            id="scanner-input"
            type="url"
            className={`input-field url-input ${isOverLimit ? 'input-error' : ''} ${isLoading ? 'input-scanning' : ''}`}
            placeholder={placeholders.link}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
        </div>
      ) : (
        <div className="input-field-relative">
          <textarea
            id="scanner-input"
            className={`textarea-field scanner-textarea ${isOverLimit ? 'input-error' : ''} ${isLoading ? 'input-scanning' : ''}`}
            placeholder={placeholders[scanType]}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="input-footer">
        <div className="character-count-wrapper">
          <span className={`character-count ${isOverLimit ? 'char-danger' : isApproachingLimit ? 'char-warning' : ''}`}>
            {charCount.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()} characters
          </span>
          {isApproachingLimit && (
            <span className="char-status-text warning-text">
              <AlertTriangle size={13} /> Approaching character limit
            </span>
          )}
          {isOverLimit && (
            <span className="char-status-text danger-text">
              <AlertTriangle size={13} /> Exceeds 20,000 maximum limit
            </span>
          )}
        </div>

        <button
          id="run-scan-btn"
          type="button"
          className={`btn btn-primary scan-submit-btn ${isLoading ? 'btn-scanning' : ''}`}
          onClick={onSubmit}
          disabled={isLoading || !value.trim() || isOverLimit}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span>Running Deep Threat Analysis...</span>
            </>
          ) : (
            <>
              <ShieldAlert size={16} />
              <span>Analyze Safety</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputBox;
