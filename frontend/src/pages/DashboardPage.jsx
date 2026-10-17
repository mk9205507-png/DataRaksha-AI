import React from 'react';
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

export const DashboardPage = ({ onNavigate, onSelectActivity }) => {
  const { user, isAuthenticated } = useAuth();
  const displayName =
    user?.displayName ||
    user?.name ||
    (isAuthenticated ? localStorage.getItem('dataraksha_person_name') : '') ||
    'vaishnavi';

  // Baseline stats matching reference design (can also blend dynamic user scans)
  const stats = [
    {
      id: 'total',
      label: 'Total Analyses',
      value: 12,
      subtext: 'across all engines',
      icon: Layers,
      colorClass: 'blue',
      barColor: '#2563eb',
    },
    {
      id: 'high-risk',
      label: 'High Risk',
      value: 2,
      subtext: 'threats intercepted',
      icon: ShieldAlert,
      colorClass: 'red',
      barColor: '#ef4444',
    },
    {
      id: 'low-risk',
      label: 'Low Risk',
      value: 6,
      subtext: 'verified safe items',
      icon: ShieldCheck,
      colorClass: 'green',
      barColor: '#10b981',
    },
  ];

  // Exact 4 activity items from Reference Screen 5
  const recentActivities = [
    {
      id: 'act-1',
      type: 'email',
      title: 'Email Analysis',
      subtitle: 'Suspicious link detected',
      risk: 'High',
      badgeClass: 'risk-badge-high',
      icon: Mail,
      iconColorClass: 'red',
      date: '16 Oct 2026, 2:30 PM',
      preview:
        'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately...',
    },
    {
      id: 'act-2',
      type: 'url',
      title: 'URL Analysis',
      subtitle: 'Safe website',
      risk: 'Low',
      badgeClass: 'risk-badge-low',
      icon: Link2,
      iconColorClass: 'green',
      date: '16 Oct 2026, 11:30 AM',
      preview: 'https://google.com',
    },
    {
      id: 'act-3',
      type: 'policy',
      title: 'Privacy Policy',
      subtitle: 'Data sharing details found',
      risk: 'Medium',
      badgeClass: 'risk-badge-medium',
      icon: FileText,
      iconColorClass: 'amber',
      date: '15 Oct 2026, 4:15 PM',
      preview:
        'We collect your exact GPS location, browser history, microphone telemetry, and share with data brokers and third-party syndicates without explicit prior consent...',
    },
    {
      id: 'act-4',
      type: 'email',
      title: 'Email Analysis',
      subtitle: 'Phishing attempt detected',
      risk: 'High',
      badgeClass: 'risk-badge-high',
      icon: Mail,
      iconColorClass: 'red',
      date: '14 Oct 2026, 1:10 PM',
      preview:
        'CONGRATULATIONS! Your mobile number won 1st prize of $1,000,000 in the International Mobile Rewards Draw. Claim immediately...',
    },
  ];

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
                    width: `${Math.min(100, (stat.value / 12) * 100)}%`,
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
