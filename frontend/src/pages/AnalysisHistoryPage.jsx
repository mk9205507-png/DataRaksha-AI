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
  Search,
  RotateCcw,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Alert from '../components/common/Alert';
import { historyService } from '../services/historyService';
import { useAuth } from '../context/AuthContext';

export const AnalysisHistoryPage = ({ onNavigateBack, onReopenScan, onNavigateToLetters }) => {
  const { isAuthenticated, user } = useAuth();
  const [historyList, setHistoryList] = useState(() =>
    user?.id ? historyService.getStoredScans(user.id) : []
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [alert, setAlert] = useState(null);

  // Sync with remote /history if authenticated, and listen for live updates
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setHistoryList([]);
      return;
    }

    // 1. Initial local load for this user
    setHistoryList(historyService.getStoredScans(user.id));

    // 2. Remote sync strictly for this user
    const syncRemote = async () => {
      try {
        const synced = await historyService.fetchAndSyncHistory(user.id);
        if (Array.isArray(synced)) {
          setHistoryList(synced);
        }
      } catch (e) {
        console.warn('History sync warning:', e);
      }
    };
    syncRemote();

    // 3. Live event listener for scans added across other tabs/pages
    const handleHistoryUpdate = (e) => {
      if (e.detail?.userId && e.detail.userId !== user.id) {
        return; // Ignore events from other accounts
      }
      if (Array.isArray(e.detail?.allRecords)) {
        const myRecords = e.detail.allRecords.filter((r) => r.user_id === user.id);
        setHistoryList(myRecords);
      } else {
        setHistoryList(historyService.getStoredScans(user.id));
      }
    };

    window.addEventListener('dataraksha:history_updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('dataraksha:history_updated', handleHistoryUpdate);
    };
  }, [isAuthenticated, user?.id]);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    await historyService.deleteStoredScan(id, user?.id);
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    setAlert({ type: 'info', message: 'Analysis record removed from your history.' });
  };

  const handleClearAll = async () => {
    await historyService.clearAllStoredScans(user?.id);
    setHistoryList([]);
    setSelectedItem(null);
    setShowClearConfirm(false);
    setAlert({ type: 'info', message: 'All scan history records have been permanently cleared.' });
  };

  const handleReopenInScanner = (item) => {
    if (onReopenScan) {
      onReopenScan(item);
    }
  };

  const handleDraftNotice = (item) => {
    if (onNavigateToLetters) {
      onNavigateToLetters({
        company_name: item.target_company || 'Identified Organization',
        custom_notes: item.summary,
      });
    }
  };

  const filteredItems = historyList.filter((item) => {
    // 1. Filter by category
    if (filterType === 'email' && item.scan_type !== 'email') return false;
    if (filterType === 'url' && item.scan_type !== 'url') return false;
    if (filterType === 'policy' && item.scan_type !== 'policy') return false;
    if (filterType === 'high' && item.risk_level !== 'High') return false;
    if (filterType === 'medium' && item.risk_level !== 'Medium') return false;
    if (filterType === 'low' && item.risk_level !== 'Low') return false;

    // 2. Keyword Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPreview = (item.preview || '').toLowerCase().includes(q);
      const matchSummary = (item.summary || '').toLowerCase().includes(q);
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchThreats = (item.threats || []).some((t) => t.toLowerCase().includes(q));
      if (!matchPreview && !matchSummary && !matchTitle && !matchThreats) {
        return false;
      }
    }

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
          <h1 className="header-title">Scan History</h1>
        </button>
        <p className="header-subtitle">
          View and manage your past security threat analyses and privacy audit logs.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Audit Trail Toolbar: Search & Clear All */}
      <div className="history-search-row">
        <div className="history-search-input-wrapper">
          <Search size={16} className="history-search-icon text-muted" />
          <input
            id="history-search-bar"
            type="text"
            className="input-field history-search-input"
            placeholder="Search past scans, URLs, keywords, or threats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="history-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {historyList.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost text-red action-sm history-clear-all-btn"
            onClick={() => setShowClearConfirm(true)}
            title="Clear all stored history"
          >
            <Trash2 size={15} />
            <span>Clear All</span>
          </button>
        )}
      </div>

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
          className={`filter-chip ${filterType === 'medium' ? 'active' : ''}`}
          onClick={() => setFilterType('medium')}
        >
          Medium Risk
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
            <Shield size={36} className="text-muted mb-2" />
            <h3>{historyList.length === 0 ? 'No analyses yet' : 'No matching analyses found'}</h3>
            <p>
              {searchQuery
                ? `No scans matched "${searchQuery}". Try a different keyword.`
                : historyList.length === 0
                ? "You haven't scanned any emails, web links, or privacy policies yet. Scans you perform will appear here automatically."
                : 'No analyses matched the selected filter criteria.'}
            </p>
            {historyList.length === 0 && (
              <button
                type="button"
                className="btn btn-primary action-sm mt-3"
                onClick={() => (onNavigateBack ? onNavigateBack() : null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0.75rem auto 0' }}
              >
                <Sparkles size={15} />
                <span>Start Your First Scan</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon =
              item.scan_type === 'email' ? Mail : item.scan_type === 'url' ? Link2 : FileText;
            const iconColor = item.scan_type === 'policy' ? 'amber' : 'blue';

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
                  <div className={`history-icon-box ${iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="history-card-details">
                    <span className="history-item-title">{item.title}</span>
                    <span className="history-item-timestamp">{item.timestamp}</span>
                  </div>
                </div>

                <div className="history-card-right">
                  <span className={`risk-badge ${item.badgeClass || (item.risk_level === 'High' ? 'risk-badge-high' : item.risk_level === 'Medium' ? 'risk-badge-medium' : 'risk-badge-low')}`}>
                    {item.risk_level} Risk {typeof item.risk_score === 'number' ? `(${item.risk_score}/100)` : ''}
                  </span>
                  <ChevronRight size={18} className="history-item-chevron text-muted" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="history-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="history-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <AlertTriangle size={24} className="text-amber" />
                <h3 className="modal-title">Clear All History?</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowClearConfirm(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete all {historyList.length} past scan records from your audit trail? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary bg-red"
                onClick={handleClearAll}
              >
                <Trash2 size={16} /> Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className={`risk-badge ${selectedItem.badgeClass || (selectedItem.risk_level === 'High' ? 'risk-badge-high' : selectedItem.risk_level === 'Medium' ? 'risk-badge-medium' : 'risk-badge-low')}`}>
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

              {selectedItem.exposed_pii && selectedItem.exposed_pii.length > 0 && (
                <div className="modal-section">
                  <label className="modal-label">Exposed Sensitive Personal Data (PII)</label>
                  <div className="modal-threats-tags">
                    {selectedItem.exposed_pii.map((p, idx) => (
                      <span key={idx} className="threat-tag-pill danger">
                        {typeof p === 'object' ? `${p.type}: ${p.value}` : p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.recommendations && selectedItem.recommendations.length > 0 && (
                <div className="modal-section">
                  <label className="modal-label">Actionable Recommendations</label>
                  <ul className="modal-recommendations-list">
                    {selectedItem.recommendations.map((rec, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} className="text-blue" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-footer-left">
                <button
                  type="button"
                  className="btn btn-ghost text-red"
                  onClick={(e) => handleDelete(selectedItem.id, e)}
                  title="Delete record from audit trail"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>

              <div className="modal-footer-right">
                {onNavigateToLetters && (selectedItem.risk_level === 'High' || selectedItem.scan_type === 'policy') && (
                  <button
                    type="button"
                    className="btn btn-secondary action-sm"
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      handleDraftNotice(item);
                    }}
                    title="Draft statutory data erasure notice"
                  >
                    <FileCode size={15} /> Draft Legal Notice
                  </button>
                )}

                {onReopenScan && (
                  <button
                    type="button"
                    className="btn btn-primary action-sm"
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      handleReopenInScanner(item);
                    }}
                    title="Load this scan in its specialized scanner"
                  >
                    <RotateCcw size={15} /> Re-open in Scanner
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-ghost action-sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistoryPage;
