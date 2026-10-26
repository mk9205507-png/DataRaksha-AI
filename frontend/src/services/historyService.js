import apiClient from './api';

const STORAGE_KEY = 'dataraksha_scan_history';

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('dataraksha_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.id || '';
    }
  } catch {
    // Graceful fallback
  }
  return '';
};

export const historyService = {
  /**
   * Cleans up legacy un-scoped scan history from previous sessions so old
   * mock/test data never bleeds into new user accounts.
   */
  purgeLegacyUnscopedHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Graceful fallback
    }
  },

  /**
   * Retrieves all scan history records from localStorage for the active user.
   * Strictly returns only records belonging to the given userId (empty array for new users).
   */
  getStoredScans: (customUserId) => {
    try {
      const userId = customUserId !== undefined ? customUserId : getCurrentUserId();
      if (!userId) {
        return [];
      }
      const storageKey = `${STORAGE_KEY}_${userId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) => item && item.user_id === userId && !String(item.id).startsWith('hist-')
          );
        }
      }
    } catch (e) {
      console.warn('Error reading local scan history:', e);
    }
    return [];
  },

  /**
   * Saves a newly completed scan record to localStorage and notifies listeners.
   */
  saveScanRecord: ({ scan_type, preview, result, target_company = '', userId }) => {
    if (!result) return null;

    const uid = userId || getCurrentUserId();
    if (!uid) {
      console.warn('Cannot save scan without an authenticated user ID');
      return null;
    }

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
      user_id: uid,
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
      const storageKey = `${STORAGE_KEY}_${uid}`;
      const existing = historyService.getStoredScans(uid);
      const filtered = existing.filter((item) => item.preview !== record.preview);
      const updated = [record, ...filtered];
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Broadcast update event to all listening components
      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { newRecord: record, allRecords: updated, userId: uid },
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
  deleteStoredScan: async (id, customUserId) => {
    try {
      const uid = customUserId || getCurrentUserId();
      if (!uid) return;
      const storageKey = `${STORAGE_KEY}_${uid}`;
      const existing = historyService.getStoredScans(uid);
      const updated = existing.filter((item) => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { deletedId: id, allRecords: updated, userId: uid },
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
   * Clears all stored scan history for the active user.
   */
  clearAllStoredScans: async (customUserId) => {
    try {
      const uid = customUserId || getCurrentUserId();
      if (!uid) return;
      const storageKey = `${STORAGE_KEY}_${uid}`;
      localStorage.setItem(storageKey, JSON.stringify([]));

      window.dispatchEvent(
        new CustomEvent('dataraksha:history_updated', {
          detail: { allRecords: [], userId: uid },
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
   * merges with local records for this user, and returns normalized history.
   */
  fetchAndSyncHistory: async (customUserId) => {
    const uid = customUserId || getCurrentUserId();
    if (!uid) {
      return [];
    }

    const storageKey = `${STORAGE_KEY}_${uid}`;
    const token = localStorage.getItem('dataraksha_auth_token');

    if (!token) {
      return historyService.getStoredScans(uid);
    }

    try {
      const res = await apiClient.get('/history');
      const rawRecords = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.records)
        ? res.data.records
        : [];

      const formattedRemote = rawRecords
        .filter((item) => !item.user_id || item.user_id === uid)
        .map((item, idx) => {
          const isEmail = item.scan_type === 'message' || item.scan_type === 'email';
          const isUrl = item.scan_type === 'link' || item.scan_type === 'url';
          const isPolicy = item.scan_type === 'policy';
          const riskLevel = item.risk_level || 'Low';

          return {
            id: item.id || `remote-${idx}`,
            user_id: uid,
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
            risk_score: typeof item.risk_score === 'number' ? item.risk_score : 0,
            badgeClass:
              riskLevel === 'High'
                ? 'risk-badge-high'
                : riskLevel === 'Medium'
                ? 'risk-badge-medium'
                : 'risk-badge-low',
            iconColor: isPolicy ? 'amber' : 'blue',
            preview: item.input_preview || item.content || item.preview || '',
            summary: item.summary || 'Threat scan completed.',
            threats: item.detected_threats || [],
            exposed_pii: item.exposed_pii || [],
            recommendations: item.recommendations || [],
            target_company: item.target_company || '',
          };
        });

      // Local records strictly for this user
      const local = historyService.getStoredScans(uid);

      // Merge remote and local records by preview / ID
      const seenPreviews = new Set();
      const merged = [];

      for (const rec of formattedRemote) {
        if (!seenPreviews.has(rec.preview)) {
          seenPreviews.add(rec.preview);
          merged.push(rec);
        }
      }

      for (const rec of local) {
        if (rec.user_id === uid && !seenPreviews.has(rec.preview)) {
          seenPreviews.add(rec.preview);
          merged.push(rec);
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('Backend history sync skipped or offline:', err);
    }

    return historyService.getStoredScans(uid);
  },
};

export default historyService;
