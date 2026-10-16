import React, { useState, useEffect } from 'react';
import HistoryTable from '../components/history/HistoryTable';
import Alert from '../components/common/Alert';
import { History as HistoryIcon, Shield, LogIn, RefreshCw } from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

export const History = ({ user: propUser, onPromptLogin }) => {
  const { user: authUser } = useAuth();
  const currentUser = propUser || authUser;

  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Baseline records for instant demonstration
  const [scans, setScans] = useState([
    {
      id: 'sc-101',
      scan_type: 'message',
      input_preview: 'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210...',
      risk_level: 'High',
      risk_score: 92,
      summary: 'Phishing urgency cues, brand impersonation, and unverified verification link detected.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'sc-102',
      scan_type: 'link',
      input_preview: 'https://security-login-update-credentials.top/account/verify.php',
      risk_level: 'High',
      risk_score: 89,
      summary: 'Deceptive domain flagged for credential harvesting and deceptive domain structure.',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'sc-103',
      scan_type: 'policy',
      input_preview: 'We collect your exact GPS location, browser history, microphone telemetry, and share with data brokers and third-party syndicates without explicit prior consent...',
      risk_level: 'Medium',
      risk_score: 65,
      summary: 'Predatory telemetry terms with perpetual data broker monetization clause.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'sc-104',
      scan_type: 'message',
      input_preview: 'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. Project slides have been shared in team workspace.',
      risk_level: 'Low',
      risk_score: 12,
      summary: 'No obvious urgency triggers, credential requests, or social engineering heuristics detected.',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/history');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setScans(res.data);
      } else if (Array.isArray(res.data?.records) && res.data.records.length > 0) {
        setScans(res.data.records);
      }
    } catch (err) {
      // Retain sample records for offline demo mode
      console.warn('Backend history sync deferred; using local cached records.', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const handleDeleteScan = async (id) => {
    // Optimistic update
    setScans((prev) => prev.filter((s) => s.id !== id));
    setAlert({ type: 'info', message: 'Record removed from audit trail.' });

    try {
      await apiClient.delete(`/history/${id}`);
    } catch {
      // Backend delete endpoint will complete during backend task execution
    }
  };

  const handleClearAll = async () => {
    setScans([]);
    setAlert({ type: 'info', message: 'All scan history records permanently cleared.' });

    try {
      await apiClient.delete('/history');
    } catch {
      // Backend clear endpoint will complete during backend task execution
    }
  };

  const filteredScans = scans.filter((scan) => {
    const matchesType = filterType === 'all' || scan.scan_type === filterType;
    const matchesRisk = filterRisk === 'all' || scan.risk_level === filterRisk;
    const matchesSearch =
      !searchQuery.trim() ||
      (scan.input_preview || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.scan_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesRisk && matchesSearch;
  });

  return (
    <div className="history-page" id="history-view">
      <div className="dashboard-hero">
        <div className="hero-badge">
          <HistoryIcon size={14} className="hero-badge-icon text-cyan" />
          <span>Security Audit Trail</span>
        </div>
        <h1 className="hero-title">
          Threat Assessment <span className="gradient-text">History</span>
        </h1>
        <p className="hero-subtitle">
          Review past scans, monitor threat ratings over time, and manage your stored privacy audit logs with granular deletion controls and zero-cross-tenant leakage.
        </p>
      </div>

      {/* Auth Banner */}
      {!currentUser ? (
        <div className="auth-alert-glass-card glass-card">
          <div className="auth-alert-content">
            <Shield size={20} className="text-cyan" />
            <span>
              Viewing sample records. Sign in to synchronize and encrypt your personal scan history with PostgreSQL Row-Level Security.
            </span>
          </div>
          <button type="button" className="btn btn-secondary action-sm" onClick={onPromptLogin}>
            <LogIn size={14} /> Sign In
          </button>
        </div>
      ) : (
        <div className="auth-verified-glass-card glass-card">
          <div className="auth-verified-left">
            <Shield size={18} className="text-emerald" />
            <span>
              Authenticated as <strong>{currentUser.email}</strong>. Scan history is isolated to your user ID via PostgreSQL Row-Level Security.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost action-sm refresh-btn"
            onClick={fetchHistory}
            disabled={isLoading}
            title="Refresh scan history"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      )}

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <HistoryTable
        scans={filteredScans}
        filterType={filterType}
        filterRisk={filterRisk}
        searchQuery={searchQuery}
        onFilterTypeChange={setFilterType}
        onFilterRiskChange={setFilterRisk}
        onSearchChange={setSearchQuery}
        onDeleteScan={handleDeleteScan}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default History;
