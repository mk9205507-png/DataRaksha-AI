import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Database,
  Cpu,
  Lock,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  Users,
  Code,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Eye,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard = ({ user: propUser, onPromptLogin }) => {
  const { user: authUser, isAdmin: contextIsAdmin } = useAuth();
  const currentUser = propUser || authUser;
  const isDesignatedAdmin = (currentUser?.email || '').toLowerCase().trim() === 'mk9205507@gmail.com';
  const isAdmin = contextIsAdmin || currentUser?.role === 'admin' || isDesignatedAdmin;

  // Sub-navigation view: 'overview' | 'users' | 'scans' | 'activity'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(null);
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ==========================================
  // 1. OVERVIEW TELEMETRY STATE
  // ==========================================
  const [metrics, setMetrics] = useState({
    total_scans: 0,
    scans_today: 0,
    registered_users: 0,
    risk_breakdown: { low: 0, medium: 0, high: 0 },
    scans_by_type: { message: 0, link: 0, policy: 0 },
    system_status: {
      gemini_api: 'Operational (Active)',
      safe_browsing_api: 'Connected (v4 Threat Feeds)',
      supabase_db: 'Connected (RLS Enforced)',
    },
    recent_activity: [],
  });
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date().toLocaleTimeString());

  const fetchMetrics = useCallback(async () => {
    if (!isAdmin) return;
    setIsMetricsLoading(true);
    setMetricsError('');
    try {
      const res = await apiClient.get('/admin/overview');
      if (res?.data) {
        setMetrics({
          total_scans: res.data.total_scans ?? 0,
          scans_today: res.data.scans_today ?? 0,
          registered_users: res.data.registered_users ?? 0,
          risk_breakdown: {
            low: res.data.risk_breakdown?.low ?? 0,
            medium: res.data.risk_breakdown?.medium ?? 0,
            high: res.data.risk_breakdown?.high ?? 0,
          },
          scans_by_type: {
            message: res.data.scans_by_type?.message ?? 0,
            link: res.data.scans_by_type?.link ?? 0,
            policy: res.data.scans_by_type?.policy ?? 0,
          },
          system_status: {
            gemini_api: res.data.system_status?.gemini_api || 'Operational',
            safe_browsing_api: res.data.system_status?.safe_browsing_api || 'Operational',
            supabase_db: res.data.system_status?.supabase_db || 'Connected',
          },
          recent_activity: res.data.recent_activity || [],
        });
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Could not fetch real admin overview:', err);
      setMetricsError(err.response?.data?.detail || 'Failed to retrieve telemetry.');
    } finally {
      setIsMetricsLoading(false);
    }
  }, [isAdmin]);

  // ==========================================
  // 2. USER MANAGEMENT STATE
  // ==========================================
  const [usersData, setUsersData] = useState({ total: 0, page: 1, limit: 10, users: [] });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  // User details modal state
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  // User role change confirmation modal state
  const [roleChangeTarget, setRoleChangeTarget] = useState(null); // { user, newRole }
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState({ type: '', text: '' });

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsUsersLoading(true);
    setUsersError('');
    try {
      const params = {
        page: userPage,
        limit: 10,
      };
      if (userSearch.trim()) params.search = userSearch.trim();
      if (userRoleFilter !== 'all') params.role = userRoleFilter;

      const res = await apiClient.get('/admin/users', { params });
      if (res?.data) {
        setUsersData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch admin users:', err);
      setUsersError(err.response?.data?.detail || 'Failed to load user records.');
    } finally {
      setIsUsersLoading(false);
    }
  }, [isAdmin, userPage, userSearch, userRoleFilter]);

  const handleOpenUserDetails = async (userId) => {
    setIsLoadingUserDetails(true);
    setSelectedUserDetails({ id: userId, email: 'Loading account...', role: '...', created_at: '', total_scans: 0, recent_scans: [] });
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      if (res?.data) {
        setSelectedUserDetails(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to load user details.');
      setSelectedUserDetails(null);
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  const handleExecuteRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user, newRole } = roleChangeTarget;
    setIsUpdatingRole(true);
    setRoleUpdateMsg({ type: '', text: '' });
    try {
      const res = await apiClient.post(`/admin/users/${user.id}/role`, { role: newRole });
      setRoleUpdateMsg({ type: 'success', text: res.data?.message || `Role updated to ${newRole}.` });
      fetchUsers();
      fetchMetrics();
      setTimeout(() => {
        setRoleChangeTarget(null);
        setRoleUpdateMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setRoleUpdateMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update user role.',
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ==========================================
  // 3. SCAN RECORDS STATE
  // ==========================================
  const [scansData, setScansData] = useState({ total: 0, page: 1, limit: 10, scans: [] });
  const [scanSearch, setScanSearch] = useState('');
  const [scanTypeFilter, setScanTypeFilter] = useState('all');
  const [scanRiskFilter, setScanRiskFilter] = useState('all');
  const [scanPage, setScanPage] = useState(1);
  const [isScansLoading, setIsScansLoading] = useState(false);
  const [scansError, setScansError] = useState('');

  // Scan analysis details modal
  const [selectedScanDetails, setSelectedScanDetails] = useState(null);

  const fetchScans = useCallback(async () => {
    if (!isAdmin) return;
    setIsScansLoading(true);
    setScansError('');
    try {
      const params = {
        page: scanPage,
        limit: 10,
      };
      if (scanSearch.trim()) params.search = scanSearch.trim();
      if (scanTypeFilter !== 'all') params.scan_type = scanTypeFilter;
      if (scanRiskFilter !== 'all') params.risk_level = scanRiskFilter;

      const res = await apiClient.get('/admin/scans', { params });
      if (res?.data) {
        setScansData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch admin scans:', err);
      setScansError(err.response?.data?.detail || 'Failed to load platform scans.');
    } finally {
      setIsScansLoading(false);
    }
  }, [isAdmin, scanPage, scanSearch, scanTypeFilter, scanRiskFilter]);

  // ==========================================
  // 4. ACTIVITY & AUDIT LOGS STATE
  // ==========================================
  const [activityData, setActivityData] = useState({ total: 0, page: 1, limit: 15, logs: [] });
  const [activityPage, setActivityPage] = useState(1);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const fetchActivity = useCallback(async () => {
    if (!isAdmin) return;
    setIsActivityLoading(true);
    setActivityError('');
    try {
      const res = await apiClient.get('/admin/activity', {
        params: { page: activityPage, limit: 15 },
      });
      if (res?.data) {
        setActivityData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch admin activity:', err);
      setActivityError(err.response?.data?.detail || 'Failed to load audit logs.');
    } finally {
      setIsActivityLoading(false);
    }
  }, [isAdmin, activityPage]);

  // Auto-fetch data based on active tab
  useEffect(() => {
    if (!isAdmin) return;
    if (activeSubTab === 'overview') fetchMetrics();
    else if (activeSubTab === 'users') fetchUsers();
    else if (activeSubTab === 'scans') fetchScans();
    else if (activeSubTab === 'activity') fetchActivity();
  }, [isAdmin, activeSubTab, fetchMetrics, fetchUsers, fetchScans, fetchActivity]);

  // Restrict Admin Dashboard from unauthorized visitors and regular users
  if (!currentUser || !isAdmin) {
    return (
      <div className="admin-page" id="admin-view">
        <div className="dashboard-hero">
          <div className="hero-badge">
            <Lock size={14} className="hero-badge-icon text-amber" />
            <span>Restricted Oversight Portal</span>
          </div>
          <h1 className="hero-title">
            Administrator <span className="gradient-text">Portal</span>
          </h1>
          <p className="hero-subtitle">
            System threat metrics, global scan aggregations, and administrative controls are reserved strictly for authorized administrator accounts.
          </p>
        </div>

        <div className="protected-route-card card">
          <div className="protected-icon-badge error-badge mb-3">
            <ShieldAlert size={36} className="text-red" />
          </div>
          <h2 className="protected-title text-xl font-bold mb-2">403 Forbidden: Administrator Access Required</h2>
          <p className="protected-subtitle text-muted mb-4 max-w-lg mx-auto">
            {currentUser
              ? `You are currently authenticated as '${currentUser.email}' with individual user permissions. System telemetry and administrative controls require an administrator account.`
              : 'You must be signed in with an administrator account to access platform oversight.'}
          </p>

          <div className="admin-setup-instructions text-left p-4 card mb-4 max-w-lg mx-auto bg-slate-50">
            <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
              <Code size={16} className="text-blue" />
              <span>Assigning Administrator in Supabase:</span>
            </div>
            <p className="text-xs text-muted mb-2">
              Execute this command in your Supabase SQL Editor to grant admin privileges to your verified account:
            </p>
            <pre className="sql-snippet-box p-2 rounded text-xs bg-dark text-white font-mono overflow-x-auto">
              UPDATE public.profiles SET role = 'admin' WHERE email = '{currentUser?.email || 'admin@dataraksha.ai'}';
            </pre>
          </div>

          <div className="protected-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onPromptLogin}
            >
              <Lock size={15} /> Sign In with Admin Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculations for overview
  const totalScans = metrics.total_scans || 0;
  const highRiskPercent = totalScans > 0 ? ((metrics.risk_breakdown.high / totalScans) * 100).toFixed(1) : '0.0';
  const medRiskPercent = totalScans > 0 ? ((metrics.risk_breakdown.medium / totalScans) * 100).toFixed(1) : '0.0';
  const lowRiskPercent = totalScans > 0 ? ((metrics.risk_breakdown.low / totalScans) * 100).toFixed(1) : '0.0';

  const msgPercent = totalScans > 0 ? ((metrics.scans_by_type.message / totalScans) * 100).toFixed(1) : '0.0';
  const linkPercent = totalScans > 0 ? ((metrics.scans_by_type.link / totalScans) * 100).toFixed(1) : '0.0';
  const policyPercent = totalScans > 0 ? ((metrics.scans_by_type.policy / totalScans) * 100).toFixed(1) : '0.0';

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    const r = (riskLevel || '').toLowerCase();
    if (r === 'high') return 'risk-badge-high';
    if (r === 'medium') return 'risk-badge-medium';
    return 'risk-badge-low';
  };

  return (
    <div className="admin-page" id="admin-view">
      {/* Top Header */}
      <div className="dashboard-hero">
        <div className="hero-badge">
          <BarChart3 size={14} className="hero-badge-icon text-cyan" />
          <span>Secure Administrator Portal</span>
        </div>
        <div className="hero-header-flex">
          <div>
            <h1 className="hero-title">
              DataRaksha AI <span className="gradient-text">Admin Control</span>
            </h1>
            <p className="hero-subtitle">
              Verified administrator oversight: user permissions, live threat telemetry, and scan audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary action-sm refresh-telemetry-btn"
              onClick={() => {
                if (activeSubTab === 'overview') fetchMetrics();
                else if (activeSubTab === 'users') fetchUsers();
                else if (activeSubTab === 'scans') fetchScans();
                else if (activeSubTab === 'activity') fetchActivity();
              }}
              disabled={isMetricsLoading || isUsersLoading || isScansLoading || isActivityLoading}
              title="Refresh current data"
            >
              <RefreshCw
                size={14}
                className={isMetricsLoading || isUsersLoading || isScansLoading || isActivityLoading ? 'spin-icon' : ''}
              />
              <span>{isMetricsLoading || isUsersLoading || isScansLoading || isActivityLoading ? 'Refreshing...' : `Refresh (${lastRefreshed})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sub-Navigation Strip */}
      <div className="admin-subnav-strip">
        <button
          type="button"
          className={`admin-subnav-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <BarChart3 size={16} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`admin-subnav-btn ${activeSubTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('users')}
        >
          <Users size={16} />
          <span>User Management</span>
          {usersData.total > 0 && <span className="admin-subnav-badge">{usersData.total}</span>}
        </button>

        <button
          type="button"
          className={`admin-subnav-btn ${activeSubTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('scans')}
        >
          <ShieldAlert size={16} />
          <span>Scan Records</span>
          {scansData.total > 0 && <span className="admin-subnav-badge">{scansData.total}</span>}
        </button>

        <button
          type="button"
          className={`admin-subnav-btn ${activeSubTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('activity')}
        >
          <History size={16} />
          <span>Audit & Activity Logs</span>
        </button>
      </div>

      {/* ======================================================================
          SUB-TAB 1: OVERVIEW & SYSTEM TELEMETRY
          ====================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="admin-overview-section">
          {metricsError && (
            <div className="alert alert-warning mb-4">
              <AlertTriangle size={16} />
              <span>{metricsError}</span>
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="admin-metrics-grid">
            <div className="metric-card card">
              <div className="metric-icon-box cyan">
                <Activity size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Completed Analyses</span>
                <span className="metric-value">{totalScans.toLocaleString()}</span>
                <span className="metric-subtext">Total records in database</span>
              </div>
            </div>

            <div className="metric-card card">
              <div className="metric-icon-box indigo">
                <Users size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Registered Accounts</span>
                <span className="metric-value">{metrics.registered_users}</span>
                <span className="metric-subtext">From Supabase profiles</span>
              </div>
            </div>

            <div className="metric-card card">
              <div className="metric-icon-box ruby">
                <AlertTriangle size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">High-Risk Interceptions</span>
                <span className="metric-value">{metrics.risk_breakdown.high}</span>
                <span className="metric-subtext">{highRiskPercent}% of completed evaluations</span>
              </div>
            </div>

            <div className="metric-card card">
              <div className="metric-icon-box emerald">
                <ShieldCheck size={22} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Scans Processed Today</span>
                <span className="metric-value">{metrics.scans_today}</span>
                <span className="metric-subtext">Since 00:00 UTC</span>
              </div>
            </div>
          </div>

          {/* Distribution Grid */}
          <div className="admin-two-col-grid">
            {/* Risk Breakdown */}
            <div className="admin-card card">
              <div className="card-header-row">
                <h3 className="card-section-title">Risk Severity Breakdown</h3>
                <span className="card-section-tag">Database Counts</span>
              </div>
              <div className="distribution-bars-list">
                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="risk-badge risk-badge-low">🟢 Low Risk</span>
                    <span className="dist-count">{metrics.risk_breakdown.low} scans ({lowRiskPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill risk-fill-low" style={{ width: `${lowRiskPercent}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="risk-badge risk-badge-medium">🟡 Medium Risk</span>
                    <span className="dist-count">{metrics.risk_breakdown.medium} scans ({medRiskPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill risk-fill-medium" style={{ width: `${medRiskPercent}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="risk-badge risk-badge-high">🔴 High Risk</span>
                    <span className="dist-count">{metrics.risk_breakdown.high} scans ({highRiskPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill risk-fill-high" style={{ width: `${highRiskPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modality Breakdown */}
            <div className="admin-card card">
              <div className="card-header-row">
                <h3 className="card-section-title">Scan Modality Breakdown</h3>
                <span className="card-section-tag">Platform Usage</span>
              </div>
              <div className="distribution-bars-list">
                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="modality-label">💬 Messages & Emails</span>
                    <span className="dist-count">{metrics.scans_by_type.message} scans ({msgPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill modality-fill-msg" style={{ width: `${msgPercent}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="modality-label">🔗 Links & Web URLs</span>
                    <span className="dist-count">{metrics.scans_by_type.link} scans ({linkPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill modality-fill-link" style={{ width: `${linkPercent}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="dist-label-row">
                    <span className="modality-label">📜 Privacy Policies</span>
                    <span className="dist-count">{metrics.scans_by_type.policy} scans ({policyPercent}%)</span>
                  </div>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill modality-fill-policy" style={{ width: `${policyPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="admin-card card engine-health-full-card mb-4">
            <div className="card-header-row">
              <h3 className="card-section-title">Cloud Infrastructure & Threat Engine Status</h3>
              <span className="health-pill operational">
                <CheckCircle2 size={12} /> Server-Side Verified
              </span>
            </div>
            <div className="health-status-grid">
              <div className="health-item card">
                <div className="health-left">
                  <Cpu size={22} className="text-cyan" />
                  <div>
                    <strong className="engine-name">Google Gemini AI Engine</strong>
                    <p className="engine-details">{metrics.system_status.gemini_api}</p>
                  </div>
                </div>
                <span className="health-badge healthy">Active</span>
              </div>

              <div className="health-item card">
                <div className="health-left">
                  <ShieldCheck size={22} className="text-indigo" />
                  <div>
                    <strong className="engine-name">Google Safe Browsing v4</strong>
                    <p className="engine-details">{metrics.system_status.safe_browsing_api}</p>
                  </div>
                </div>
                <span className="health-badge healthy">Connected</span>
              </div>

              <div className="health-item card">
                <div className="health-left">
                  <Database size={22} className="text-emerald" />
                  <div>
                    <strong className="engine-name">Supabase PostgreSQL & Auth</strong>
                    <p className="engine-details">{metrics.system_status.supabase_db}</p>
                  </div>
                </div>
                <span className="health-badge healthy">RLS Enforced</span>
              </div>
            </div>
          </div>

          {/* Recent Platform Activity Preview */}
          {metrics.recent_activity?.length > 0 && (
            <div className="admin-card card">
              <div className="card-header-row">
                <h3 className="card-section-title">Recent Platform Scans</h3>
                <button
                  type="button"
                  className="btn btn-ghost text-xs font-semibold"
                  onClick={() => setActiveSubTab('scans')}
                >
                  View All Scans &rarr;
                </button>
              </div>
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Scan ID</th>
                      <th>Type</th>
                      <th>Risk Level</th>
                      <th>Preview</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_activity.map((act) => (
                      <tr key={act.id}>
                        <td>
                          <span
                            className="admin-code-badge"
                            onClick={() => handleCopy(act.id, act.id)}
                            title="Click to copy"
                          >
                            {act.id.slice(0, 8)}...
                            {copiedId === act.id ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                          </span>
                        </td>
                        <td>
                          <span className={`scan-type-badge ${act.scan_type || 'message'}`}>
                            {act.scan_type || 'scan'}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge ${getRiskBadgeClass(act.risk_level)}`}>
                            {act.risk_level || 'Low'} {act.risk_score ? `(${act.risk_score})` : ''}
                          </span>
                        </td>
                        <td className="table-preview-cell">{act.preview || '—'}</td>
                        <td className="user-date-text">{formatDate(act.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 2: USER MANAGEMENT
          ====================================================================== */}
      {activeSubTab === 'users' && (
        <div className="admin-users-section">
          {/* Filter & Search Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <div className="admin-search-wrapper">
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by email or user ID..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                />
              </div>

              <select
                className="admin-select-filter"
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUserPage(1);
                }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="individual">Individual Users</option>
              </select>
            </div>

            <div className="admin-results-count">
              Showing {usersData.users.length} of {usersData.total} registered users
            </div>
          </div>

          {usersError && (
            <div className="alert alert-warning mb-4">
              <AlertTriangle size={16} />
              <span>{usersError}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="admin-table-wrapper">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Account</th>
                    <th>User ID</th>
                    <th>Role</th>
                    <th>Last Signed In</th>
                    <th>Total Scans</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-muted">
                          <RefreshCw size={18} className="spin-icon" />
                          <span>Loading registered user accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-muted">
                        No registered users found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((u) => {
                      const isSelf = currentUser?.id === u.id || currentUser?.email?.toLowerCase() === u.email?.toLowerCase();
                      const initial = (u.display_name || u.email || 'U')[0].toUpperCase();
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="user-info-cell">
                              <div className="user-avatar-circle">{initial}</div>
                              <div>
                                <div className="user-name-text font-semibold text-sm">
                                  {u.display_name || u.email.split('@')[0]}
                                </div>
                                <div className="user-email-text text-xs text-muted">{u.email}</div>
                                {isSelf && <span className="text-xs text-blue font-semibold">(Current Admin)</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className="admin-code-badge"
                              onClick={() => handleCopy(u.id, u.id)}
                              title="Click to copy full ID"
                            >
                              {u.id.slice(0, 8)}...
                              {copiedId === u.id ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-role-badge ${u.role}`}>
                              {u.role === 'admin' ? '🛡️ Admin' : 'User'}
                            </span>
                          </td>
                          <td className="user-date-text">
                            <div className="font-medium text-xs">
                              {formatDate(u.last_sign_in_at || u.created_at)}
                            </div>
                            <span className="text-slate-400 text-xs">
                              Joined {formatDate(u.created_at)}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-subtle font-semibold">
                              {u.scan_count || 0} scans
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-success text-xs font-semibold">
                              ● Active
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-secondary action-sm py-1 px-2 text-xs"
                                onClick={() => handleOpenUserDetails(u.id)}
                                title="View Account Details & Activity"
                              >
                                <Eye size={13} /> Details
                              </button>

                              <button
                                type="button"
                                className="btn btn-ghost action-sm py-1 px-2 text-xs text-blue"
                                onClick={() => {
                                  const targetRole = u.role === 'admin' ? 'individual' : 'admin';
                                  setRoleChangeTarget({ user: u, newRole: targetRole });
                                }}
                                title="Change Account Role"
                              >
                                {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>


            {/* Pagination */}
            <div className="admin-pagination">
              <span>
                Page {usersData.page} of {Math.max(1, Math.ceil(usersData.total / usersData.limit))}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={userPage <= 1 || isUsersLoading}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={userPage >= Math.ceil(usersData.total / usersData.limit) || isUsersLoading}
                  onClick={() => setUserPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 3: SCAN RECORDS & MANAGEMENT
          ====================================================================== */}
      {activeSubTab === 'scans' && (
        <div className="admin-scans-section">
          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <div className="admin-search-wrapper">
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search scans by preview, summary, user..."
                  value={scanSearch}
                  onChange={(e) => {
                    setScanSearch(e.target.value);
                    setScanPage(1);
                  }}
                />
              </div>

              <select
                className="admin-select-filter"
                value={scanTypeFilter}
                onChange={(e) => {
                  setScanTypeFilter(e.target.value);
                  setScanPage(1);
                }}
              >
                <option value="all">All Modalities</option>
                <option value="message">Messages & Emails</option>
                <option value="link">Links & Web URLs</option>
                <option value="policy">Privacy Policies</option>
              </select>

              <select
                className="admin-select-filter"
                value={scanRiskFilter}
                onChange={(e) => {
                  setScanRiskFilter(e.target.value);
                  setScanPage(1);
                }}
              >
                <option value="all">All Risk Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div className="admin-results-count">
              Showing {scansData.scans.length} of {scansData.total} platform scans
            </div>
          </div>

          {scansError && (
            <div className="alert alert-warning mb-4">
              <AlertTriangle size={16} />
              <span>{scansError}</span>
            </div>
          )}

          {/* Scans Table */}
          <div className="admin-table-wrapper">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Scan ID</th>
                    <th>User Account</th>
                    <th>Modality</th>
                    <th>Risk Classification</th>
                    <th>Content Preview</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isScansLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-muted">
                          <RefreshCw size={18} className="spin-icon" />
                          <span>Loading platform scan records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : scansData.scans.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-muted">
                        No scan records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    scansData.scans.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span
                            className="admin-code-badge"
                            onClick={() => handleCopy(s.id, s.id)}
                            title="Click to copy full ID"
                          >
                            {s.id.slice(0, 8)}...
                            {copiedId === s.id ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                          </span>
                        </td>
                        <td>
                          <div className="user-email-text text-xs">{s.user_email || `ID: ${s.user_id?.slice(0, 8)}`}</div>
                        </td>
                        <td>
                          <span className={`scan-type-badge ${s.scan_type || 'message'}`}>
                            {s.scan_type || 'message'}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge ${getRiskBadgeClass(s.risk_level)}`}>
                            {s.risk_level || 'Low'} {s.risk_score ? `(${s.risk_score}/100)` : ''}
                          </span>
                        </td>
                        <td className="table-preview-cell" title={s.input_preview}>
                          {s.input_preview || 'No text snippet recorded'}
                        </td>
                        <td className="user-date-text">{formatDate(s.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary action-sm py-1 px-2 text-xs"
                            onClick={() => setSelectedScanDetails(s)}
                          >
                            <Eye size={13} /> View Analysis
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span>
                Page {scansData.page} of {Math.max(1, Math.ceil(scansData.total / scansData.limit))}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={scanPage <= 1 || isScansLoading}
                  onClick={() => setScanPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={scanPage >= Math.ceil(scansData.total / scansData.limit) || isScansLoading}
                  onClick={() => setScanPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-TAB 4: ACTIVITY & AUDIT LOGS
          ====================================================================== */}
      {activeSubTab === 'activity' && (
        <div className="admin-activity-section">
          <div className="card mb-4 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">Administrative Audit Trail</h3>
              <p className="text-xs text-muted">
                Immutable records of administrative privileges, role alterations, and high-privilege operations.
              </p>
            </div>
            <div className="admin-results-count">
              Total Log Entries: {activityData.total}
            </div>
          </div>

          {activityError && (
            <div className="alert alert-warning mb-4">
              <AlertTriangle size={16} />
              <span>{activityError}</span>
            </div>
          )}

          <div className="admin-table-wrapper">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Target ID</th>
                    <th>Operation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isActivityLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-muted">
                          <RefreshCw size={18} className="spin-icon" />
                          <span>Loading audit records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : activityData.logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted">
                        No administrative audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    activityData.logs.map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td className="user-date-text">{formatDate(log.created_at)}</td>
                        <td>
                          <span className="font-semibold text-xs text-blue">
                            {log.admin_email || log.admin_id?.slice(0, 8)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-subtle text-xs font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="text-xs text-muted">{log.target_entity}</td>
                        <td>
                          <span className="admin-code-badge text-xs">
                            {String(log.target_id || '').slice(0, 10)}...
                          </span>
                        </td>
                        <td className="text-xs">
                          {log.details ? (
                            <code className="text-xs bg-slate-100 p-1 rounded font-mono">
                              {JSON.stringify(log.details)}
                            </code>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span>
                Page {activityData.page} of {Math.max(1, Math.ceil(activityData.total / activityData.limit))}
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={activityPage <= 1 || isActivityLoading}
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={activityPage >= Math.ceil(activityData.total / activityData.limit) || isActivityLoading}
                  onClick={() => setActivityPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 1: USER ACCOUNT DETAILS & ACTIVITY
          ====================================================================== */}
      {selectedUserDetails && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUserDetails(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <Users size={18} className="text-blue" />
                <span>User Account Inspection</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedUserDetails(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {isLoadingUserDetails ? (
                <div className="flex items-center justify-center p-8 text-muted">
                  <RefreshCw size={20} className="spin-icon mr-2" />
                  <span>Loading user details...</span>
                </div>
              ) : (
                <>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Display Name</span>
                    <span className="modal-detail-value font-semibold">
                      {selectedUserDetails.display_name || selectedUserDetails.email?.split('@')[0]}
                    </span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Email Address</span>
                    <span className="modal-detail-value">{selectedUserDetails.email}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">User ID (UUID)</span>
                    <span className="modal-detail-value font-mono text-xs">{selectedUserDetails.id}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Assigned Role</span>
                    <span className="modal-detail-value">
                      <span className={`admin-role-badge ${selectedUserDetails.role}`}>
                        {selectedUserDetails.role === 'admin' ? '🛡️ Administrator' : 'Individual'}
                      </span>
                    </span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Last Signed In</span>
                    <span className="modal-detail-value font-medium text-blue">
                      {formatDate(selectedUserDetails.last_sign_in_at || selectedUserDetails.created_at)}
                    </span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Account Created</span>
                    <span className="modal-detail-value">{formatDate(selectedUserDetails.created_at)}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="modal-detail-label">Total Completed Scans</span>
                    <span className="modal-detail-value">{selectedUserDetails.total_scans} scans</span>
                  </div>


                  <h4 className="font-bold text-sm mt-4 mb-2">Recent User Scan Activity:</h4>
                  {selectedUserDetails.recent_scans?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUserDetails.recent_scans.map((sc) => (
                        <div key={sc.id} className="p-3 bg-slate-50 border rounded-lg text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`scan-type-badge ${sc.scan_type || 'message'}`}>
                              {sc.scan_type}
                            </span>
                            <span className={`risk-badge ${getRiskBadgeClass(sc.risk_level)}`}>
                              {sc.risk_level} ({sc.risk_score || 0}/100)
                            </span>
                          </div>
                          <p className="text-muted line-clamp-1">{sc.input_preview || 'No preview'}</p>
                          <span className="text-slate-400 text-xs mt-1 block">{formatDate(sc.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">This user has not executed any scans yet.</p>
                  )}
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary action-sm"
                onClick={() => setSelectedUserDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 2: ROLE CHANGE CONFIRMATION (With Self-Demotion Lockout Guard)
          ====================================================================== */}
      {roleChangeTarget && (
        <div className="admin-modal-backdrop" onClick={() => !isUpdatingRole && setRoleChangeTarget(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <AlertTriangle size={18} className="text-amber" />
                <span>Confirm Role Modification</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                disabled={isUpdatingRole}
                onClick={() => setRoleChangeTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {roleUpdateMsg.text && (
                <div
                  className={`alert ${
                    roleUpdateMsg.type === 'error' ? 'alert-warning' : 'alert-success'
                  } mb-3`}
                >
                  {roleUpdateMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{roleUpdateMsg.text}</span>
                </div>
              )}

              <p className="mb-4">
                You are about to modify the administrative permissions for:
              </p>

              <div className="p-3 bg-slate-50 border rounded-lg mb-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted">Account:</span>
                  <span className="font-bold">{roleChangeTarget.user.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Current Role:</span>
                  <span className="font-semibold">{roleChangeTarget.user.role}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">New Role:</span>
                  <span className="font-bold text-blue">{roleChangeTarget.newRole}</span>
                </div>
              </div>

              {/* Self-Demotion Lockout Guard Warning */}
              {(currentUser?.id === roleChangeTarget.user.id || currentUser?.email === roleChangeTarget.user.email) &&
                roleChangeTarget.newRole !== 'admin' && (
                  <div className="alert alert-warning mb-3">
                    <ShieldAlert size={16} />
                    <span>
                      <strong>Lockout Guard:</strong> You cannot demote your own account. Removing your administrator
                      privileges would lock you out of the Admin Portal.
                    </span>
                  </div>
                )}

              <p className="text-xs text-muted">
                This modification will take effect immediately and will be recorded in the administrative audit logs.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary action-sm"
                disabled={isUpdatingRole}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary action-sm"
                disabled={
                  isUpdatingRole ||
                  ((currentUser?.id === roleChangeTarget.user.id || currentUser?.email === roleChangeTarget.user.email) &&
                    roleChangeTarget.newRole !== 'admin')
                }
                onClick={handleExecuteRoleChange}
              >
                {isUpdatingRole ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Change</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL 3: SCAN RECORD DETAILS & THREAT ANALYSIS
          ====================================================================== */}
      {selectedScanDetails && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedScanDetails(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <ShieldAlert size={18} className="text-blue" />
                <span>Scan Security Analysis</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedScanDetails(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="modal-detail-row">
                <span className="modal-detail-label">Scan ID</span>
                <span className="modal-detail-value font-mono text-xs">{selectedScanDetails.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">User Account</span>
                <span className="modal-detail-value">{selectedScanDetails.user_email || selectedScanDetails.user_id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Modality</span>
                <span className="modal-detail-value">
                  <span className={`scan-type-badge ${selectedScanDetails.scan_type || 'message'}`}>
                    {selectedScanDetails.scan_type}
                  </span>
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Risk Evaluation</span>
                <span className="modal-detail-value">
                  <span className={`risk-badge ${getRiskBadgeClass(selectedScanDetails.risk_level)}`}>
                    {selectedScanDetails.risk_level} ({selectedScanDetails.risk_score || 0}/100)
                  </span>
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Analysis Timestamp</span>
                <span className="modal-detail-value">{formatDate(selectedScanDetails.created_at)}</span>
              </div>

              <div className="mt-4">
                <h4 className="font-bold text-xs uppercase text-muted mb-1">Content Preview</h4>
                <div className="p-3 bg-slate-50 border rounded text-xs font-mono max-h-24 overflow-y-auto">
                  {selectedScanDetails.input_preview || 'No input content captured'}
                </div>
              </div>

              {selectedScanDetails.summary && (
                <div className="mt-3">
                  <h4 className="font-bold text-xs uppercase text-muted mb-1">AI Risk Summary</h4>
                  <p className="text-xs text-slate-700 bg-blue-50 p-3 rounded border border-blue-100">
                    {selectedScanDetails.summary}
                  </p>
                </div>
              )}

              {selectedScanDetails.detected_threats?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-bold text-xs uppercase text-muted mb-1">Detected Threat Indicators</h4>
                  <ul className="text-xs space-y-1 list-disc pl-5 text-red-600">
                    {selectedScanDetails.detected_threats.map((threat, idx) => (
                      <li key={idx}>{typeof threat === 'string' ? threat : threat?.name || JSON.stringify(threat)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScanDetails.recommendations?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-bold text-xs uppercase text-muted mb-1">Recommended Actions</h4>
                  <ul className="text-xs space-y-1 list-disc pl-5 text-emerald-700">
                    {selectedScanDetails.recommendations.map((rec, idx) => (
                      <li key={idx}>{typeof rec === 'string' ? rec : rec?.title || JSON.stringify(rec)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-secondary action-sm"
                onClick={() => setSelectedScanDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
