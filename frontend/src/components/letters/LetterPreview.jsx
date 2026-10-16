import React, { useState } from 'react';
import { Copy, Check, Download, Edit3, ShieldAlert, Mail, FileCode, CheckCircle2 } from 'lucide-react';

export const LetterPreview = ({ content, onChangeContent, meta = {} }) => {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('txt');

  if (!content) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = (format = 'txt') => {
    const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanCompany = (meta.company_name || 'Organization').replace(/[^a-zA-Z0-9_-]/g, '_');
    const noticeType = (meta.letter_type || 'Privacy_Request').toUpperCase();
    link.download = `DataRaksha_${noticeType}_${cleanCompany}_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailClient = () => {
    const subject = encodeURIComponent(
      meta.subject || `Formal Statutory Privacy Notice - ${meta.user_name || 'Account Holder'}`
    );
    const body = encodeURIComponent(content);
    const recipient = meta.recipient_email ? encodeURIComponent(meta.recipient_email) : '';
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="letter-preview-card glass-card" id="letter-preview-section">
      <div className="preview-header">
        <div className="preview-title-row">
          <Edit3 size={18} className="preview-icon text-cyan" />
          <div>
            <h3 className="preview-title">Generated Legal Draft</h3>
            <span className="preview-meta-info">
              {wordCount} words • {charCount} characters • Live Editable
            </span>
          </div>
        </div>

        <div className="preview-actions">
          {/* Email button */}
          <button
            type="button"
            className="btn btn-secondary action-sm email-client-btn"
            onClick={handleEmailClient}
            title="Open in your default email client"
          >
            <Mail size={14} />
            <span>Open Email</span>
          </button>

          {/* Copy button */}
          <button
            type="button"
            className={`btn btn-secondary action-sm ${copied ? 'btn-copied' : ''}`}
            onClick={handleCopy}
            title="Copy letter to clipboard"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Download as .txt */}
          <button
            type="button"
            className="btn btn-primary action-sm"
            onClick={() => handleDownload('txt')}
            title="Download formatted text document"
          >
            <Download size={14} />
            <span>.TXT</span>
          </button>

          {/* Download as .md */}
          <button
            type="button"
            className="btn btn-secondary action-sm"
            onClick={() => handleDownload('md')}
            title="Download markdown document"
          >
            <FileCode size={14} />
            <span>.MD</span>
          </button>
        </div>
      </div>

      <div className="textarea-wrapper">
        <textarea
          className="textarea-field legal-letter-editor"
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          rows={16}
          aria-label="Editable legal letter draft"
        />
      </div>

      <div className="preview-footer-note">
        <ShieldAlert size={15} className="text-amber" />
        <span>
          <strong>Legal Guidance:</strong> Review all highlighted placeholder fields before sending. Under the DPDP Act (India) and GDPR (EU), organizations are statutorily required to acknowledge receipt and respond within 30 calendar days.
        </span>
      </div>
    </div>
  );
};

export default LetterPreview;
