import React from 'react';
import { Shield, Lock, FileText, History, BarChart3, User, LogOut } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, user, onOpenAuth, onLogout }) => {
  const navItems = [
    { id: 'scanner', label: 'Threat Scanner', icon: Shield },
    { id: 'letters', label: 'Data Request Letters', icon: FileText },
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'admin', label: 'Admin Portal', icon: BarChart3 },
  ];

  return (
    <header className="navbar-header" id="main-navigation">
      <div className="container nav-container">
        <div className="nav-brand" onClick={() => setActiveTab('scanner')}>
          <div className="brand-logo-glow">
            <Shield className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">DataRaksha <span className="gradient-text">AI</span></span>
            <span className="brand-tagline">Digital Risk Protection</span>
          </div>
        </div>

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
              </button>
            );
          })}
        </nav>

        <div className="nav-actions">
          <div className="system-status-indicator" title="System Operational">
            <span className="status-dot"></span>
            <span className="status-text">Engines Active</span>
          </div>

          {user ? (
            <div className="user-profile-badge">
              <span className="user-email-tag">{user.email || 'User'}</span>
              {user.role === 'admin' && (
                <span className="admin-tag-pill" style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Admin</span>
              )}
              <button
                type="button"
                className="btn btn-ghost action-sm logout-btn"
                onClick={onLogout}
                title="Sign out"
              >
                <LogOut size={14} />
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
