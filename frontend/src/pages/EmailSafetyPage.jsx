import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Shield,
  Link2,
  AlertTriangle,
  Paperclip,
  UserCheck,
  Bot,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import ResultCard from '../components/scanner/ResultCard';
import Alert from '../components/common/Alert';
import { scanService } from '../services/scanService';

// Scenario presets matching real threat cases
const EMAIL_PRESETS = [
  {
    id: 'bank-kyc',
    title: '🏦 Bank KYC Alert — Urgent account suspension threat',
    sender: 'security@sbi-online-alerts.xyz',
    company: 'State Bank of India',
    content:
      'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours or your account will be permanently frozen.',
  },
  {
    id: 'lottery-scam',
    title: '🎁 $1,000,000 International Lottery Draw Winner',
    sender: 'payouts@intl-rewards-claim.com',
    company: 'International Rewards Draw',
    content:
      'CONGRATULATIONS! Your mobile number won 1st prize of $1,000,000 in the International Mobile Rewards Draw. Claim immediately by emailing payout@reward-payout-online.com with your full legal name, PAN number, and bank account details.',
  },
  {
    id: 'job-extortion',
    title: '💼 Amazon HR Remote Job Offer ($450/day)',
    sender: 'careers-verification@amazon-recruitment-online.org',
    company: 'Global Recruitment Portal',
    content:
      'Dear Applicant, Amazon HR selected your profile for Work-From-Home data reviewing paying $450/day. Immediate joining available. Please deposit $50 refundable registration fee to verify your corporate laptop dispatch.',
  },
  {
    id: 'safe-meeting',
    title: '✅ Legitimate Internal Sprint Review Sync (Safe)',
    sender: 'team-lead@company-workspace.com',
    company: 'Engineering Sync',
    content:
      'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace. See you soon!',
  },
];

export const EmailSafetyPage = ({ onNavigateBack, onNavigateToLetters }) => {
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const handleSelectPreset = (e) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);
    if (!presetId) {
      setEmailContent('');
      setSenderEmail('');
      setResult(null);
      return;
    }

    const found = EMAIL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setEmailContent(found.content);
      setSenderEmail(found.sender);
      setResult(null);
      setAlert(null);
    }
  };

  const handleGoogleConnect = () => {
    setIsGoogleConnected(true);
    setSelectedPresetId('bank-kyc');
    setEmailContent(EMAIL_PRESETS[0].content);
    setSenderEmail(EMAIL_PRESETS[0].sender);
    setAlert({
      type: 'success',
      message: 'Gmail account connected. Loaded latest suspicious email from inbox.',
    });
  };

  const handleScanEmail = async () => {
    if (!emailContent.trim()) {
      setAlert({
        type: 'warning',
        message: 'Please select an email or paste email content to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setAlert(null);
    setResult(null);

    try {
      const data = await scanService.scanMessage(emailContent);
      setResult(data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to complete email threat scan. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setEmailContent('');
    setSenderEmail('');
    setSelectedPresetId('');
    setResult(null);
    setAlert(null);
  };

  return (
    <div className="email-safety-page" id="email-safety-view">
      {/* Top Page Header (Matching Reference Screen 2) */}
      <div className="inner-page-header">
        <button
          type="button"
          className="header-back-btn"
          onClick={onNavigateBack}
          title="Return to Dashboard"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
          <h1 className="header-title">Email Safety</h1>
        </button>
        <p className="header-subtitle">
          Analyse your emails for potential threats and get AI-powered insights.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* 2-Column Responsive Layout (Matching Reference Screen 2) */}
      <div className="email-safety-grid">
        {/* Left Main Column: Connect Gmail & Email Selector/Content */}
        <div className="email-main-column">
          {/* Card 1: Connect Gmail Card */}
          <div className="connect-gmail-card card">
            <div className="gmail-card-left">
              {/* Colorful Gmail SVG 'M' Logo */}
              <div className="gmail-logo-icon" aria-hidden="true">
                <svg width="34" height="26" viewBox="0 0 24 19" fill="none">
                  <path
                    d="M1.5 17.5V4.5C1.5 3.4 2.4 2.5 3.5 2.5H6.5V11L12 15L17.5 11V2.5H20.5C21.6 2.5 22.5 3.4 22.5 4.5V17.5C22.5 18.6 21.6 19.5 20.5 19.5H3.5C2.4 19.5 1.5 18.6 1.5 17.5Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M1.5 4.5L12 12.5L22.5 4.5V3.5C22.5 2.4 21.6 1.5 20.5 1.5H3.5C2.4 1.5 1.5 2.4 1.5 3.5V4.5Z"
                    fill="#4285F4"
                  />
                  <path d="M1.5 4.5V17.5H6.5V10.5L1.5 4.5Z" fill="#34A853" />
                  <path d="M22.5 4.5V17.5H17.5V10.5L22.5 4.5Z" fill="#FBBC05" />
                </svg>
              </div>
              <div className="gmail-card-info">
                <h3 className="gmail-card-title">Connect Gmail</h3>
                <p className="gmail-card-desc">
                  Securely connect your Gmail account to analyse your emails for potential risks.
                </p>
              </div>
            </div>

            <div className="gmail-card-right">
              <button
                type="button"
                id="connect-google-btn"
                className={`btn ${isGoogleConnected ? 'btn-secondary' : 'btn-primary'} connect-google-btn`}
                onClick={handleGoogleConnect}
              >
                {/* Google G Icon */}
                <svg className="google-icon" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleConnected ? 'Gmail Connected' : 'Connect with Google'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Or Select an Email / Paste Card */}
          <div className="select-email-card card">
            <div className="card-section-header">
              <h3 className="section-title-sm">Or Select an Email</h3>
              <p className="section-desc-sm">
                Choose an email from your inbox to analyse, or paste the content directly.
              </p>
            </div>

            {/* Email Dropdown Selector */}
            <div className="email-select-container">
              <select
                id="email-inbox-dropdown"
                className="email-dropdown-input"
                value={selectedPresetId}
                onChange={handleSelectPreset}
                aria-label="Select an email from inbox"
              >
                <option value="">Select an email from your inbox...</option>
                {EMAIL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Display / Input State */}
            {!emailContent ? (
              /* Reference Placeholder: Circle Mail Icon + No Email Selected */
              <div className="no-email-placeholder" id="no-email-state">
                <div className="placeholder-circle-icon">
                  <Mail size={28} className="text-blue" />
                </div>
                <h4 className="placeholder-title">No email selected</h4>
                <p className="placeholder-desc">
                  Connect your Gmail or select an email to get started.
                </p>
                <div className="placeholder-actions">
                  <button
                    type="button"
                    className="btn btn-secondary action-sm"
                    onClick={() => {
                      setSelectedPresetId('bank-kyc');
                      setEmailContent(EMAIL_PRESETS[0].content);
                      setSenderEmail(EMAIL_PRESETS[0].sender);
                    }}
                  >
                    <Sparkles size={14} /> Try Phishing Sample
                  </button>
                </div>
              </div>
            ) : (
              /* Active Content Editor with Character Counter */
              <div className="email-content-editor">
                {senderEmail && (
                  <div className="sender-indicator">
                    <span className="sender-label">Sender:</span>
                    <code className="sender-address">{senderEmail}</code>
                  </div>
                )}

                <textarea
                  id="email-content-textarea"
                  className="textarea-field email-textarea"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste email or message text here..."
                  rows={6}
                />

                <div className="editor-controls-bar">
                  <span className="char-count">
                    {emailContent.length.toLocaleString()} characters
                  </span>
                  <div className="editor-buttons">
                    <button
                      type="button"
                      className="btn btn-ghost action-sm"
                      onClick={handleClear}
                      disabled={isLoading}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      id="analyse-email-btn"
                      className="btn btn-primary"
                      onClick={handleScanEmail}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="spinner sm" /> Analysing...
                        </>
                      ) : (
                        <>
                          <Shield size={16} /> Analyse Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Result Card: Rendered immediately upon analysis */}
          {result && (
            <div className="email-result-wrapper">
              <ResultCard
                report={result}
                onDraftLetter={onNavigateToLetters}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar Column: What We Check & Security Badges (Matching Reference Screen 2) */}
        <div className="email-side-column">
          {/* Card: What we check */}
          <div className="what-we-check-card card">
            <h3 className="sidebar-card-title">What we check</h3>
            <ul className="check-items-list">
              <li className="check-item">
                <div className="check-icon-circle blue">
                  <Link2 size={16} />
                </div>
                <span>Suspicious links</span>
              </li>
              <li className="check-item">
                <div className="check-icon-circle red">
                  <AlertTriangle size={16} />
                </div>
                <span>Phishing attempts</span>
              </li>
              <li className="check-item">
                <div className="check-icon-circle amber">
                  <Paperclip size={16} />
                </div>
                <span>Malicious attachments</span>
              </li>
              <li className="check-item">
                <div className="check-icon-circle indigo">
                  <UserCheck size={16} />
                </div>
                <span>Sender reputation</span>
              </li>
              <li className="check-item">
                <div className="check-icon-circle purple">
                  <Bot size={16} />
                </div>
                <span>AI-powered risk analysis</span>
              </li>
            </ul>
          </div>

          {/* Card: Your data is secure */}
          <div className="data-secure-card card">
            <div className="secure-badge-header">
              <div className="secure-shield-icon">
                <Shield size={20} className="text-blue" />
              </div>
              <h4 className="secure-title">Your data is secure</h4>
            </div>
            <p className="secure-desc">
              We never store your emails or personal information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSafetyPage;
