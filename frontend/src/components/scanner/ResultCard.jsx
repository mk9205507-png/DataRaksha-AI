import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

const MANDATORY_DISCLAIMER =
  'No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online.';

export const ResultCard = ({ report }) => {
  if (!report) return null;

  // Derive risk level and score with safe fallbacks
  const rawScore = typeof report.risk_score === 'number' ? report.risk_score : 0;
  const risk_score = Math.min(100, Math.max(0, rawScore));

  let derivedLevel = report.risk_level;
  if (!derivedLevel) {
    if (risk_score >= 70) derivedLevel = 'High';
    else if (risk_score >= 40) derivedLevel = 'Medium';
    else derivedLevel = 'Low';
  }

  // Capitalize properly: "Low" | "Medium" | "High"
  const risk_level =
    derivedLevel.charAt(0).toUpperCase() + derivedLevel.slice(1).toLowerCase();

  const summary = report.summary || 'Threat analysis complete. Review detailed metrics below.';
  const detected_threats = Array.isArray(report.detected_threats) ? report.detected_threats : [];
  const exposed_pii = Array.isArray(report.exposed_pii) ? report.exposed_pii : [];
  const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];
  const disclaimer = report.disclaimer || MANDATORY_DISCLAIMER;

  const getRiskDetails = () => {
    switch (risk_level) {
      case 'High':
        return {
          icon: <AlertOctagon size={28} className="risk-icon high" />,
          label: 'High Risk',
          color: '#EF4444',
          badgeClass: 'risk-badge risk-badge-high',
          fillClass: 'risk-fill-high',
          borderColor: '#EF4444',
          guidance: 'Immediate threat detected. Avoid clicking links, downloading attachments, or submitting credentials.',
        };
      case 'Medium':
        return {
          icon: <AlertTriangle size={28} className="risk-icon medium" />,
          label: 'Medium Risk',
          color: '#F59E0B',
          badgeClass: 'risk-badge risk-badge-medium',
          fillClass: 'risk-fill-medium',
          borderColor: '#F59E0B',
          guidance: 'Suspicious cues identified. Exercise caution and verify sender or website identity.',
        };
      default:
        return {
          icon: <ShieldCheck size={28} className="risk-icon low" />,
          label: 'Low Risk',
          color: '#10B981',
          badgeClass: 'risk-badge risk-badge-low',
          fillClass: 'risk-fill-low',
          borderColor: '#10B981',
          guidance: 'No critical threats detected. Maintain standard digital vigilance.',
        };
    }
  };

  const riskDetails = getRiskDetails();

  return (
    <div
      className="report-card glass-card"
      id="scan-result-card"
      style={{ borderLeftColor: riskDetails.borderColor }}
    >
      {/* Header section with Risk Rating & Score Meter */}
      <div className="report-header">
        <div className="report-badge-container">
          {riskDetails.icon}
          <div>
            <div className="report-title-row">
              <h3>Threat Assessment Result</h3>
              <span className={riskDetails.badgeClass} id="risk-level-badge">
                {risk_level === 'Low' && '🟢 '}
                {risk_level === 'Medium' && '🟡 '}
                {risk_level === 'High' && '🔴 '}
                {riskDetails.label}
              </span>
            </div>
            <p className="report-score-text">
              Vulnerability Threat Score: <strong id="risk-score-value">{risk_score}/100</strong>
              <span className="risk-threshold-desc">
                {risk_score < 40 ? ' (0–39 Low)' : risk_score < 70 ? ' (40–69 Medium)' : ' (70–100 High)'}
              </span>
            </p>
          </div>
        </div>

        {/* Visual score meter bar */}
        <div className="score-meter-wrapper">
          <div className="score-meter-meta">
            <span className="meter-label">Threat Meter</span>
            <span className="meter-pct">{risk_score}%</span>
          </div>
          <div className="score-meter-bar" aria-label={`Risk score ${risk_score} out of 100`}>
            <div
              className={`score-meter-fill ${riskDetails.fillClass}`}
              style={{ width: `${Math.max(6, risk_score)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Plain Language Summary Banner */}
      <div className="report-section summary-section" id="summary-section">
        <h4 className="section-title">Plain Language Summary</h4>
        <div className="summary-banner">
          <p className="summary-body">{summary}</p>
        </div>
      </div>

      {/* Identified Risk Factors / Threats */}
      {detected_threats.length > 0 && (
        <div className="report-section threats-section" id="threats-section">
          <h4 className="section-title">
            Identified Risk Factors ({detected_threats.length})
          </h4>
          <div className="threat-chips-list">
            {detected_threats.map((threat, index) => {
              const isObj = typeof threat === 'object' && threat !== null;
              const category = isObj ? threat.category || threat.title : null;
              const description = isObj ? threat.description : threat;
              const severity = isObj && threat.severity ? threat.severity : null;

              return (
                <div key={index} className="threat-chip-enhanced">
                  <div className="threat-chip-header">
                    <AlertTriangle size={14} className="threat-icon" />
                    <span className="threat-title">{category || description}</span>
                    {severity && (
                      <span className={`threat-severity-badge severity-${String(severity).toLowerCase()}`}>
                        {severity}
                      </span>
                    )}
                  </div>
                  {category && description && category !== description && (
                    <p className="threat-chip-desc">{description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exposed Personally Identifiable Information (PII) */}
      {exposed_pii.length > 0 && (
        <div className="report-section pii-section" id="pii-section">
          <h4 className="section-title pii-title">
            <ShieldAlert size={16} /> Exposed Personally Identifiable Data (PII)
          </h4>
          <p className="pii-subtext">The following sensitive credentials or identity tokens were detected:</p>
          <div className="pii-tags-list">
            {exposed_pii.map((pii, index) => {
              const isObj = typeof pii === 'object' && pii !== null;
              const displayText = isObj ? `${pii.type || pii.label || 'Exposed'}: ${pii.value || pii.match}` : pii;
              return (
                <span key={index} className="pii-tag">
                  <KeyRound size={13} className="pii-icon" />
                  <span>{displayText}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className="report-section recommendations-section" id="recommendations-section">
          <h4 className="section-title">Actionable Safety Recommendations</h4>
          <ul className="recommendations-list">
            {recommendations.map((step, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-index">{index + 1}</span>
                <span className="recommendation-text">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prominent Mandatory Safety Disclaimer */}
      <div className="safety-disclaimer-box prominent-disclaimer" id="mandatory-disclaimer">
        <Info size={18} className="disclaimer-icon" />
        <div className="disclaimer-content">
          <strong className="disclaimer-heading">Official Safety Notice:</strong>
          <p className="disclaimer-text">{disclaimer}</p>
          {disclaimer !== MANDATORY_DISCLAIMER && (
            <p className="disclaimer-mandatory-subtext">{MANDATORY_DISCLAIMER}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;

