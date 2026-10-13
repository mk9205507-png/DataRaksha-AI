import React, { useState } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import LetterGenerator from './pages/LetterGenerator';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [user, setUser] = useState(null);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'letters':
        return <LetterGenerator />;
      case 'history':
        return <History />;
      case 'admin':
        return <AdminDashboard />;
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
        return <Dashboard />;
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
        onLogout={() => setUser(null)}
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
