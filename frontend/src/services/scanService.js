import apiClient from './api';

/**
 * Service for Phase 1 Core Threat Detection Scanners
 * Endpoints:
 * - POST /api/v1/scan/message
 * - POST /api/v1/scan/link
 * - POST /api/v1/scan/policy
 */
export const scanService = {
  /**
   * Scans SMS, emails, or chat messages for phishing, urgency cues, and exposed PII.
   * @param {string} content - Message text to analyze
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanMessage: async (content) => {
    const response = await apiClient.post('/scan/message', { content });
    return response.data;
  },

  /**
   * Validates target URL against Google Safe Browsing threat databases.
   * @param {string} url - Target URL to evaluate
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanLink: async (url) => {
    const response = await apiClient.post('/scan/link', { url });
    return response.data;
  },

  /**
   * Evaluates privacy policies and extracts data broker, telemetry, and retention risks.
   * @param {string} policy_text - Terms or privacy policy text
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanPolicy: async (policy_text) => {
    const response = await apiClient.post('/scan/policy', { policy_text });
    return response.data;
  },
};

export default scanService;
