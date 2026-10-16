import React, { useState } from 'react';
import { Shield, FileText, History, BarChart3, User, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core navigation tabs - Admin Portal is conditionally exposed strictly to admin role
  const baseNavItems = [
    { id: 'scanner', label: 'Threat Scanner', icon: Shield },
    { id: 'letters', label: 'Data Request Letters', icon: FileText },
    { id: 'history', label: 'Scan History', icon: History },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, { id: 'admin', label: 'Admin Portal', icon: BarChart3 }]
    : baseNavItems;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('scanner');
    setMobileMenuOpen(false);
  };

  const handleOpenAuthClick = () => {
    if (onOpenAuth) onOpenAuth();
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header" id="main-navigation">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div
          className="nav-brand"
          onClick={() => handleTabClick('scanner')}
          role="button"
          tabIndex={0}
          title="DataRaksha AI Home"
          aria-label="DataRaksha AI Home"
        >
          <div className="brand-logo-glow">
            <Shield className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">
              DataRaksha <span className="gradient-text">AI</span>
            </span>
            <span className="brand-tagline">Digital Risk Protection</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.id === 'admin' && (
                  <span className="nav-admin-badge" title="Administrator Only">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Status & Auth Actions (Desktop) */}
        <div className="nav-actions desktop-only">
          <div className="system-status-indicator" title="Threat Protection Engines Operational">
            <span className="status-dot"></span>
            <span className="status-text">Engines Active</span>
          </div>

          {isAuthenticated ? (
            <div className="user-profile-badge" id="navbar-user-profile">
              <div className="user-avatar-circle">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="user-email-tag" title={user?.email}>
                Welcome, <strong>{user?.displayName || user?.email?.split('@')[0]}</strong>
              </span>
              <span
                className={`role-pill ${isAdmin ? 'role-pill-admin' : 'role-pill-user'}`}
                title={`Account Permission: ${isAdmin ? 'System Administrator' : 'Individual User'}`}
              >
                {isAdmin ? 'Admin' : 'User'}
              </span>
              <button
                type="button"
                id="nav-logout-btn"
                className="btn btn-ghost action-sm logout-btn"
                onClick={handleLogout}
                title="Sign out of DataRaksha AI"
                aria-label="Sign out"
              >
                <LogOut size={14} />
                <span className="logout-text">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="nav-signin-btn"
              className={`btn btn-secondary action-sm ${activeTab === 'auth' ? 'active' : ''}`}
              onClick={handleOpenAuthClick}
            >
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-hamburger-btn mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay mobile-only" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-text">
                <span className="brand-title">
                  DataRaksha <span className="gradient-text">AI</span>
                </span>
                <span className="brand-tagline">Cyber Threat Shield</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="mobile-nav-links" aria-label="Mobile Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.id === 'admin' && <span className="nav-admin-badge">Admin</span>}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Auth & User Profile */}
            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <div className="mobile-user-box">
                  <div className="mobile-user-row">
                    <div className="user-avatar-circle">
                      {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="mobile-user-info">
                      <span className="mobile-user-name">
                        {user?.displayName || user?.email?.split('@')[0]}
                      </span>
                      <span className="mobile-user-email">{user?.email}</span>
                    </div>
                    <span className={`role-pill ${isAdmin ? 'role-pill-admin' : 'role-pill-user'}`}>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary action-sm mobile-logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary full-width-btn"
                  onClick={handleOpenAuthClick}
                >
                  <User size={16} /> Sign In / Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
