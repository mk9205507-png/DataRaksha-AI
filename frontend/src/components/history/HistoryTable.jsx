import React from 'react';
import HistoryCard from './HistoryCard';
import { History, Filter, Trash2 } from 'lucide-react';

export const HistoryTable = ({
  scans = [],
  filterType,
  filterRisk,
  onFilterTypeChange,
  onFilterRiskChange,
  onDeleteScan,
  onClearAll,
}) => {
  return (
    <div className="history-manager glass-card" id="history-container">
      <div className="history-toolbar">
        <div className="history-title-block">
          <History size={20} className="text-accent" />
          <h3>Analysis History & Audit Trail</h3>
          <span className="count-badge">{scans.length} scans</span>
        </div>

        <div className="history-filters">
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

          {scans.length > 0 && onClearAll && (
            <button
              type="button"
              className="btn btn-secondary action-sm clear-history-btn"
              onClick={onClearAll}
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="empty-history-state">
          <History size={42} className="empty-icon" />
          <h4>No Scan History Records Found</h4>
          <p>Scans you perform while authenticated will appear here for security auditing.</p>
        </div>
      ) : (
        <div className="history-grid-container">
          {scans.map((scan) => (
            <HistoryCard
              key={scan.id}
              scan={scan}
              onDelete={onDeleteScan}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
