import React, { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import LetterGenerator from './pages/LetterGenerator';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import apiClient from './services/api';
import supabase from './services/supabaseClient';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('dataraksha_auth_token');
    if (token) {
      apiClient
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // Token is invalid or expired
          localStorage.removeItem('dataraksha_auth_token');
          setUser(null);
        });
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('dataraksha_auth_token');
    try {
      await supabase.auth.signOut();
    } catch {
      // Offline fallback
    }
    setUser(null);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'letters':
        return <LetterGenerator user={user} />;
      case 'history':
        return <History user={user} onPromptLogin={() => setActiveTab('auth')} />;
      case 'admin':
        return <AdminDashboard user={user} onPromptLogin={() => setActiveTab('auth')} />;
      case 'auth':
        return (
          <AuthPage
            onAuthSuccess={(userData) => {
              setUser(userData);
              setActiveTab('scanner');
            }}
          />
        );
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
        user={user}
        onOpenAuth={() => setActiveTab('auth')}
        onLogout={handleLogout}
      />

      {/* Main Page Workspace */}
      <main className="main-content">
        <div className="container view-container">
          {renderActiveView()}
        </div>
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}

export default App;
