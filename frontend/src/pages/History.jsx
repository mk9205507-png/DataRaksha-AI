import React, { useState } from 'react';
import HistoryTable from '../components/history/HistoryTable';
import Alert from '../components/common/Alert';
import { History as HistoryIcon } from 'lucide-react';

export const History = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [alert, setAlert] = useState(null);

  // Initial demonstration mock records
  const [scans, setScans] = useState([
    {
      id: 'sc-101',
      scan_type: 'message',
      input_preview: 'URGENT: Your bank account at State Bank has been suspended due to unauthorized access...',
      risk_level: 'High',
      risk_score: 88,
      summary: 'Phishing urgency cues and sensitive banking impersonation detected.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'sc-102',
      scan_type: 'link',
      input_preview: 'https://security-login-update-credentials.top/account',
      risk_level: 'High',
      risk_score: 92,
      summary: 'Deceptive domain flagged for credential harvesting vectors.',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'sc-103',
      scan_type: 'policy',
      input_preview: 'We collect your exact GPS location, browser history, and share with data brokers...',
      risk_level: 'Medium',
      risk_score: 65,
      summary: 'Predatory tracking terms with perpetual data broker monetization clause.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'sc-104',
      scan_type: 'message',
      input_preview: 'Hi Kalyani, please review the attached meeting minutes when you have a moment.',
      risk_level: 'Low',
      risk_score: 12,
      summary: 'No obvious urgency triggers or social engineering heuristics detected.',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ]);

  const handleDeleteScan = (id) => {
    setScans(scans.filter((s) => s.id !== id));
    setAlert({ type: 'info', message: 'Record removed from audit trail.' });
  };

  const handleClearAll = () => {
    setScans([]);
    setAlert({ type: 'info', message: 'All scan history records cleared.' });
  };

  const filteredScans = scans.filter((scan) => {
    const matchesType = filterType === 'all' || scan.scan_type === filterType;
    const matchesRisk = filterRisk === 'all' || scan.risk_level === filterRisk;
    return matchesType && matchesRisk;
  });

  return (
    <div className="history-page" id="history-view">
      <div className="dashboard-hero">
        <div className="hero-badge">
          <HistoryIcon size={14} className="hero-badge-icon" />
          <span>Security Audit Trail</span>
        </div>
        <h1 className="hero-title">
          Threat Assessment <span className="gradient-text">History</span>
        </h1>
        <p className="hero-subtitle">
          Review past scans, monitor threat ratings over time, and manage your stored privacy audit logs with granular deletion controls.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <HistoryTable
        scans={filteredScans}
        filterType={filterType}
        filterRisk={filterRisk}
        onFilterTypeChange={setFilterType}
        onFilterRiskChange={setFilterRisk}
        onDeleteScan={handleDeleteScan}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default History;
