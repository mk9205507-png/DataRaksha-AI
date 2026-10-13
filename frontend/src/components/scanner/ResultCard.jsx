import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckSquare, Shield, Info, Copy } from 'lucide-react';

export const ResultCard = ({ report }) => {
  if (!report) return null;

  const {
    risk_level = 'Low',
    risk_score = 15,
    summary = 'No immediate threats or anomalies identified.',
    detected_threats = [],
    recommendations = [],
    exposed_pii = [],
  } = report;

  const getRiskIcon = () => {
    switch (risk_level) {
      case 'High':
        return <AlertOctagon size={28} className="risk-icon high" />;
      case 'Medium':
        return <AlertTriangle size={28} className="risk-icon medium" />;
      default:
        return <ShieldCheck size={28} className="risk-icon low" />;
    }
  };

  const badgeClass = `risk-badge risk-badge-${risk_level.toLowerCase()}`;

  return (
    <div className="report-card glass-card" id="scan-result-card">
      {/* Header section with Risk Rating */}
      <div className="report-header">
        <div className="report-badge-container">
          {getRiskIcon()}
          <div>
            <div className="report-title-row">
              <h3>Threat Assessment Result</h3>
              <span className={badgeClass}>{risk_level} Risk</span>
            </div>
            <p className="report-score-text">Calculated Vulnerability Score: <strong>{risk_score}/100</strong></p>
          </div>
        </div>

        {/* Visual score bar */}
        <div className="score-meter-wrapper">
          <div className="score-meter-bar">
            <div
              className={`score-meter-fill risk-fill-${risk_level.toLowerCase()}`}
              style={{ width: `${Math.min(100, Math.max(10, risk_score))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="report-section summary-section">
        <h4 className="section-title">Plain Language Summary</h4>
        <p className="summary-body">{summary}</p>
      </div>

      {/* Detected Threats */}
      {detected_threats.length > 0 && (
        <div className="report-section threats-section">
          <h4 className="section-title">Identified Risk Factors</h4>
          <div className="threat-chips-list">
            {detected_threats.map((threat, index) => (
              <span key={index} className="threat-chip">
                <AlertTriangle size={12} />
                <span>{threat}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exposed PII */}
      {exposed_pii.length > 0 && (
        <div className="report-section pii-section">
          <h4 className="section-title">Exposed Personally Identifiable Data (PII)</h4>
          <div className="pii-tags-list">
            {exposed_pii.map((pii, index) => (
              <span key={index} className="pii-tag">
                ⚠️ {pii}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className="report-section recommendations-section">
          <h4 className="section-title">Recommended Safety Steps</h4>
          <ul className="recommendations-list">
            {recommendations.map((step, index) => (
              <li key={index} className="recommendation-item">
                <CheckSquare size={16} className="step-icon" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Standard Safety Disclaimer */}
      <div className="safety-disclaimer-box">
        <Info size={16} className="disclaimer-icon" />
        <p className="disclaimer-text">
          {risk_level === 'Low'
            ? 'No obvious risks detected. However, this does not guarantee content is completely safe. Always exercise caution when interacting with unknown senders or links.'
            : 'Automated threat heuristics completed. Do not execute attachments, submit passwords, or interact with untrusted domains.'}
        </p>
      </div>
    </div>
  );
};

export default ResultCard;
