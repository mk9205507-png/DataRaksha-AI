import apiClient from './api';

/**
 * Service for Phase 1 Core Threat Detection Scanners
 * Online-only: Performs real-time AI and threat analysis via backend APIs.
 * Endpoints:
 * - POST /api/v1/scan/message
 * - POST /api/v1/scan/link
 * - POST /api/v1/scan/policy
 */

const ensureOnline = () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
};

const formatApiError = (err) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }
  if (err.response?.data?.detail) {
    return err.response.data.detail;
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'The threat analysis request timed out. Please try again.';
  }
  if (err.isNetworkDown || !err.response) {
    return 'Cannot connect to the DataRaksha analysis backend. Please ensure the server is online and try again.';
  }
  return err.message || 'An error occurred during threat analysis. Please try again.';
};

export const scanService = {
  /**
   * Scans SMS, emails, or chat messages for phishing, urgency cues, and exposed PII.
   * @param {string} content - Message text to analyze
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanMessage: async (content) => {
    ensureOnline();
    try {
      const response = await apiClient.post('/scan/message', { content });
      return response.data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  },

  /**
   * Validates target URL against Google Safe Browsing threat databases.
   * @param {string} url - Target URL to evaluate
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanLink: async (url) => {
    ensureOnline();
    try {
      const response = await apiClient.post('/scan/link', { url });
      return response.data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  },

  /**
   * Evaluates privacy policies and extracts data broker, telemetry, and retention risks.
   * Accepts either raw policy text or a website URL to fetch and evaluate.
   * @param {string} input - Terms/privacy policy text OR a website URL
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanPolicy: async (input) => {
    ensureOnline();
    const trimmed = (input || '').trim();
    const isUrl =
      /^https?:\/\//i.test(trimmed) ||
      (!/\s/.test(trimmed) && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed));

    const payload = isUrl ? { url: trimmed } : { policy_text: trimmed };

    try {
      const response = await apiClient.post('/scan/policy', payload);
      return response.data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  },
};

export default scanService;
