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
  LogOut,
  User,
  ShieldAlert,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, isAdmin, isAuthenticated, logout, loginAsDemoUser, loginAsDemoAdmin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Exact 6 core navigation items from the reference design
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'email', label: 'Email Safety', icon: Mail },
    { id: 'url', label: 'URL Safety', icon: Link2 },
    { id: 'policy', label: 'Privacy Policy', icon: FileText },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: Clock },
  ];

  // Secondary capabilities preserved for complete functionality
  const extraItems = [
    { id: 'letters', label: 'Letter Studio', icon: FileCode },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldAlert }] : []),
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
  };

  const displayName =
    user?.displayName ||
    user?.name ||
    localStorage.getItem('dataraksha_person_name') ||
    'Kalyani';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="app-sidebar" id="app-sidebar" aria-label="Sidebar Navigation">
      {/* Brand Header */}
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
        <span className="sidebar-brand-title">DataRaksha AI</span>
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
              >
                <Icon size={18} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Extra Preserved Tools Section */}
        <div className="sidebar-section-divider"></div>
        <div className="sidebar-nav-group secondary-group">
          <span className="sidebar-group-heading">Tools</span>
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
              >
                <Icon size={16} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.id === 'admin' && <span className="sidebar-badge-admin">Admin</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer (Matching Reference Design: circle avatar + Kalyani More + chevron) */}
      <div className="sidebar-footer">
        <div
          className="sidebar-profile-card"
          id="sidebar-user-profile"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          role="button"
          tabIndex={0}
        >
          <div className="profile-avatar">{initial}</div>
          <div className="profile-info">
            <span className="profile-name" title={displayName}>
              {displayName}
            </span>
            <span className="profile-sub">{isAdmin ? 'Administrator' : 'Individual'}</span>
          </div>
          <button
            type="button"
            className="sidebar-quick-signout-btn"
            title="Sign Out"
            onClick={async (e) => {
              e.stopPropagation();
              await logout();
              setActiveTab('home');
            }}
          >
            <LogOut size={15} />
          </button>
          <ChevronDown size={16} className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`} />
        </div>

        {/* Profile Popover Menu */}
        {profileMenuOpen && (
          <div className="profile-popover-menu" id="profile-popover">
            <div className="popover-header">
              <strong>{displayName}</strong>
              <small>{user?.email || 'kalyani@dataraksha.ai'}</small>
            </div>
            <div className="popover-divider"></div>

            <button
              type="button"
              className="popover-item"
              onClick={() => {
                loginAsDemoUser();
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
                loginAsDemoAdmin();
                setProfileMenuOpen(false);
              }}
            >
              <ShieldAlert size={14} />
              <span>Switch to Demo Admin</span>
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                className="popover-item danger"
                onClick={async () => {
                  await logout();
                  setProfileMenuOpen(false);
                  setActiveTab('home');
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
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
