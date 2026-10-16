import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  FileText,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const MANDATORY_DISCLAIMER =
  'No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online.';

export const ResultCard = ({ report, onDraftLetter }) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedRecIndex, setCopiedRecIndex] = useState(null);

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
          glowColor: 'rgba(239, 68, 68, 0.25)',
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
          glowColor: 'rgba(245, 158, 11, 0.25)',
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
          glowColor: 'rgba(16, 185, 129, 0.25)',
          guidance: 'No critical threats detected. Maintain standard digital vigilance.',
        };
    }
  };

  const riskDetails = getRiskDetails();

  // Copy full threat assessment report
  const handleCopyReport = async () => {
    const reportText = `=== DataRaksha AI Threat Assessment Report ===
Risk Level: ${risk_level} (${risk_score}/100)
Summary: ${summary}

Detected Threats:
${detected_threats.map((t) => `- ${typeof t === 'object' ? t.description || t.category : t}`).join('\n') || '- None'}

Exposed PII:
${exposed_pii.map((p) => `- ${typeof p === 'object' ? `${p.type}: ${p.value}` : p}`).join('\n') || '- None'}

Actionable Recommendations:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') || '- None'}

Official Disclaimer:
${disclaimer}`;

    try {
      await navigator.clipboard.writeText(reportText);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyRecommendation = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecIndex(idx);
      setTimeout(() => setCopiedRecIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Helper to extract company name from threats or summary
  const getDetectedEntity = () => {
    if (report.target_company) return report.target_company;
    // Check if summary mentions a brand
    const commonBrands = ['State Bank', 'SBI', 'Amazon', 'Google', 'Meta', 'Facebook', 'Microsoft', 'Flipkart', 'PayPal', 'Netflix'];
    for (const b of commonBrands) {
      if (summary.includes(b) || (report.content || '').includes(b)) {
        return b;
      }
    }
    return '';
  };

  const detectedEntity = getDetectedEntity();

  // SVG Gauge Calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (risk_score / 100) * circumference;

  return (
    <div
      className="report-card glass-card"
      id="scan-result-card"
      style={{
        borderLeftColor: riskDetails.borderColor,
        boxShadow: `0 8px 32px 0 ${riskDetails.glowColor}`,
      }}
    >
      {/* Top Header section with Risk Rating & Circular Threat Gauge */}
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

        {/* Circular SVG Threat Score Gauge */}
        <div className="circular-gauge-container">
          <svg className="circular-gauge" width="100" height="100" viewBox="0 0 100 100">
            <circle
              className="gauge-bg"
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              className="gauge-fill"
              cx="50"
              cy="50"
              r={radius}
              stroke={riskDetails.color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-score-number" style={{ color: riskDetails.color }}>
              {risk_score}
            </span>
            <span className="gauge-score-label">/ 100</span>
          </div>
        </div>
      </div>

      {/* Cross-Module Quick Actions Bar */}
      <div className="report-quick-actions-bar">
        <button
          type="button"
          className="btn btn-secondary action-sm copy-report-btn"
          onClick={handleCopyReport}
          title="Copy full threat evaluation report to clipboard"
        >
          {copiedReport ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          <span>{copiedReport ? 'Report Copied!' : 'Copy Full Report'}</span>
        </button>

        {onDraftLetter && (
          <button
            type="button"
            className="btn btn-primary action-sm draft-notice-btn"
            onClick={() => onDraftLetter(detectedEntity || 'Target Organization', summary)}
            title="Open Data Request Letter Studio to draft a formal erasure notice"
          >
            <FileText size={14} />
            <span>Draft Statutory Deletion Notice</span>
            <ChevronRight size={13} />
          </button>
        )}
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
                <button
                  type="button"
                  className="rec-copy-btn"
                  onClick={() => handleCopyRecommendation(step, index)}
                  title="Copy this recommendation"
                >
                  {copiedRecIndex === index ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
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
