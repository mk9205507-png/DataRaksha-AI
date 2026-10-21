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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/historyService';

export const DashboardPage = ({ onNavigate, onSelectActivity }) => {
  const { user, isAuthenticated } = useAuth();
  const displayName =
    user?.displayName ||
    user?.name ||
    user?.full_name ||
    (isAuthenticated ? localStorage.getItem('dataraksha_person_name') : '') ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const [historyList, setHistoryList] = useState(() => historyService.getStoredScans());

  useEffect(() => {
    setHistoryList(historyService.getStoredScans());

    const handleUpdate = (e) => {
      if (Array.isArray(e.detail?.allRecords)) {
        setHistoryList(e.detail.allRecords);
      } else {
        setHistoryList(historyService.getStoredScans());
      }
    };

    window.addEventListener('dataraksha:history_updated', handleUpdate);
    return () => window.removeEventListener('dataraksha:history_updated', handleUpdate);
  }, []);

  const totalScans = historyList.length;
  const highRiskCount = historyList.filter((item) => item.risk_level === 'High').length;
  const lowRiskCount = historyList.filter((item) => item.risk_level === 'Low').length;

  let calculatedScore = 84;
  if (totalScans > 0) {
    const penalty = highRiskCount * 14 + (totalScans - highRiskCount - lowRiskCount) * 5;
    calculatedScore = Math.max(32, Math.min(98, 100 - penalty));
  }

  const scoreLevel =
    calculatedScore >= 80 ? 'High Protection Level' : calculatedScore >= 60 ? 'Moderate Protection' : 'Attention Advised';

  // Stats matching reference design with Digital Safety Score
  const stats = [
    {
      id: 'score',
      label: 'Digital Safety Score',
      value: `${calculatedScore}/100`,
      subtext: scoreLevel,
      icon: ShieldCheck,
      colorClass: calculatedScore >= 70 ? 'green' : calculatedScore >= 50 ? 'amber' : 'red',
      barColor: calculatedScore >= 70 ? '#10b981' : calculatedScore >= 50 ? '#f59e0b' : '#ef4444',
      progressPercent: calculatedScore,
    },
    {
      id: 'total',
      label: 'Total Analyses',
      value: totalScans,
      subtext: 'across all engines',
      icon: Layers,
      colorClass: 'blue',
      barColor: '#2563eb',
      progressPercent: 100,
    },
    {
      id: 'high-risk',
      label: 'High Risk',
      value: highRiskCount,
      subtext: 'threats intercepted',
      icon: ShieldAlert,
      colorClass: 'red',
      barColor: '#ef4444',
      progressPercent: totalScans > 0 ? Math.round((highRiskCount / totalScans) * 100) : 0,
    },
    {
      id: 'low-risk',
      label: 'Low Risk',
      value: lowRiskCount,
      subtext: 'verified safe items',
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
      {/* Top Page Header - Only Welcome vaishnavi */}
      <div className="inner-page-header">
        <h1 className="header-title">
          Welcome, <span className="text-blue">{displayName}</span>
        </h1>
      </div>

      {/* 3 Metric Stat Cards Row */}
      <div className="dashboard-stats-grid">
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
              </div>

              <div className="stat-card-progress">
                <div
                  className="stat-progress-bar"
                  style={{
                    backgroundColor: stat.barColor,
                    width: `${typeof stat.progressPercent === 'number' ? stat.progressPercent : Math.min(100, (Number(stat.value) / 12) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-card card">
        <div className="activity-card-header">
          <h2 className="activity-section-title">Recent Activity</h2>
          <button
            type="button"
            className="view-all-link-btn"
            onClick={() => onNavigate('history')}
          >
            <span>View All</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* List of Recent Activities */}
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
      </div>

      {/* Quick Launch Defense Modules Bar */}
      <div className="dashboard-quick-actions-bar">
        <button
          type="button"
          className="quick-action-card card"
          onClick={() => onNavigate('email')}
        >
          <div className="quick-action-icon blue">
            <Mail size={20} />
          </div>
          <div>
            <strong>Scan Suspicious Email</strong>
            <p>Paste text or connect Gmail</p>
          </div>
          <ArrowRight size={16} className="text-blue quick-action-arrow" />
        </button>

        <button
          type="button"
          className="quick-action-card card"
          onClick={() => onNavigate('url')}
        >
          <div className="quick-action-icon green">
            <Link2 size={20} />
          </div>
          <div>
            <strong>Check Web Link</strong>
            <p>Verify against Safe Browsing</p>
          </div>
          <ArrowRight size={16} className="text-blue quick-action-arrow" />
        </button>

        <button
          type="button"
          className="quick-action-card card"
          onClick={() => onNavigate('policy')}
        >
          <div className="quick-action-icon amber">
            <FileText size={20} />
          </div>
          <div>
            <strong>Simplify Privacy Policy</strong>
            <p>Uncover broker clauses & DPDP rights</p>
          </div>
          <ArrowRight size={16} className="text-blue quick-action-arrow" />
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
