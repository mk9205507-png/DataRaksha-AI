import apiClient from './api';

const STORAGE_KEY = 'dataraksha_scan_history';

// Baseline reference history records
export const INITIAL_HISTORY = [
  {
    id: 'hist-1',
    scan_type: 'email',
    title: 'Email Analysis',
    timestamp: '16 Oct 2026, 2:30 PM',
    created_at: '2026-10-16T14:30:00Z',
    risk_level: 'High',
    risk_score: 92,
    badgeClass: 'risk-badge-high',
    iconColor: 'blue',
    preview:
      'URGENT: Your bank account at State Bank has been suspended due to unauthorized access. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours...',
    summary:
      'Urgency coercion heuristics, bank impersonation, and deceptive verification URL detected.',
    threats: ['Phishing Urgency Cue', 'Unverified Financial Domain', 'PII Harvest Attempt (PAN, PIN)'],
    exposed_pii: [
      { type: 'Phone Number', value: '+91-9876543210' },
      { type: 'Govt ID', value: 'Aadhaar / PAN' },
    ],
    recommendations: [
      'Do not click the verification link.',
      'Contact State Bank through official banking channels.',
    ],
    target_company: 'State Bank of India',
  },
  {
    id: 'hist-2',
    scan_type: 'url',
    title: 'URL Analysis',
    timestamp: '16 Oct 2026, 11:30 AM',
    created_at: '2026-10-16T11:30:00Z',
    risk_level: 'Low',
    risk_score: 8,
    badgeClass: 'risk-badge-low',
    iconColor: 'blue',
    preview: 'https://google.com',
    summary: 'Domain verified against Google Safe Browsing and legitimate HTTPS SSL certificates.',
    threats: ['No threats detected'],
    exposed_pii: [],
    recommendations: ['Verified safe destination.'],
    target_company: 'Google',
  },
  {
    id: 'hist-3',
    scan_type: 'policy',
    title: 'Privacy Policy',
    timestamp: '15 Oct 2026, 4:15 PM',
    created_at: '2026-10-15T16:15:00Z',
    risk_level: 'Medium',
    risk_score: 65,
    badgeClass: 'risk-badge-medium',
    iconColor: 'amber',
    preview:
      'We collect your exact GPS location, browser history, microphone telemetry, and share with third-party advertising brokers indefinitely without mandatory prior notice...',
    summary: 'Policy contains aggressive data broker monetization and perpetual audio telemetry retention.',
    threats: ['Data Broker Monetization', 'Real-time GPS Tracking', 'Ambient Audio Telemetry'],
    exposed_pii: [],
    recommendations: [
      'Revoke microphone and background location permissions in app settings.',
      'Draft a statutory data deletion request notice.',
    ],
    target_company: 'Acme Social Ad-Tech',
  },
  {
    id: 'hist-4',
    scan_type: 'email',
    title: 'Email Analysis',
    timestamp: '14 Oct 2026, 1:10 PM',
    created_at: '2026-10-14T13:10:00Z',
    risk_level: 'Low',
    risk_score: 12,
    badgeClass: 'risk-badge-low',
    iconColor: 'blue',
    preview:
      'Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace.',
    summary: 'Clean business communication. No phishing indicators or sensitive data exposed.',
    threats: ['No threats detected'],
    exposed_pii: [],
    recommendations: ['No action required.'],
    target_company: 'Internal Team',
  },
  {
    id: 'hist-5',
    scan_type: 'url',
    title: 'URL Analysis',
    timestamp: '13 Oct 2026, 3:45 PM',
    created_at: '2026-10-13T15:45:00Z',
    risk_level: 'Medium',
    risk_score: 55,
    badgeClass: 'risk-badge-medium',
    iconColor: 'blue',
    preview: 'http://bit.ly/claim-bank-cashback-instant',
    summary: 'Shortened obfuscated link redirecting to unverified landing page.',
    threats: ['URL Shortener Obfuscation', 'Unencrypted HTTP Protocol'],
    exposed_pii: [],
    recommendations: ['Avoid clicking shortened links from untrusted communications.'],
    target_company: 'Bitly Redirect Service',
  },
];

export const historyService = {
  /**
   * Retrieves all scan history records from localStorage.
   * If empty, seeds with baseline demo records so user sees realistic data.
   */
  getStoredScans: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading local scan history:', e);
    }

    // Seed default records
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
    } catch {
      // Ignored
    }
    return INITIAL_HISTORY;
  },

  /**
   * Saves a newly completed scan record to localStorage and notifies listeners.
   */
  saveScanRecord: ({ scan_type, preview, result, target_company = '' }) => {
    if (!result) return null;

    const normalizedType =
      scan_type === 'message' || scan_type === 'email'
        ? 'email'
        : scan_type === 'link' || scan_type === 'url'
        ? 'url'
        : 'policy';

    const isEmail = normalizedType === 'email';
    const isUrl = normalizedType === 'url';
    const isPolicy = normalizedType === 'policy';

    const riskLevel = result.risk_level || 'Low';
    const riskScore = typeof result.risk_score === 'number' ? result.risk_score : 0;

    const record = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scan_type: normalizedType,
      title: isEmail ? 'Email Analysis' : isUrl ? 'URL Analysis' : 'Privacy Policy',
      timestamp: new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      created_at: new Date().toISOString(),
      risk_level: riskLevel,
      risk_score: riskScore,
      badgeClass:
        riskLevel === 'High'
          ? 'risk-badge-high'
          : riskLevel === 'Medium'
          ? 'risk-badge-medium'
          : 'risk-badge-low',
      iconColor: isPolicy ? 'amber' : 'blue',
      preview: typeof preview === 'string' ? preview.slice(0, 300) : '',
      summary: result.summary || 'Security assessment completed.',
      threats: Array.isArray(result.detected_threats) ? result.detected_threats : [],
      exposed_pii: Array.isArray(result.exposed_pii) ? result.exposed_pii : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      target_company: target_company || result.target_company || '',
    };

    try {
      const existing = historyService.getStoredScans();
      // Remove any identical duplicate preview at the top
      const filtered = existing.filter((item) => item.preview !== record.preview);
      const updated = [record, ...filtered];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Broadcast update event to all listening components
      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { newRecord: record, allRecords: updated },
        })
      );
    } catch (e) {
      console.warn('Could not save scan record to localStorage:', e);
    }

    return record;
  },

  /**
   * Deletes a single scan by ID.
   */
  deleteStoredScan: async (id) => {
    try {
      const existing = historyService.getStoredScans();
      const updated = existing.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { deletedId: id, allRecords: updated },
        })
      );
    } catch (e) {
      console.warn('Error deleting scan from localStorage:', e);
    }

    // Attempt remote backend delete if authenticated
    try {
      const token = localStorage.getItem('dataraksha_auth_token');
      if (token && !id.startsWith('hist-')) {
        await apiClient.delete(`/history/${id}`);
      }
    } catch {
      // Handled gracefully
    }
  },

  /**
   * Clears all stored scan history.
   */
  clearAllStoredScans: async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { allRecords: [] },
        })
      );
    } catch (e) {
      console.warn('Error clearing scan history in localStorage:', e);
    }

    // Attempt remote backend clear if authenticated
    try {
      const token = localStorage.getItem('dataraksha_auth_token');
      if (token) {
        await apiClient.delete('/history');
      }
    } catch {
      // Handled gracefully
    }
  },

  /**
   * Fetches remote scan history from backend /history endpoint if authenticated,
   * merges with local records, and returns normalized history.
   */
  fetchAndSyncHistory: async () => {
    const local = historyService.getStoredScans();
    const token = localStorage.getItem('dataraksha_auth_token');

    if (!token) {
      return local;
    }

    try {
      const res = await apiClient.get('/history');
      const rawRecords = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.records)
        ? res.data.records
        : [];

      if (rawRecords.length > 0) {
        const formattedRemote = rawRecords.map((item, idx) => {
          const isEmail = item.scan_type === 'message' || item.scan_type === 'email';
          const isUrl = item.scan_type === 'link' || item.scan_type === 'url';
          const isPolicy = item.scan_type === 'policy';
          const riskLevel = item.risk_level || 'Low';

          return {
            id: item.id || `remote-${idx}`,
            scan_type: isEmail ? 'email' : isUrl ? 'url' : 'policy',
            title: isEmail ? 'Email Analysis' : isUrl ? 'URL Analysis' : 'Privacy Policy',
            timestamp: item.created_at
              ? new Date(item.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Recent',
            created_at: item.created_at || new Date().toISOString(),
            risk_level: riskLevel,
            risk_score: item.risk_score || 0,
            badgeClass:
              riskLevel === 'High'
                ? 'risk-badge-high'
                : riskLevel === 'Medium'
                ? 'risk-badge-medium'
                : 'risk-badge-low',
            iconColor: isPolicy ? 'amber' : 'blue',
            preview: item.input_preview || item.content || '',
            summary: item.summary || 'Threat scan completed.',
            threats: item.detected_threats || [],
            exposed_pii: item.exposed_pii || [],
            recommendations: item.recommendations || [],
            target_company: item.target_company || '',
          };
        });

        // Merge remote and local records by ID
        const seenIds = new Set();
        const merged = [];

        for (const rec of formattedRemote) {
          if (!seenIds.has(rec.id)) {
            seenIds.add(rec.id);
            merged.push(rec);
          }
        }

        for (const rec of local) {
          if (!seenIds.has(rec.id)) {
            seenIds.add(rec.id);
            merged.push(rec);
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Backend history sync skipped or offline:', err);
    }

    return local;
  },
};

export default historyService;
