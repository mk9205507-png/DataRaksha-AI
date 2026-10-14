import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, onClose, action }) => {
  const iconMap = {
    info: <Info size={18} className="alert-icon info" />,
    success: <CheckCircle size={18} className="alert-icon success" />,
    warning: <AlertTriangle size={18} className="alert-icon warning" />,
    error: <XCircle size={18} className="alert-icon error" />,
  };

  return (
    <div className={`alert-box alert-${type}`} role="alert">
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
          <button className="alert-close-btn" onClick={onClose} aria-label="Close alert">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;

