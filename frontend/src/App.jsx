import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import EmailSafetyPage from './pages/EmailSafetyPage';
import UrlSafetyPage from './pages/UrlSafetyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisHistoryPage from './pages/AnalysisHistoryPage';
import LetterGenerator from './pages/LetterGenerator';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/common/Sidebar';
import Alert from './components/common/Alert';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Shield, Menu, X, ArrowLeft } from 'lucide-react';
import './App.css';

function AppContent() {
  // Navigation tabs matching reference design:
  // 'home' | 'email' | 'url' | 'policy' | 'dashboard' | 'history' | 'letters' | 'admin' | 'auth'
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [globalAlert, setGlobalAlert] = useState(null);
  const [prefilledLetterData, setPrefilledLetterData] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { isAuthenticated, isAdmin, user, isLoading } = useAuth();

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

  const handleAuthSuccess = (authenticatedUser) => {
    const personName =
      authenticatedUser?.displayName ||
      authenticatedUser?.user_metadata?.full_name ||
      user?.displayName ||
      '';
    setGlobalAlert({
      type: 'success',
      message: personName
        ? `Welcome, ${personName}! Your security shield is active.`
        : 'Authentication successful! Welcome to DataRaksha AI.',
    });
    if (previousTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleNavigateToLetters = (data) => {
    setPrefilledLetterData(data);
    setActiveTab('letters');
  };

  // Initial loading splash screen
  if (isLoading) {
    return (
      <div className="auth-splash-container" id="auth-splash">
        <div className="auth-splash-card card">
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

  // 1. Home / Landing Page (Reference Screen 1)
  if (activeTab === 'home') {
    return (
      <HomePage
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenAuth={handleOpenAuth}
      />
    );
  }

  // 2. Authentication Page
  if (activeTab === 'auth') {
    return (
      <div className="auth-view-wrapper">
        <div className="auth-back-nav">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActiveTab(previousTab || 'home')}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // 3. Inner Application Views (Screens 2 - 6 with Left Sidebar)
  const renderInnerView = () => {
    switch (activeTab) {
      case 'email':
        return (
          <EmailSafetyPage
            onNavigateBack={() => setActiveTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'url':
        return (
          <UrlSafetyPage
            onNavigateBack={() => setActiveTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'policy':
        return (
          <PrivacyPolicyPage
            onNavigateBack={() => setActiveTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectActivity={(act) => setActiveTab(act.type)}
          />
        );

      case 'history':
        return (
          <AnalysisHistoryPage
            onNavigateBack={() => setActiveTab('dashboard')}
            onReopenScan={(scan) => setActiveTab(scan.scan_type)}
          />
        );

      case 'letters':
        return (
          <LetterGenerator
            user={user}
            initialData={prefilledLetterData}
          />
        );

      case 'admin':
        return (
          <AdminDashboard
            user={user}
            onPromptLogin={handleOpenAuth}
          />
        );

      default:
        return (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectActivity={(act) => setActiveTab(act.type)}
          />
        );
    }
  };

  return (
    <div className="inner-app-shell" id="dataraksha-app">
      {/* Mobile Top Header */}
      <div className="mobile-header-bar">
        <div className="landing-brand">
          <div className="landing-brand-icon sm">
            <Shield size={18} />
          </div>
          <span className="landing-brand-title">DataRaksha AI</span>
        </div>
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle navigation"
        >
          {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Left Application Sidebar (Screens 2 - 6) */}
      <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          onOpenAuth={handleOpenAuth}
        />
      </div>

      {/* Main Content Workspace */}
      <main className="inner-main-content">
        {globalAlert && (
          <div className="global-alert-wrapper mb-4">
            <Alert
              type={globalAlert.type}
              message={globalAlert.message}
              onClose={() => setGlobalAlert(null)}
            />
          </div>
        )}
        {renderInnerView()}
      </main>
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
