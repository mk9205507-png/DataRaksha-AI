import React from 'react';
import { Send, FileText, Sparkles, Building2, User, Mail, Hash, ShieldCheck, Flag, Info } from 'lucide-react';

const POPULAR_COMPANIES = [
  { name: 'Google / Alphabet', email: 'data-protection-office@google.com' },
  { name: 'Meta (Facebook / Instagram)', email: 'datarequests@support.facebook.com' },
  { name: 'Amazon Web Services', email: 'privacyshield@amazon.com' },
  { name: 'Microsoft Corporation', email: 'dpo@microsoft.com' },
  { name: 'Flipkart Internet Pvt Ltd', email: 'privacy@flipkart.com' },
  { name: 'X / Twitter Corp', email: 'privacy@x.com' },
];

export const LetterForm = ({ formData, onChange, onGenerate, isGenerating }) => {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const handleSelectPreset = (company) => {
    onChange({
      ...formData,
      company_name: company.name,
      recipient_email: company.email,
    });
  };

  return (
    <div className="letter-form glass-card" id="data-request-form">
      <div className="form-header">
        <div className="form-header-badge">
          <ShieldCheck size={14} className="text-cyan" />
          <span>Statutory Rights Configuration</span>
        </div>
        <h3 className="form-title">Privacy Notice Settings</h3>
        <p className="form-subtitle">
          Draft enforceable legal notices under India's Digital Personal Data Protection (DPDP) Act or EU General Data Protection Regulation (GDPR).
        </p>
      </div>

      {/* 1. Request Notice Type */}
      <div className="form-group">
        <label className="form-label">Notice Type</label>
        <div className="radio-group-options radio-group-three">
          <label className={`radio-card ${formData.letter_type === 'deletion' ? 'active' : ''}`}>
            <input
              type="radio"
              name="letter_type"
              value="deletion"
              checked={formData.letter_type === 'deletion'}
              onChange={(e) => handleChange('letter_type', e.target.value)}
            />
            <div>
              <span className="radio-title">🗑️ Data Erasure / Deletion</span>
              <span className="radio-desc">Demand permanent wiping of accounts, telemetry, and tracking records</span>
            </div>
          </label>

          <label className={`radio-card ${formData.letter_type === 'access' ? 'active' : ''}`}>
            <input
              type="radio"
              name="letter_type"
              value="access"
              checked={formData.letter_type === 'access'}
              onChange={(e) => handleChange('letter_type', e.target.value)}
            />
            <div>
              <span className="radio-title">🔍 Access & Disclosure (SAR)</span>
              <span className="radio-desc">Request copies of personal data held and third-party data broker disclosures</span>
            </div>
          </label>

          <label className={`radio-card ${formData.letter_type === 'consent_withdrawal' ? 'active' : ''}`}>
            <input
              type="radio"
              name="letter_type"
              value="consent_withdrawal"
              checked={formData.letter_type === 'consent_withdrawal'}
              onChange={(e) => handleChange('letter_type', e.target.value)}
            />
            <div>
              <span className="radio-title">🚫 Consent Revocation</span>
              <span className="radio-desc">Withdraw all marketing, profiling, and behavioural tracking consents</span>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Legal Framework Selector */}
      <div className="form-group">
        <label className="form-label">Statutory Privacy Framework</label>
        <div className="framework-selector-grid">
          <button
            type="button"
            className={`framework-pill-btn ${formData.framework === 'DPDP' ? 'active' : ''}`}
            onClick={() => handleChange('framework', 'DPDP')}
          >
            <span className="framework-flag">🇮🇳</span>
            <div className="framework-info">
              <span className="framework-name">DPDP Act 2023 (India)</span>
              <span className="framework-sub">Digital Personal Data Protection Act</span>
            </div>
          </button>

          <button
            type="button"
            className={`framework-pill-btn ${formData.framework === 'GDPR' ? 'active' : ''}`}
            onClick={() => handleChange('framework', 'GDPR')}
          >
            <span className="framework-flag">🇪🇺</span>
            <div className="framework-info">
              <span className="framework-name">GDPR (European Union)</span>
              <span className="framework-sub">General Data Protection Regulation Art. 15 / 17</span>
            </div>
          </button>
        </div>
      </div>

      {/* Popular Organization Presets */}
      <div className="form-group">
        <label className="form-label">Quick Organization Presets</label>
        <div className="company-preset-chips">
          {POPULAR_COMPANIES.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`preset-chip ${formData.company_name === c.name ? 'active' : ''}`}
              onClick={() => handleSelectPreset(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Company Name & DPO Recipient Email */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="company-name">
            <Building2 size={14} className="inline-icon" /> Target Organization <span className="required">*</span>
          </label>
          <input
            id="company-name"
            type="text"
            className="input-field"
            placeholder="e.g., Acme Cloud Services Ltd."
            value={formData.company_name || ''}
            onChange={(e) => handleChange('company_name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="recipient-email">
            <Mail size={14} className="inline-icon" /> DPO / Privacy Email (Optional)
          </label>
          <input
            id="recipient-email"
            type="email"
            className="input-field"
            placeholder="e.g., privacy@organization.com"
            value={formData.recipient_email || ''}
            onChange={(e) => handleChange('recipient_email', e.target.value)}
          />
        </div>
      </div>

      {/* User Full Name & Registered Email */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="user-name">
            <User size={14} className="inline-icon" /> Your Full Legal Name <span className="required">*</span>
          </label>
          <input
            id="user-name"
            type="text"
            className="input-field"
            placeholder="e.g., Kalyani More"
            value={formData.user_name || ''}
            onChange={(e) => handleChange('user_name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="user-email">
            <Mail size={14} className="inline-icon" /> Your Registered Account Email <span className="required">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            className="input-field"
            placeholder="e.g., kalyani@example.com"
            value={formData.user_email || ''}
            onChange={(e) => handleChange('user_email', e.target.value)}
          />
        </div>
      </div>

      {/* Account Identifier & Custom Notes */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="account-id">
            <Hash size={14} className="inline-icon" /> Account ID / Username / Mobile (Optional)
          </label>
          <input
            id="account-id"
            type="text"
            className="input-field"
            placeholder="e.g., USR-98421 or +91-9876543210"
            value={formData.account_id || ''}
            onChange={(e) => handleChange('account_id', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="custom-notes">
            <Info size={14} className="inline-icon" /> Specific Data Categories / Instructions (Optional)
          </label>
          <input
            id="custom-notes"
            type="text"
            className="input-field"
            placeholder="e.g., Telemetry, GPS location records, biometric identifiers"
            value={formData.custom_notes || ''}
            onChange={(e) => handleChange('custom_notes', e.target.value)}
          />
        </div>
      </div>

      <button
        id="generate-letter-btn"
        type="button"
        className="btn btn-primary generate-letter-btn"
        onClick={onGenerate}
        disabled={isGenerating || !formData.company_name?.trim() || !formData.user_name?.trim()}
      >
        <Sparkles size={16} />
        <span>{isGenerating ? 'Drafting Statutory Legal Notice...' : 'Generate Legal Notice Draft'}</span>
      </button>
    </div>
  );
};

export default LetterForm;
