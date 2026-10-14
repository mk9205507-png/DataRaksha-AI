import React from 'react';
import { Mail, Globe, FileCode2 } from 'lucide-react';

export const ScannerTabs = ({ currentType, onSelectType, disabled = false }) => {
  const tabs = [
    {
      id: 'message',
      label: 'Message & Email',
      description: 'Phishing, scam triggers & exposed PII',
      icon: Mail,
    },
    {
      id: 'link',
      label: 'Link & URL',
      description: 'Google Safe Browsing & deceptive domains',
      icon: Globe,
    },
    {
      id: 'policy',
      label: 'Privacy Policy',
      description: 'AI summary & data broker tracking',
      icon: FileCode2,
    },
  ];

  return (
    <div className="scanner-tabs-wrapper" id="scanner-type-selector" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentType === tab.id;
        return (
          <button
            key={tab.id}
            id={`scanner-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            className={`scanner-tab-card ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelectType(tab.id)}
            type="button"
            disabled={disabled}
          >
            <div className="tab-icon-wrapper">
              <Icon size={22} />
            </div>
            <div className="tab-details">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-desc">{tab.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ScannerTabs;

