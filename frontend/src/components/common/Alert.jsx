import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, onClose, action, id }) => {
  const iconMap = {
    info: <Info size={20} className="alert-icon info" />,
    success: <CheckCircle2 size={20} className="alert-icon success" />,
    warning: <AlertTriangle size={20} className="alert-icon warning" />,
    error: <XCircle size={20} className="alert-icon error" />,
  };

  return (
    <div className={`alert-box alert-${type}`} role="alert" id={id || `alert-${type}`}>
      <div className="alert-content-wrapper">
        {iconMap[type] || iconMap.info}
        <div className="alert-text">
          {title && <strong className="alert-title">{title}</strong>}
          <span className="alert-message">{message}</span>
        </div>
      </div>
      <div className="alert-actions-wrapper">
        {action}
        {onClose && (
          <button className="alert-close-btn" onClick={onClose} aria-label="Close alert" type="button">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;

