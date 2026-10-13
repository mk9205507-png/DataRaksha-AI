import React from 'react';
import { Send, Clipboard, Trash2, ShieldAlert } from 'lucide-react';

export const InputBox = ({
  scanType,
  value,
  onChange,
  onSubmit,
  isLoading,
  onClear,
}) => {
  const placeholders = {
    message: 'Paste suspicious message, SMS, or email text here to scan for phishing, urgency cues, and exposed sensitive data (e.g., passwords, phone numbers)...',
    link: 'Enter URL to analyze (e.g., https://secure-login-verify-account.com) via Google Safe Browsing...',
    policy: 'Paste lengthy Terms of Service or Privacy Policy text here to extract data practices, broker sharing, and tracking red flags...',
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch {
      // Fallback if clipboard permissions blocked
    }
  };

  return (
    <div className="scanner-input-container glass-card">
      <div className="input-header">
        <label htmlFor="scanner-input" className="input-label">
          {scanType === 'message' && 'Message / Email Content'}
          {scanType === 'link' && 'Web Link / Target URL'}
          {scanType === 'policy' && 'Privacy Policy Document'}
        </label>
        <div className="input-actions-top">
          <button
            type="button"
            className="btn btn-ghost action-sm"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <Clipboard size={14} /> Paste
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost action-sm"
              onClick={onClear}
              title="Clear input"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {scanType === 'link' ? (
        <input
          id="scanner-input"
          type="url"
          className="input-field url-input"
          placeholder={placeholders.link}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        />
      ) : (
        <textarea
          id="scanner-input"
          className="textarea-field scanner-textarea"
          placeholder={placeholders[scanType]}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          disabled={isLoading}
        />
      )}

      <div className="input-footer">
        <span className="character-count">
          {value.length} characters {value.length > 5000 && <span className="warning-text">(Approaching size limit)</span>}
        </span>

        <button
          id="run-scan-btn"
          type="button"
          className="btn btn-primary scan-submit-btn"
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span>Analyzing Threat Vector...</span>
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
