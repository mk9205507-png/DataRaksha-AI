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
import { Shield, ShieldAlert } from 'lucide-react';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [globalAlert, setGlobalAlert] = useState(null);

  const { isAuthenticated, isAdmin, user, isLoading } = useAuth();

  // Handle unauthorized event dispatched from API interceptor
  useEffect(() => {
    const handleUnauthorized = (e) => {
      setGlobalAlert({
        type: 'warning',
        message: e.detail?.message || 'Session expired. Please sign in again.',
      });
    };

    window.addEventListener('dataraksha:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dataraksha:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleAuthSuccess = (authUser) => {
    const name =
      authUser?.displayName ||
      authUser?.user_metadata?.full_name ||
      authUser?.full_name ||
      authUser?.email?.split('@')[0] ||
      'User';
    setGlobalAlert({
      type: 'success',
      message: `Welcome back, ${name}! Digital risk shield initialized.`,
    });
    setActiveTab('scanner');
  };

  // 1. Initial Loading State while checking Supabase session
  if (isLoading) {
    return (
      <div className="auth-splash-container" id="auth-splash">
        <div className="auth-splash-card">
          <div className="brand-logo-glow lg">
            <Shield className="brand-icon" size={36} />
          </div>
          <h2 className="splash-title">
            DataRaksha <span className="gradient-text">AI</span>
          </h2>
          <p className="splash-sub">Verifying encrypted security session...</p>
          <div className="spinner lg"></div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Portal: Displays dedicated Sign In & Registration Suite
  if (!isAuthenticated) {
    return (
      <div className="app-shell" id="dataraksha-auth-shell">
        <header className="navbar-header" id="auth-header">
          <div className="container nav-container auth-nav-container">
            <div className="nav-brand" role="banner">
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

            <div className="system-status-indicator" title="Threat Protection Engines Operational">
              <span className="status-dot"></span>
              <span className="status-text">Cloud Security Shield Active</span>
            </div>
          </div>
        </header>

        <main className="main-content auth-page-wrapper">
          <div className="container">
            {globalAlert && (
              <div className="global-alert-wrapper">
                <Alert
                  type={globalAlert.type}
                  message={globalAlert.message}
                  onClose={() => setGlobalAlert(null)}
                />
              </div>
            )}
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 3. Authenticated Application Workspace
  const renderActiveView = () => {
    switch (activeTab) {
      case 'letters':
        return <LetterGenerator />;

      case 'history':
        return <History />;

      case 'admin':
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
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('scanner')}
                >
                  Return to Threat Scanner
                </button>
              </div>
            </div>
          );
        }
        return <AdminDashboard />;

      case 'scanner':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell" id="dataraksha-app">
      {/* Top Header Navbar with user profile & navigation tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
