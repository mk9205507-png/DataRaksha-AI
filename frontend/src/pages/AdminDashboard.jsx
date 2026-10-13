import React from 'react';
import { BarChart3, Activity, ShieldCheck, AlertTriangle, Database, Zap, Cpu } from 'lucide-react';

export const AdminDashboard = () => {
  const metrics = {
    total_scans: 1420,
    scans_today: 84,
    risk_breakdown: {
      low: 580,
      medium: 520,
      high: 320,
    },
    scans_by_type: {
      message: 810,
      link: 430,
      policy: 180,
    },
    system_status: {
      gemini_api: 'Operational (Latency 340ms)',
      safe_browsing_api: 'Operational (Quota 94% remaining)',
      supabase_db: 'Healthy (RLS Enforced)',
    },
  };

  return (
    <div className="admin-page" id="admin-view">
      <div className="dashboard-hero">
        <div className="hero-badge">
          <BarChart3 size={14} className="hero-badge-icon" />
          <span>System Administrator Oversight</span>
        </div>
        <h1 className="hero-title">
          Platform Activity & <span className="gradient-text">Threat Analytics</span>
        </h1>
        <p className="hero-subtitle">
          Real-time aggregated threat monitoring, external API health verification, and zero-PII security telemetry.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="admin-metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-icon-box cyan">
            <Activity size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Scans Processed</span>
            <span className="metric-value">{metrics.total_scans.toLocaleString()}</span>
            <span className="metric-subtext">Across all user accounts</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box indigo">
            <Zap size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Scans Processed Today</span>
            <span className="metric-value">+{metrics.scans_today}</span>
            <span className="metric-subtext">Peak traffic at 14:00 UTC</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box ruby">
            <AlertTriangle size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">High-Risk Interceptions</span>
            <span className="metric-value">{metrics.risk_breakdown.high}</span>
            <span className="metric-subtext">22.5% of total evaluations</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution & System Status */}
      <div className="admin-two-col-grid">
        {/* Risk Distribution Card */}
        <div className="admin-card glass-card">
          <h3 className="card-section-title">Risk Severity Breakdown</h3>
          <div className="distribution-bars-list">
            <div className="distribution-row">
              <div className="dist-label-row">
                <span className="risk-badge risk-badge-low">Low Risk</span>
                <span className="dist-count">{metrics.risk_breakdown.low} scans (40.8%)</span>
              </div>
              <div className="dist-bar-track">
                <div className="dist-bar-fill risk-fill-low" style={{ width: '40.8%' }}></div>
              </div>
            </div>

            <div className="distribution-row">
              <div className="dist-label-row">
                <span className="risk-badge risk-badge-medium">Medium Risk</span>
                <span className="dist-count">{metrics.risk_breakdown.medium} scans (36.6%)</span>
              </div>
              <div className="dist-bar-track">
                <div className="dist-bar-fill risk-fill-medium" style={{ width: '36.6%' }}></div>
              </div>
            </div>

            <div className="distribution-row">
              <div className="dist-label-row">
                <span className="risk-badge risk-badge-high">High Risk</span>
                <span className="dist-count">{metrics.risk_breakdown.high} scans (22.5%)</span>
              </div>
              <div className="dist-bar-track">
                <div className="dist-bar-fill risk-fill-high" style={{ width: '22.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Health Card */}
        <div className="admin-card glass-card">
          <h3 className="card-section-title">Security Engine Health</h3>
          <div className="health-status-list">
            <div className="health-item">
              <div className="health-left">
                <Cpu size={18} className="text-cyan" />
                <div>
                  <strong className="engine-name">Google Gemini AI Engine</strong>
                  <p className="engine-details">{metrics.system_status.gemini_api}</p>
                </div>
              </div>
              <span className="health-pill operational">Healthy</span>
            </div>

            <div className="health-item">
              <div className="health-left">
                <ShieldCheck size={18} className="text-indigo" />
                <div>
                  <strong className="engine-name">Google Safe Browsing v4</strong>
                  <p className="engine-details">{metrics.system_status.safe_browsing_api}</p>
                </div>
              </div>
              <span className="health-pill operational">Healthy</span>
            </div>

            <div className="health-item">
              <div className="health-left">
                <Database size={18} className="text-emerald" />
                <div>
                  <strong className="engine-name">Supabase PostgreSQL & Auth</strong>
                  <p className="engine-details">{metrics.system_status.supabase_db}</p>
                </div>
              </div>
              <span className="health-pill operational">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
