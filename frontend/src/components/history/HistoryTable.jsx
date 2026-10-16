import React, { useState } from 'react';
import HistoryCard from './HistoryCard';
import { History, Filter, Trash2, Search, Download, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const HistoryTable = ({
  scans = [],
  filterType,
  filterRisk,
  searchQuery = '',
  onFilterTypeChange,
  onFilterRiskChange,
  onSearchChange,
  onDeleteScan,
  onClearAll,
}) => {
  const [selectedScan, setSelectedScan] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DataRaksha_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="history-manager glass-card" id="history-container">
      {/* Toolbar */}
      <div className="history-toolbar">
        <div className="history-title-block">
          <History size={20} className="text-cyan" />
          <h3>Analysis History & Audit Trail</h3>
          <span className="count-badge">{scans.length} records</span>
        </div>

        <div className="history-filters">
          {/* Keyword Search */}
          {onSearchChange && (
            <div className="filter-search-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Type Filter */}
          <div className="filter-select-wrapper">
            <Filter size={14} />
            <select
              className="filter-dropdown"
              value={filterType}
              onChange={(e) => onFilterTypeChange(e.target.value)}
              aria-label="Filter by scan type"
            >
              <option value="all">All Types</option>
              <option value="message">Messages</option>
              <option value="link">Links</option>
              <option value="policy">Policies</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="filter-select-wrapper">
            <select
              className="filter-dropdown"
              value={filterRisk}
              onChange={(e) => onFilterRiskChange(e.target.value)}
              aria-label="Filter by risk rating"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>

          {/* Export JSON Audit Log */}
          {scans.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary action-sm export-history-btn"
              onClick={handleExportJSON}
              title="Export audit logs as JSON"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          )}

          {/* Clear History */}
          {scans.length > 0 && onClearAll && (
            <button
              type="button"
              className="btn btn-secondary btn-danger-secondary action-sm clear-history-btn"
              onClick={() => setShowClearConfirm(true)}
              title="Delete all records"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="confirm-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon warning-icon">
              <ShieldAlert size={28} className="text-amber" />
            </div>
            <h4>Clear Entire Scan History?</h4>
            <p>
              This will permanently remove all stored scan history items and audit logs from your account. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-danger"
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Selected Scan */}
      {selectedScan && (
        <div className="modal-backdrop" onClick={() => setSelectedScan(null)}>
          <div className="scan-detail-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className={`risk-badge risk-badge-${selectedScan.risk_level.toLowerCase()}`}>
                  {selectedScan.risk_level} Risk ({selectedScan.risk_score}/100)
                </span>
                <span className="type-tag">{selectedScan.scan_type.toUpperCase()} EVALUATION</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedScan(null)}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <label className="section-label">Input Snippet (Privacy-Preserved)</label>
                <div className="snippet-box">
                  "{selectedScan.input_preview}"
                </div>
              </div>

              <div className="detail-section">
                <label className="section-label">AI Threat Evaluation Summary</label>
                <p className="summary-text">{selectedScan.summary}</p>
              </div>

              <div className="detail-meta-row">
                <div className="meta-item">
                  <span className="meta-label">Record ID:</span>
                  <span className="meta-val font-mono">{selectedScan.id}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Scanned On:</span>
                  <span className="meta-val">{new Date(selectedScan.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary action-sm"
                onClick={() => setSelectedScan(null)}
              >
                Close
              </button>
              {onDeleteScan && (
                <button
                  type="button"
                  className="btn btn-danger action-sm"
                  onClick={() => {
                    onDeleteScan(selectedScan.id);
                    setSelectedScan(null);
                  }}
                >
                  <Trash2 size={14} /> Delete Record
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List or Empty State */}
      {scans.length === 0 ? (
        <div className="empty-history-state">
          <History size={42} className="empty-icon text-cyan" />
          <h4>No Scan History Records Found</h4>
          <p>
            {searchQuery || filterType !== 'all' || filterRisk !== 'all'
              ? 'No audit records match your active search and filter criteria.'
              : 'Scans you perform while authenticated will appear here with cryptographic Row-Level Security isolation.'}
          </p>
        </div>
      ) : (
        <div className="history-grid-container">
          {scans.map((scan) => (
            <HistoryCard
              key={scan.id}
              scan={scan}
              onDelete={onDeleteScan}
              onSelect={setSelectedScan}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
