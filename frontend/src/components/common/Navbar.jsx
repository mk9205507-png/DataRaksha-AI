import React from 'react';
import { Shield, FileText, History, BarChart3, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();

  // Core navigation tabs - Admin Portal is conditionally exposed strictly to admin role
  const baseNavItems = [
    { id: 'scanner', label: 'Threat Scanner', icon: Shield },
    { id: 'letters', label: 'Data Request Letters', icon: FileText },
    { id: 'history', label: 'Scan History', icon: History },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, { id: 'admin', label: 'Admin Portal', icon: BarChart3 }]
    : baseNavItems;

  const handleLogout = async () => {
    await logout();
    if (activeTab === 'admin' || activeTab === 'history') {
      setActiveTab('scanner');
    }
  };

  return (
    <header className="navbar-header" id="main-navigation">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div
          className="nav-brand"
          onClick={() => setActiveTab('scanner')}
          role="button"
          tabIndex={0}
          title="DataRaksha AI Home"
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

        {/* Dynamic Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
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

        {/* Right Side Status & Auth Actions */}
        <div className="nav-actions">
          <div className="system-status-indicator" title="Threat Protection Engines Operational">
            <span className="status-dot"></span>
            <span className="status-text">Engines Active</span>
          </div>

          {isAuthenticated ? (
            <div className="user-profile-badge" id="navbar-user-profile">
              <span className="user-email-tag" title={user?.email}>
                {user?.email || 'Active User'}
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
              onClick={onOpenAuth}
            >
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
