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

// Protected routes requiring active authentication
const PROTECTED_TABS = ['dashboard', 'email', 'url', 'policy', 'history', 'letters', 'admin'];

// Helper to determine the target tab from window hash
const getTabFromHash = () => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  const validTabs = ['home', 'auth', 'dashboard', 'email', 'url', 'policy', 'history', 'letters', 'admin'];
  return validTabs.includes(hash) ? hash : 'home';
};

function AppContent() {
  // Navigation tabs matching reference design:
  // 'home' | 'email' | 'url' | 'policy' | 'dashboard' | 'history' | 'letters' | 'admin' | 'auth'
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [previousTab, setPreviousTab] = useState('home');
  const [redirectTabAfterAuth, setRedirectTabAfterAuth] = useState(null);
  const [authNoticeMessage, setAuthNoticeMessage] = useState('');
  const [globalAlert, setGlobalAlert] = useState(null);
  const [prefilledLetterData, setPrefilledLetterData] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { isAuthenticated, isAdmin, user, isLoading } = useAuth();

  // Central Navigation & History Synchronization
  const navigateToTab = (targetTab, { replace = false, notice = '' } = {}) => {
    // If target route is protected and user is not authenticated, redirect to Login/Register
    if (PROTECTED_TABS.includes(targetTab) && !isAuthenticated) {
      setRedirectTabAfterAuth(targetTab);
      setAuthNoticeMessage(notice || 'Please sign in to continue.');
      setPreviousTab(activeTab);
      setActiveTab('auth');
      if (replace) {
        window.history.replaceState({ tab: 'auth', redirect: targetTab }, '', '#auth');
      } else {
        window.history.pushState({ tab: 'auth', redirect: targetTab }, '', '#auth');
      }
      return;
    }

    setPreviousTab(activeTab);
    setActiveTab(targetTab);
    const targetHash = targetTab === 'home' ? '#home' : `#${targetTab}`;
    if (replace) {
      window.history.replaceState({ tab: targetTab }, '', targetHash);
    } else {
      window.history.pushState({ tab: targetTab }, '', targetHash);
    }
  };

  // Open authentication view with optional return tab and friendly message
  const handleOpenAuth = (targetAfterAuth = 'dashboard', message = '') => {
    setRedirectTabAfterAuth(targetAfterAuth);
    setAuthNoticeMessage(message || 'Please sign in to continue.');
    setPreviousTab(activeTab);
    setActiveTab('auth');
    window.history.pushState({ tab: 'auth', redirect: targetAfterAuth }, '', '#auth');
  };

  // Handle unauthorized event dispatched from API interceptor
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const msg = e.detail?.message || 'Session expired. Please sign in again.';
      setGlobalAlert({
        type: 'warning',
        message: msg,
      });
      navigateToTab('auth', {
        replace: true,
        notice: msg,
      });
    };

    window.addEventListener('dataraksha:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('dataraksha:unauthorized', handleUnauthorized);
    };
  }, []);

  // Central Route Guard: Re-evaluate when activeTab or isAuthenticated changes
  useEffect(() => {
    if (isLoading) return;

    if (PROTECTED_TABS.includes(activeTab) && !isAuthenticated) {
      setRedirectTabAfterAuth(activeTab);
      setAuthNoticeMessage('Please sign in to continue.');
      setActiveTab('auth');
      window.history.replaceState({ tab: 'auth', redirect: activeTab }, '', '#auth');
    }
  }, [activeTab, isAuthenticated, isLoading]);

  // Browser Back & Forward Button Handling (popstate / hashchange)
  useEffect(() => {
    const handleHistoryChange = (e) => {
      const tabFromHash = getTabFromHash();
      const targetTab = e.state?.tab || tabFromHash || 'home';

      if (PROTECTED_TABS.includes(targetTab) && !isAuthenticated) {
        setRedirectTabAfterAuth(targetTab);
        setAuthNoticeMessage('Please sign in to continue.');
        setActiveTab('auth');
        window.history.replaceState({ tab: 'auth', redirect: targetTab }, '', '#auth');
      } else {
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHistoryChange);
    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener('hashchange', handleHistoryChange);
    };
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {

    const targetTab = redirectTabAfterAuth || 'dashboard';
    setRedirectTabAfterAuth(null);
    setAuthNoticeMessage('');

    if (targetTab === 'admin' && !isAdmin) {
      navigateToTab('dashboard', { replace: true });
    } else {
      navigateToTab(targetTab, { replace: true });
    }
  };

  const handleNavigateToLetters = (data) => {
    setPrefilledLetterData(data);
    navigateToTab('letters');
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
        onNavigate={(tab) => navigateToTab(tab)}
        onOpenAuth={(targetTab, message) => handleOpenAuth(targetTab, message)}
      />
    );
  }

  // 2. Authentication Page (Login / Register)
  if (activeTab === 'auth') {
    return (
      <div className="auth-view-wrapper">
        <div className="auth-back-nav">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigateToTab(previousTab || 'home')}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          initialMessage={authNoticeMessage}
        />
      </div>
    );
  }

  // 3. Inner Application Views (Screens 2 - 6 with Left Sidebar)
  const renderInnerView = () => {
    // Fail-safe protection: block protected component rendering if unauthenticated
    if (PROTECTED_TABS.includes(activeTab) && !isAuthenticated) {
      return (
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          initialMessage={authNoticeMessage || 'Please sign in to continue.'}
        />
      );
    }

    switch (activeTab) {
      case 'email':
        return (
          <EmailSafetyPage
            onNavigateBack={() => navigateToTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'url':
        return (
          <UrlSafetyPage
            onNavigateBack={() => navigateToTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'policy':
        return (
          <PrivacyPolicyPage
            onNavigateBack={() => navigateToTab('dashboard')}
            onNavigateToLetters={handleNavigateToLetters}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(tab) => navigateToTab(tab)}
            onSelectActivity={(act) => navigateToTab(act.type)}
          />
        );

      case 'history':
        return (
          <AnalysisHistoryPage
            onNavigateBack={() => navigateToTab('dashboard')}
            onReopenScan={(scan) => navigateToTab(scan.scan_type)}
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
            onPromptLogin={() => handleOpenAuth('admin')}
          />
        );

      default:
        return (
          <DashboardPage
            onNavigate={(tab) => navigateToTab(tab)}
            onSelectActivity={(act) => navigateToTab(act.type)}
          />
        );
    }
  };

  return (
    <div className={`inner-app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="dataraksha-app">
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
      <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            navigateToTab(tab);
            setMobileSidebarOpen(false);
          }}
          onOpenAuth={handleOpenAuth}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onCloseMobile={() => setMobileSidebarOpen(false)}
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
