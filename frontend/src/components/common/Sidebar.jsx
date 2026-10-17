import React, { useState } from 'react';
import {
  Home,
  Mail,
  Link2,
  FileText,
  LayoutDashboard,
  Clock,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ShieldAlert,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  isCollapsed = false,
  setIsCollapsed,
  onCloseMobile,
}) => {
  const { user, isAdmin, isAuthenticated, logout, loginAsDemoUser, loginAsDemoAdmin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Core navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, tooltip: 'Overview & Features' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Threat Metrics & Overview' },
    { id: 'email', label: 'Email Safety', icon: Mail, tooltip: 'Phishing & Email Threat Scanner' },
    { id: 'url', label: 'URL Safety', icon: Link2, tooltip: 'Malicious Link & Domain Scanner' },
    { id: 'policy', label: 'Privacy Policy', icon: FileText, tooltip: 'Terms of Service Simplifier' },
    { id: 'history', label: 'Scan History', icon: Clock, tooltip: 'Past Threat Audit Log' },
  ];

  // Secondary tools
  const extraItems = [
    { id: 'letters', label: 'Statutory Letters', icon: FileCode, tooltip: 'DPDP & GDPR Deletion Notices' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldAlert, tooltip: 'Restricted Oversight' }] : []),
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = async (e) => {
    if (e) e.stopPropagation();
    try {
      await logout();
    } finally {
      setProfileMenuOpen(false);
      if (onCloseMobile) onCloseMobile();
      setActiveTab('home');
    }
  };

  const displayName =
    user?.displayName ||
    user?.full_name ||
    user?.name ||
    localStorage.getItem('dataraksha_person_name') ||
    'Kalyani';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      id="app-sidebar"
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="sidebar-brand-wrapper">
        <div
          className="sidebar-brand"
          onClick={() => handleNavClick('home')}
          role="button"
          tabIndex={0}
          title="DataRaksha AI Home"
        >
          <div className="sidebar-brand-icon">
            <Shield size={22} className="shield-icon" />
          </div>
          {!isCollapsed && <span className="sidebar-brand-title">DataRaksha AI</span>}
        </div>

        {/* Desktop Collapse Toggle Button */}
        {setIsCollapsed && (
          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? `${item.label} — ${item.tooltip}` : item.tooltip}
              >
                <Icon size={18} className="sidebar-nav-icon" />
                {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Extra Preserved Tools Section */}
        <div className="sidebar-section-divider" />
        <div className="sidebar-nav-group secondary-group">
          {!isCollapsed && <span className="sidebar-group-heading">Data Rights & Tools</span>}
          {extraItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                type="button"
                className={`sidebar-nav-item sub-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? `${item.label} — ${item.tooltip}` : item.tooltip}
              >
                <Icon size={16} className="sidebar-nav-icon" />
                {!isCollapsed && (
                  <>
                    <span className="sidebar-nav-label">{item.label}</span>
                    {item.id === 'admin' && <span className="sidebar-badge-admin">Admin</span>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div
          className="sidebar-profile-card"
          id="sidebar-user-profile"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          role="button"
          tabIndex={0}
          title={isCollapsed ? `${displayName} (${isAdmin ? 'Admin' : 'User'})` : 'Account details & switch demo'}
        >
          <div className="profile-avatar">{initial}</div>
          {!isCollapsed && (
            <>
              <div className="profile-info">
                <span className="profile-name" title={displayName}>
                  {displayName}
                </span>
                <span className="profile-sub">{isAdmin ? 'Administrator' : 'Individual'}</span>
              </div>
              <ChevronDown size={16} className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`} />
            </>
          )}
        </div>

        {/* Profile Popover Menu */}
        {profileMenuOpen && (
          <div className="profile-popover-menu" id="profile-popover">
            <div className="popover-header">
              <strong>{displayName}</strong>
              <small>{user?.email || 'kalyani@dataraksha.ai'}</small>
            </div>
            <div className="popover-divider" />

            <button
              type="button"
              className="popover-item"
              onClick={() => {
                if (loginAsDemoUser) loginAsDemoUser();
                setProfileMenuOpen(false);
              }}
            >
              <User size={14} />
              <span>Switch to Demo User</span>
            </button>

            <button
              type="button"
              className="popover-item"
              onClick={() => {
                if (loginAsDemoAdmin) loginAsDemoAdmin();
                setProfileMenuOpen(false);
              }}
            >
              <ShieldAlert size={14} />
              <span>Switch to Demo Admin</span>
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                id="sidebar-signout-btn"
                className="popover-item danger"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                id="sidebar-signin-btn"
                className="popover-item primary"
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onOpenAuth) onOpenAuth();
                }}
              >
                <User size={14} />
                <span>Sign In / Sign Up</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
