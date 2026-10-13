import React, { useState } from 'react';
import { Copy, Check, Download, Edit3, ShieldAlert } from 'lucide-react';

export const LetterPreview = ({ content, onChangeContent }) => {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DataRaksha_Privacy_Request_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="letter-preview-card glass-card" id="letter-preview-section">
      <div className="preview-header">
        <div className="preview-title-row">
          <Edit3 size={18} className="preview-icon" />
          <h3 className="preview-title">Draft Legal Letter</h3>
        </div>
        <div className="preview-actions">
          <button
            type="button"
            className="btn btn-secondary action-sm"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary action-sm"
            onClick={handleDownload}
            title="Download text file"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      <textarea
        className="textarea-field legal-letter-editor"
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        rows={14}
        aria-label="Editable legal letter draft"
      />

      <div className="preview-footer-note">
        <ShieldAlert size={14} />
        <span>You may edit this draft directly. Submit via the company’s Data Protection Officer (DPO) or privacy contact email.</span>
      </div>
    </div>
  );
};

export default LetterPreview;
