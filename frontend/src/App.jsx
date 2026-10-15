import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import LetterGenerator from './pages/LetterGenerator';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import Alert from './components/common/Alert';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldAlert, Lock, ArrowRight, User } from 'lucide-react';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [previousTab, setPreviousTab] = useState('scanner');
  const [globalAlert, setGlobalAlert] = useState(null);

  const { isAuthenticated, isAdmin, user } = useAuth();

  // Handle unauthorized event dispatched from API interceptor
  useEffect(() => {
    const handleUnauthorized = (e) => {
      setGlobalAlert({
        type: 'warning',
        message: e.detail?.message || 'Session expired. Please sign in again.',
      });
      setActiveTab('auth');
    };

    window.addEventListener('dataraksha:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dataraksha:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleOpenAuth = () => {
    setPreviousTab(activeTab);
    setActiveTab('auth');
  };

  const handleAuthSuccess = () => {
    setGlobalAlert({
      type: 'success',
      message: 'Authentication successful! Welcome to DataRaksha AI.',
    });
    // Return to the tab the user was trying to access, or default to scanner
    if (previousTab === 'admin' && !isAdmin) {
      setActiveTab('scanner');
    } else {
      setActiveTab(previousTab || 'scanner');
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'letters':
        return <LetterGenerator user={user} />;

      case 'history':
        if (!isAuthenticated) {
          return (
            <div className="protected-route-card glass-card">
              <div className="protected-icon-badge">
                <Lock size={28} className="text-cyan" />
              </div>
              <h2 className="protected-title">Private Scan History</h2>
              <p className="protected-subtitle">
                To guarantee zero cross-tenant leakage and protect your privacy, scan histories are securely encrypted and accessible solely to verified account holders.
              </p>
              <div className="protected-actions">
                <button
                  type="button"
                  id="protected-signin-btn"
                  className="btn btn-primary"
                  onClick={handleOpenAuth}
                >
                  <User size={15} /> Sign In to View History
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('scanner')}
                >
                  Run Guest Scan
                </button>
              </div>
            </div>
          );
        }
        return <History user={user} onPromptLogin={handleOpenAuth} />;

      case 'admin':
        if (!isAuthenticated) {
          return (
            <div className="protected-route-card glass-card">
              <div className="protected-icon-badge error-badge">
                <ShieldAlert size={28} className="text-red" />
              </div>
              <h2 className="protected-title">Administrator Authentication Required</h2>
              <p className="protected-subtitle">
                Access to system threat metrics, API health diagnostics, and user telemetry is restricted to authorized System Administrators.
              </p>
              <div className="protected-actions">
                <button
                  type="button"
                  id="admin-auth-redirect-btn"
                  className="btn btn-primary"
                  onClick={handleOpenAuth}
                >
                  Sign In with Admin Account <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('scanner')}
                >
                  Return to Threat Scanner
                </button>
              </div>
            </div>
          );
        }

        if (!isAdmin) {
          return (
            <div className="protected-route-card glass-card">
              <div className="protected-icon-badge error-badge">
                <ShieldAlert size={28} className="text-red" />
              </div>
              <h2 className="protected-title">403 Forbidden: Administrator Access Required</h2>
              <p className="protected-subtitle">
                Your account (<span className="text-cyan">{user?.email}</span>) is currently authenticated with <span className="text-cyan">Individual User</span> permissions. Elevated administrator credentials are required to view this portal.
              </p>
              <div className="protected-actions">
                <button
                  type="button"
                  id="switch-to-admin-btn"
                  className="btn btn-primary"
                  onClick={handleOpenAuth}
                >
                  Switch to Admin Account
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('scanner')}
                >
                  Return to Threat Scanner
                </button>
              </div>
            </div>
          );
        }

        return <AdminDashboard user={user} onPromptLogin={handleOpenAuth} />;

      case 'auth':
        return <AuthPage onAuthSuccess={handleAuthSuccess} />;

      case 'scanner':
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="app-shell" id="dataraksha-app">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Page Workspace */}
      <main className="main-content">
        <div className="container view-container">
          {globalAlert && (
            <div className="global-alert-wrapper">
              <Alert
                type={globalAlert.type}
                message={globalAlert.message}
                onClose={() => setGlobalAlert(null)}
              />
            </div>
          )}
          {renderActiveView()}
        </div>
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
