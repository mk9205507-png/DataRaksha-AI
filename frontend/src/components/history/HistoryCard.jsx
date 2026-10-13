import React from 'react';
import { Mail, Globe, FileCode2, Trash2, Calendar, ChevronRight } from 'lucide-react';

export const HistoryCard = ({ scan, onDelete, onSelect }) => {
  const { id, scan_type, input_preview, risk_level, risk_score, created_at, summary } = scan;

  const getTypeIcon = () => {
    switch (scan_type) {
      case 'link':
        return <Globe size={16} />;
      case 'policy':
        return <FileCode2 size={16} />;
      default:
        return <Mail size={16} />;
    }
  };

  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="history-item-card glass-card">
      <div className="history-card-header">
        <div className="type-badge-container">
          <span className="type-icon">{getTypeIcon()}</span>
          <span className="type-name">{scan_type.toUpperCase()} SCAN</span>
        </div>
        <span className={`risk-badge risk-badge-${risk_level.toLowerCase()}`}>
          {risk_level} ({risk_score})
        </span>
      </div>

      <div className="history-snippet" onClick={() => onSelect && onSelect(scan)}>
        <p className="preview-text">"{input_preview}"</p>
        <p className="summary-subtext">{summary}</p>
      </div>

      <div className="history-card-footer">
        <span className="history-date">
          <Calendar size={13} /> {formattedDate}
        </span>
        <div className="history-actions">
          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-danger-ghost action-sm"
              onClick={() => onDelete(id)}
              title="Delete record"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
