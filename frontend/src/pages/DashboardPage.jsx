import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Link2,
  FileText,
  ArrowRight,
  ChevronRight,
  Layers,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/historyService';

export const DashboardPage = ({ onNavigate, onSelectActivity }) => {
  const { user, isAuthenticated } = useAuth();
  const displayName =
    user?.displayName ||
    user?.name ||
    user?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const [historyList, setHistoryList] = useState(() =>
    user?.id ? historyService.getStoredScans(user.id) : []
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setHistoryList([]);
      return;
    }

    // Initial fetch from local store for this user
    setHistoryList(historyService.getStoredScans(user.id));

    // Sync remote scans strictly for this user
    historyService.fetchAndSyncHistory(user.id).then((synced) => {
      if (Array.isArray(synced)) {
        setHistoryList(synced);
      }
    });

    const handleUpdate = (e) => {
      if (e.detail?.userId && e.detail.userId !== user.id) {
        return; // Ignore events from other users
      }
      if (Array.isArray(e.detail?.allRecords)) {
        const myRecords = e.detail.allRecords.filter((r) => r.user_id === user.id);
        setHistoryList(myRecords);
      } else {
        setHistoryList(historyService.getStoredScans(user.id));
      }
    };

    window.addEventListener('dataraksha:history_updated', handleUpdate);
    return () => window.removeEventListener('dataraksha:history_updated', handleUpdate);
  }, [isAuthenticated, user?.id]);

  const totalScans = historyList.length;
  const highRiskCount = historyList.filter((item) => item.risk_level === 'High').length;
  const lowRiskCount = historyList.filter((item) => item.risk_level === 'Low').length;

  let calculatedScore = null;
  let scoreLevel = 'Not enough data yet';

  if (totalScans > 0) {
    const penalty = highRiskCount * 18 + (totalScans - highRiskCount - lowRiskCount) * 6;
    calculatedScore = Math.max(20, Math.min(100, 100 - penalty));
    scoreLevel =
      calculatedScore >= 80
        ? 'High Protection Level'
        : calculatedScore >= 60
        ? 'Moderate Protection'
        : 'Attention Advised';
  }

  // Real stats calculated strictly from authentic records
  const stats = [
    {
      id: 'score',
      label: 'Digital Safety Score',
      value: totalScans === 0 ? 'No score available' : `${calculatedScore}/100`,
      subtext: totalScans === 0 ? 'Not enough data yet' : scoreLevel,
      icon: ShieldCheck,
      colorClass: totalScans === 0 ? 'neutral' : calculatedScore >= 70 ? 'green' : calculatedScore >= 50 ? 'amber' : 'red',
      barColor: totalScans === 0 ? '#94a3b8' : calculatedScore >= 70 ? '#10b981' : calculatedScore >= 50 ? '#f59e0b' : '#ef4444',
      progressPercent: totalScans === 0 ? 0 : calculatedScore,
    },
    {
      id: 'total',
      label: 'Total Analyses',
      value: totalScans,
      subtext: totalScans === 0 ? 'No scans performed yet' : 'Completed scans',
      icon: Layers,
      colorClass: 'blue',
      barColor: '#2563eb',
      progressPercent: totalScans > 0 ? 100 : 0,
    },
    {
      id: 'high-risk',
      label: 'High Risk Threats',
      value: highRiskCount,
      subtext: highRiskCount === 1 ? '1 threat intercepted' : `${highRiskCount} threats intercepted`,
      icon: ShieldAlert,
      colorClass: 'red',
      barColor: '#ef4444',
      progressPercent: totalScans > 0 ? Math.round((highRiskCount / totalScans) * 100) : 0,
    },
    {
      id: 'low-risk',
      label: 'Clean / Low Risk',
      value: lowRiskCount,
      subtext: 'Verified safe items',
      icon: ShieldCheck,
      colorClass: 'green',
      barColor: '#10b981',
      progressPercent: totalScans > 0 ? Math.round((lowRiskCount / totalScans) * 100) : 0,
    },
  ];

  const recentActivities = historyList.slice(0, 4).map((item) => ({
    id: item.id,
    type: item.scan_type,
    title: item.title,
    subtitle: item.summary || 'Security assessment completed.',
    risk: item.risk_level,
    badgeClass:
      item.badgeClass ||
      (item.risk_level === 'High'
        ? 'risk-badge-high'
        : item.risk_level === 'Medium'
        ? 'risk-badge-medium'
        : 'risk-badge-low'),
    icon: item.scan_type === 'email' ? Mail : item.scan_type === 'url' ? Link2 : FileText,
    iconColorClass: item.risk_level === 'High' ? 'red' : item.risk_level === 'Medium' ? 'amber' : 'green',
    date: item.timestamp,
    preview: item.preview,
    target_company: item.target_company,
  }));

  const handleItemClick = (activity) => {
    if (onSelectActivity) {
      onSelectActivity(activity);
    } else {
      onNavigate(activity.type);
    }
  };

  return (
    <div className="dashboard-overview-page" id="dashboard-overview">
      {/* Personalized Greeting Header */}
      <div className="inner-page-header">
        <h1 className="header-title">
          Hello, <span className="text-blue">{displayName}</span>
        </h1>
        <p className="header-subtitle text-muted">
          Welcome to your DataRaksha AI risk protection dashboard.
        </p>
      </div>

      {/* 3 Core Tools Launch Section (Requirement 4) */}
      <div className="dashboard-tools-section mb-6">
        <h2 className="section-subtitle mb-3">Security Tools</h2>
        <div className="dashboard-quick-actions-bar">
          {/* Tool 1: Email Security Analysis */}
          <button
            type="button"
            id="tool-email-analysis"
            className="quick-action-card card"
            onClick={() => onNavigate('email')}
          >
            <div className="quick-action-icon blue">
              <Mail size={22} />
            </div>
            <div className="quick-action-info">
              <strong>Email Security Analysis</strong>
              <p>Detect phishing tactics, urgency cues & sensitive PII leaks</p>
            </div>
            <ArrowRight size={18} className="text-blue quick-action-arrow" />
          </button>

          {/* Tool 2: URL Security Checker */}
          <button
            type="button"
            id="tool-url-checker"
            className="quick-action-card card"
            onClick={() => onNavigate('url')}
          >
            <div className="quick-action-icon green">
              <Link2 size={22} />
            </div>
            <div className="quick-action-info">
              <strong>URL Security Checker</strong>
              <p>Scan links against Google Safe Browsing threat feeds</p>
            </div>
            <ArrowRight size={18} className="text-blue quick-action-arrow" />
          </button>

          {/* Tool 3: Privacy Policy Analyzer */}
          <button
            type="button"
            id="tool-policy-analyzer"
            className="quick-action-card card"
            onClick={() => onNavigate('policy')}
          >
            <div className="quick-action-icon amber">
              <FileText size={22} />
            </div>
            <div className="quick-action-info">
              <strong>Privacy Policy Analyzer</strong>
              <p>Demystify clauses, uncover data brokers & statutory rights</p>
            </div>
            <ArrowRight size={18} className="text-blue quick-action-arrow" />
          </button>
        </div>
      </div>

      {/* Genuine Metric Stats Grid */}
      <div className="dashboard-stats-grid mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="stat-card card">
              <div className="stat-card-header">
                <div className={`stat-icon-box ${stat.colorClass}`}>
                  <Icon size={20} />
                </div>
                <span className="stat-card-label">{stat.label}</span>
              </div>

              <div className="stat-card-body">
                <span className="stat-card-number">{stat.value}</span>
                <span className="stat-card-subtext">{stat.subtext}</span>
              </div>

              <div className="stat-card-progress">
                <div
                  className="stat-progress-bar"
                  style={{
                    backgroundColor: stat.barColor,
                    width: `${stat.progressPercent}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Analysis History Section */}
      <div className="recent-activity-card card">
        <div className="activity-card-header">
          <h2 className="activity-section-title">Recent Analysis History</h2>
          {recentActivities.length > 0 && (
            <button
              type="button"
              className="view-all-link-btn"
              onClick={() => onNavigate('history')}
            >
              <span>View Full History</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Empty State when user has no prior analyses */}
        {recentActivities.length === 0 ? (
          <div className="empty-activity-state text-center p-8">
            <div className="empty-state-icon mx-auto mb-3">
              <Inbox size={40} className="text-muted" />
            </div>
            <h3 className="empty-state-title font-medium text-base mb-1">
              No analyses yet
            </h3>
            <p className="empty-state-desc text-sm text-muted max-w-md mx-auto mb-4">
              You haven't scanned any emails, web links, or privacy policies yet. Start your first scan to view real risk assessments.
            </p>
            <button
              type="button"
              id="start-first-scan-btn"
              className="btn btn-primary action-sm"
              onClick={() => onNavigate('email')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
            >
              <Sparkles size={15} />
              <span>Start Your First Scan</span>
            </button>
          </div>
        ) : (
          <div className="activity-list-container">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  id={`activity-row-${act.id}`}
                  className="activity-item-row"
                  onClick={() => handleItemClick(act)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="activity-item-left">
                    <div className={`activity-icon-badge ${act.iconColorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="activity-info">
                      <span className="activity-item-title">{act.title}</span>
                      <span className="activity-item-sub">{act.subtitle}</span>
                    </div>
                  </div>

                  <div className="activity-item-right">
                    <span className={`risk-badge ${act.badgeClass}`}>
                      {act.risk} Risk
                    </span>
                    <ArrowRight size={16} className="activity-arrow text-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
