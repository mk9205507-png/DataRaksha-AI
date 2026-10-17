import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({ onNavigate, onSelectActivity }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const displayName =
    user?.displayName ||
    user?.name ||
    (isAuthenticated ? localStorage.getItem('dataraksha_person_name') : '') ||
    'vaishnavi';

  const handleLogout = async () => {
    await logout();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="dashboard-overview-page" id="dashboard-overview">
      {/* Top Page Header with Sign Out Option */}
      <div className="inner-page-header flex-header">
        <div>
          <h1 className="header-title">
            Welcome, <span className="text-blue">{displayName}</span>
          </h1>
          <p className="header-subtitle">
            Overview of your security status and recent activity.
          </p>
        </div>
        <button
          type="button"
          id="dashboard-header-signout-btn"
          className="btn btn-secondary action-sm header-signout-btn"
          onClick={handleLogout}
          title="Sign out of DataRaksha AI"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
