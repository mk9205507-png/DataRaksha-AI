import React from 'react';
import { Send, FileText, Sparkles } from 'lucide-react';

export const LetterForm = ({ formData, onChange, onGenerate, isGenerating }) => {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="letter-form glass-card" id="data-request-form">
      <div className="form-header">
        <h3 className="form-title">Request Configuration</h3>
        <p className="form-subtitle">Generate statutory data disclosure or deletion notices (DPDP / GDPR)</p>
      </div>

      <div className="form-group">
        <label className="form-label">Request Type</label>
        <div className="radio-group-options">
          <label className={`radio-card ${formData.letter_type === 'deletion' ? 'active' : ''}`}>
            <input
              type="radio"
              name="letter_type"
              value="deletion"
              checked={formData.letter_type === 'deletion'}
              onChange={(e) => handleChange('letter_type', e.target.value)}
            />
            <div>
              <span className="radio-title">Data Deletion / Erasure</span>
              <span className="radio-desc">Demand permanent removal of all stored personal records</span>
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
              <span className="radio-title">Data Access & Disclosure</span>
              <span className="radio-desc">Inquire what personal data is held and shared with brokers</span>
            </div>
          </label>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="company-name">Target Company / Organization</label>
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
          <label className="form-label" htmlFor="user-name">Your Full Name</label>
          <input
            id="user-name"
            type="text"
            className="input-field"
            placeholder="e.g., Kalyani More"
            value={formData.user_name || ''}
            onChange={(e) => handleChange('user_name', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="user-email">Registered Email Address</label>
          <input
            id="user-email"
            type="email"
            className="input-field"
            placeholder="e.g., kalyani@example.com"
            value={formData.user_email || ''}
            onChange={(e) => handleChange('user_email', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="account-id">Account ID / Username (Optional)</label>
          <input
            id="account-id"
            type="text"
            className="input-field"
            placeholder="e.g., USER-84920"
            value={formData.account_id || ''}
            onChange={(e) => handleChange('account_id', e.target.value)}
          />
        </div>
      </div>

      <button
        id="generate-letter-btn"
        type="button"
        className="btn btn-primary generate-letter-btn"
        onClick={onGenerate}
        disabled={isGenerating || !formData.company_name || !formData.user_name}
      >
        <Sparkles size={16} />
        <span>{isGenerating ? 'Drafting Legal Notice...' : 'Generate Legal Letter Draft'}</span>
      </button>
    </div>
  );
};

export default LetterForm;
