import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Link2,
  FileText,
  ChevronRight,
  Shield,
  Trash2,
  X,
  ExternalLink,
  Filter,
} from 'lucide-react';
import Alert from '../components/common/Alert';
import apiClient from '../services/api';

// Baseline records from Reference Screen 6 + dynamic backend integration
const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    scan_type: 'email',
    title: 'Email Analysis',
    timestamp: '16 Oct 2026, 2:30 PM',
    risk_level: 'High',
    risk_score: 92,
    badgeClass: 'risk-badge-high',
    icon: Mail,
    iconColor: 'blue',
    preview:
      'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours...',
    summary:
      'Urgency coercion heuristics, bank impersonation, and deceptive verification URL detected.',
    threats: ['Phishing Urgency Cue', 'Unverified Financial Domain', 'PII Harvest Attempt (PAN, PIN)'],
  },
  {
    id: 'hist-2',
    scan_type: 'url',
    title: 'URL Analysis',
    timestamp: '16 Oct 2026, 11:30 AM',
    risk_level: 'Low',
    risk_score: 8,
    badgeClass: 'risk-badge-low',
    icon: Link2,
    iconColor: 'blue',
    preview: 'https://google.com',
    summary: 'Domain verified against Google Safe Browsing and legitimate HTTPS SSL certificates.',
    threats: ['No threats detected'],
  },
  {
    id: 'hist-3',
    scan_type: 'policy',
    title: 'Privacy Policy',
    timestamp: '15 Oct 2026, 4:15 PM',
    risk_level: 'Medium',
    risk_score: 65,
    badgeClass: 'risk-badge-medium',
    icon: FileText,
    iconColor: 'amber',
    preview:
      'We collect your exact GPS location, browser history, microphone telemetry, and share with third-party advertising brokers indefinitely without mandatory prior notice...',
    summary: 'Policy contains aggressive data broker monetization and perpetual audio telemetry retention.',
    threats: ['Data Broker Monetization', 'Real-time GPS Tracking', 'Ambient Audio Telemetry'],
  },
  {
    id: 'hist-4',
    scan_type: 'email',
    title: 'Email Analysis',
    timestamp: '14 Oct 2026, 1:10 PM',
    risk_level: 'Low',
    risk_score: 12,
    badgeClass: 'risk-badge-low',
    icon: Mail,
    iconColor: 'blue',
    preview:
      'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace.',
    summary: 'Clean business communication. No phishing indicators or sensitive data exposed.',
    threats: ['No threats detected'],
  },
  {
    id: 'hist-5',
    scan_type: 'url',
    title: 'URL Analysis',
    timestamp: '13 Oct 2026, 3:45 PM',
    risk_level: 'Medium',
    risk_score: 55,
    badgeClass: 'risk-badge-medium',
    icon: Link2,
    iconColor: 'blue',
    preview: 'http://bit.ly/claim-bank-cashback-instant',
    summary: 'Shortened obfuscated link redirecting to unverified landing page.',
    threats: ['URL Shortener Obfuscation', 'Unencrypted HTTP Protocol'],
  },
];

export const AnalysisHistoryPage = ({ onNavigateBack, onReopenScan }) => {
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [alert, setAlert] = useState(null);

  // Sync with backend /history if available
  useEffect(() => {
    const fetchRemoteHistory = async () => {
      try {
        const res = await apiClient.get('/history');
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Normalize backend records into reference design format
          const formatted = res.data.map((item, idx) => {
            const isEmail = item.scan_type === 'message' || item.scan_type === 'email';
            const isUrl = item.scan_type === 'link' || item.scan_type === 'url';
            const isPolicy = item.scan_type === 'policy';
            const riskLevel = item.risk_level || 'Low';
            return {
              id: item.id || `remote-${idx}`,
              scan_type: isEmail ? 'email' : isUrl ? 'url' : 'policy',
              title: isEmail ? 'Email Analysis' : isUrl ? 'URL Analysis' : 'Privacy Policy',
              timestamp: item.created_at
                ? new Date(item.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'Recent',
              risk_level: riskLevel,
              risk_score: item.risk_score || 0,
              badgeClass:
                riskLevel === 'High'
                  ? 'risk-badge-high'
                  : riskLevel === 'Medium'
                  ? 'risk-badge-medium'
                  : 'risk-badge-low',
              icon: isEmail ? Mail : isUrl ? Link2 : FileText,
              iconColor: isPolicy ? 'amber' : 'blue',
              preview: item.input_preview || item.content || '',
              summary: item.summary || 'Threat scan completed.',
              threats: item.detected_threats || [],
            };
          });
          setHistoryList(formatted);
        }
      } catch {
        // Retain initial reference history
      }
    };

    fetchRemoteHistory();
  }, []);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    setAlert({ type: 'info', message: 'Analysis record removed from your history.' });

    try {
      await apiClient.delete(`/history/${id}`);
    } catch {
      // Backend deletion endpoint handled gracefully
    }
  };

  const filteredItems = historyList.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'email') return item.scan_type === 'email';
    if (filterType === 'url') return item.scan_type === 'url';
    if (filterType === 'policy') return item.scan_type === 'policy';
    if (filterType === 'high') return item.risk_level === 'High';
    if (filterType === 'low') return item.risk_level === 'Low';
    return true;
  });

  return (
    <div className="analysis-history-page" id="analysis-history-view">
      {/* Top Page Header (Matching Reference Screen 6) */}
      <div className="inner-page-header">
        <button
          type="button"
          className="header-back-btn"
          onClick={onNavigateBack}
          title="Return to Dashboard"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
          <h1 className="header-title">Analysis History</h1>
        </button>
        <p className="header-subtitle">
          View your past analyses and results.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter Chips Bar */}
      <div className="history-filter-bar">
        <button
          type="button"
          className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({historyList.length})
        </button>
        <button
          type="button"
          className={`filter-chip ${filterType === 'email' ? 'active' : ''}`}
          onClick={() => setFilterType('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`filter-chip ${filterType === 'url' ? 'active' : ''}`}
          onClick={() => setFilterType('url')}
        >
          URL
        </button>
        <button
          type="button"
          className={`filter-chip ${filterType === 'policy' ? 'active' : ''}`}
          onClick={() => setFilterType('policy')}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          className={`filter-chip ${filterType === 'high' ? 'active' : ''}`}
          onClick={() => setFilterType('high')}
        >
          High Risk
        </button>
        <button
          type="button"
          className={`filter-chip ${filterType === 'low' ? 'active' : ''}`}
          onClick={() => setFilterType('low')}
        >
          Low Risk
        </button>
      </div>

      {/* History Items List (Matching Reference Screen 6) */}
      <div className="history-cards-container">
        {filteredItems.length === 0 ? (
          <div className="empty-history-card card">
            <Shield size={32} className="text-muted" />
            <h3>No past analyses found</h3>
            <p>Scans you run in Email Safety, URL Safety, or Privacy Policy will appear here.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="history-card-item card"
                onClick={() => setSelectedItem(item)}
                role="button"
                tabIndex={0}
              >
                <div className="history-card-left">
                  <div className={`history-icon-box ${item.iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="history-card-details">
                    <span className="history-item-title">{item.title}</span>
                    <span className="history-item-timestamp">{item.timestamp}</span>
                  </div>
                </div>

                <div className="history-card-right">
                  <span className={`risk-badge ${item.badgeClass}`}>
                    {item.risk_level} Risk
                  </span>
                  <ChevronRight size={18} className="history-item-chevron text-muted" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Item Details Modal / Slide-out */}
      {selectedItem && (
        <div
          className="history-modal-backdrop"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="history-modal-card card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-left">
                <span className={`risk-badge ${selectedItem.badgeClass}`}>
                  {selectedItem.risk_level} Risk ({selectedItem.risk_score}/100)
                </span>
                <h3 className="modal-title">{selectedItem.title}</h3>
                <span className="modal-date">{selectedItem.timestamp}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <label className="modal-label">Analyzed Input Snippet</label>
                <div className="modal-input-preview">
                  <code>{selectedItem.preview}</code>
                </div>
              </div>

              <div className="modal-section">
                <label className="modal-label">Summary & Analysis</label>
                <p className="modal-summary-text">{selectedItem.summary}</p>
              </div>

              {selectedItem.threats && selectedItem.threats.length > 0 && (
                <div className="modal-section">
                  <label className="modal-label">Detected Factors</label>
                  <div className="modal-threats-tags">
                    {selectedItem.threats.map((t, idx) => (
                      <span key={idx} className="threat-tag-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost text-red"
                onClick={(e) => handleDelete(selectedItem.id, e)}
              >
                <Trash2 size={16} /> Delete Record
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistoryPage;
