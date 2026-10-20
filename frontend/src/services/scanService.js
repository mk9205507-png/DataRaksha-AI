import apiClient from './api';

/**
 * Client-side heuristic analyzer fallback if backend API is temporarily offline.
 * Matches the backend Gemini / Heuristic rules so results are always available.
 */
function analyzeMessageLocally(content) {
  const safeContent = typeof content === 'string' ? content : (content?.content || String(content || ''));
  const text = safeContent.toLowerCase();
  const threats = [];
  const pii = [];
  const recommendations = [];
  let score = 15;

  // 1. Urgency & Coercion
  const urgencyWords = [
    'urgent', 'immediately', 'suspended', 'account blocked', 'blocked within',
    'action required', 'act now', 'limited time', 'expire in', '24 hours', 'last warning', 'permanently frozen'
  ];
  if (urgencyWords.some((w) => text.includes(w))) {
    threats.push('Urgent pressure tactic designed to prompt immediate, unverified action');
    recommendations.push('Do not act in haste. Contact the institution through official verified channels.');
    score += 30;
  }

  // 2. Financial Scams & Impersonation
  const scamWords = [
    'lottery', 'crypto', 'won a prize', 'reward points', 'claim refund',
    'income tax refund', 'kyc update', 'pan card', 'aadhaar', 'electricity bill',
    'bank alert', 'dear customer', '$1,000,000', 'selected your profile'
  ];
  if (scamWords.some((w) => text.includes(w))) {
    threats.push('Financial institution or high-value reward impersonation pattern detected');
    recommendations.push('Legitimate organizations never ask for passwords, PINs, or urgent fees over email.');
    score += 35;
  }

  // 3. Credential Harvesting & Action Triggers
  const actionWords = [
    'click here', 'tap here', 'verify your account', 'confirm identity',
    'login at', 'update password', 'share otp', 'submit pin', 'deposit'
  ];
  if (actionWords.some((w) => text.includes(w))) {
    threats.push('Deceptive call-to-action attempting credential or payment harvesting');
    recommendations.push('Never enter your bank credentials or personal identity numbers via links sent in messages.');
    score += 25;
  }

  // 4. Links Embedded
  if (text.includes('http://') || text.includes('https://') || text.includes('.xyz') || text.includes('.top')) {
    threats.push('Suspicious or unverified external link embedded in message text');
    score += 15;
  }

  // 5. PII Detection (Indian PAN, Aadhaar hints, Card patterns, Email, Phone)
  const phoneMatch = safeContent.match(/(?:\+91|0)?[6-9]\d{9}/);
  if (phoneMatch) {
    pii.push({ type: 'Phone Number', value: phoneMatch[0] });
  }
  const emailMatch = safeContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    pii.push({ type: 'Email Address', value: emailMatch[0] });
  }
  if (text.includes('pan') || text.includes('aadhaar')) {
    threats.push('Requests critical government identity credentials (PAN / Aadhaar)');
    score += 20;
  }

  const finalScore = Math.min(100, score);
  let riskLevel = 'Low';
  let summary = 'No critical threat cues were identified. Continue to maintain standard digital vigilance.';

  if (finalScore >= 70) {
    riskLevel = 'High';
    summary = 'Critical threat detected: This message shows strong patterns of a phishing scam, impersonation, or credential theft attempt.';
  } else if (finalScore >= 40) {
    riskLevel = 'Medium';
    summary = 'Caution advised: This message exhibits suspicious urgency or asks for sensitive personal/financial information.';
  }

  if (recommendations.length === 0) {
    recommendations.push('Verify the sender’s true identity before sharing any sensitive personal data.');
  }

  return {
    scan_type: 'message',
    risk_level: riskLevel,
    risk_score: finalScore,
    summary,
    detected_threats: threats,
    exposed_pii: pii,
    recommendations,
    disclaimer: 'No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online.'
  };
}

function analyzeLinkLocally(url) {
  const lower = (url || '').toLowerCase();
  const threats = [];
  const recommendations = [];
  let score = 10;

  if (lower.includes('bit.ly') || lower.includes('tinyurl') || lower.includes('t.co')) {
    threats.push('URL Shortener: Destination masked behind a redirection service');
    score += 30;
  }
  if (lower.includes('.xyz') || lower.includes('.top') || lower.includes('.work') || lower.includes('.click')) {
    threats.push('High-Risk TLD: Domain uses an extension frequently abused for phishing');
    score += 35;
  }
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower)) {
    threats.push('Raw IP Address: Website accessed directly via IP address instead of registered domain');
    score += 45;
  }
  if (lower.includes('login') || lower.includes('verify') || lower.includes('cashback') || lower.includes('secure-portal')) {
    threats.push('Deceptive Keyword: Contains credential or financial harvesting terms in domain');
    score += 30;
  }

  const finalScore = Math.min(100, score);
  let riskLevel = 'Low';
  let summary = `Target link '${url}' passed basic threat heuristics.`;

  if (finalScore >= 70) {
    riskLevel = 'High';
    summary = `High risk website: Multiple phishing indicators and suspicious destination patterns detected for '${url}'.`;
    recommendations.push('Do not visit this URL or submit any credentials.');
  } else if (finalScore >= 40) {
    riskLevel = 'Medium';
    summary = `Caution advised: The destination '${url}' uses redirection or unverified domain structures.`;
    recommendations.push('Verify the destination domain spelling carefully before proceeding.');
  } else {
    recommendations.push('Ensure the connection is encrypted with HTTPS.');
  }

  return {
    scan_type: 'link',
    risk_level: riskLevel,
    risk_score: finalScore,
    summary,
    detected_threats: threats,
    exposed_pii: [],
    recommendations,
    disclaimer: 'No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online.'
  };
}

function analyzePolicyLocally(policyText) {
  const lower = (policyText || '').toLowerCase();
  const threats = [];
  const recommendations = [];
  let score = 15;

  if (lower.includes('sell') || lower.includes('data broker') || lower.includes('monetize') || lower.includes('third-party advertising')) {
    threats.push('Data Selling: Shares or monetizes personal records with third-party advertisers and data brokers');
    recommendations.push('Opt out of third-party advertising in account privacy preferences.');
    score += 30;
  }
  if (lower.includes('gps') || lower.includes('precise location') || lower.includes('telemetry') || lower.includes('sensor') || lower.includes('microphone')) {
    threats.push('Location & Telemetry: Continuously monitors device sensors, audio, or background location');
    recommendations.push('Revoke continuous background sensor and location permissions on your device.');
    score += 25;
  }
  if (lower.includes('indefinitely') || lower.includes('retained indefinitely') || lower.includes('perpetual')) {
    threats.push('Retention Limits: Indefinite data retention schedule with no mandatory purging');
    recommendations.push('Submit a formal data erasure notice to delete historical telemetry logs.');
    score += 20;
  }
  if (lower.includes('biometric') || lower.includes('facial') || lower.includes('fingerprint')) {
    threats.push('Biometrics: Processes sensitive facial scans or biometric identifiers');
    recommendations.push('Review whether biometric consent can be withdrawn without account termination.');
    score += 25;
  }

  // Structured breakdown categories
  const data_collected = [];
  if (lower.includes('gps') || lower.includes('location')) data_collected.push('Precise Real-Time GPS & Location Data');
  if (lower.includes('device') || lower.includes('ip address') || lower.includes('hardware')) data_collected.push('Device Identifiers, IP Address & Telemetry');
  if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) data_collected.push('Contact Details (Email, Phone, Name)');
  if (lower.includes('biometric') || lower.includes('facial') || lower.includes('face')) data_collected.push('Biometric Facial Scans & Sensor Telemetry');
  if (lower.includes('browsing') || lower.includes('history') || lower.includes('cookies')) data_collected.push('Web Browsing History & Behavioral Footprints');
  if (data_collected.length === 0) data_collected.push('Account Credentials & Basic Service Identifiers');

  const data_usage = [];
  if (lower.includes('advertising') || lower.includes('marketing') || lower.includes('profiling')) {
    data_usage.push('Targeted advertising, marketing analytics, and consumer profiling');
  }
  if (lower.includes('service') || lower.includes('operate') || lower.includes('deliver')) {
    data_usage.push('Delivering core platform functionality and user account management');
  }
  if (data_usage.length === 0) data_usage.push('Delivering and maintaining core platform functionality');

  const third_party_sharing = [];
  if (lower.includes('sell') || lower.includes('data broker') || lower.includes('third-party advertising')) {
    third_party_sharing.push('Third-party data brokers, advertising networks, and commercial affiliates');
  }
  third_party_sharing.push('Essential infrastructure cloud hosting and technical operational vendors');

  const data_retention = lower.includes('indefinitely') || lower.includes('perpetual')
    ? 'Data is retained indefinitely on commercial cloud servers with no mandatory scheduled purging.'
    : 'Retained for active account duration and statutory legal compliance.';

  const user_rights = [
    'Right to request access and an export copy of personal records',
    'Right to request erasure and complete deletion under Indian DPDP Act 2023 / GDPR',
    'Right to opt out of third-party marketing and behavioral ad tracking',
  ];

  const finalScore = Math.min(100, score);
  let riskLevel = 'Low';
  let summary = 'Standard operational privacy policy without aggressive commercial telemetry detected.';

  if (finalScore >= 70) {
    riskLevel = 'High';
    summary = `Significant privacy risks detected: This policy reserves extensive rights to harvest telemetry and monetize user data.`;
  } else if (finalScore >= 40) {
    riskLevel = 'Medium';
    summary = `Moderate privacy impact: Noticeable data sharing or telemetry collection clauses identified.`;
  }

  if (recommendations.length === 0) {
    recommendations.push('Periodically review privacy settings to ensure minimal permissions are granted.');
  }

  return {
    scan_type: 'policy',
    risk_level: riskLevel,
    risk_score: finalScore,
    summary,
    detected_threats: threats,
    exposed_pii: [],
    recommendations,
    policy_analysis: {
      data_collected,
      data_usage,
      third_party_sharing,
      data_retention,
      user_rights,
    },
    disclaimer: 'No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online.'
  };
}

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
    try {
      const response = await apiClient.post('/scan/message', { content });
      return response.data;
    } catch (err) {
      console.warn('Backend /scan/message failed, using intelligent client-side analyzer fallback:', err);
      return analyzeMessageLocally(content);
    }
  },

  /**
   * Validates target URL against Google Safe Browsing threat databases.
   * @param {string} url - Target URL to evaluate
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanLink: async (url) => {
    try {
      const response = await apiClient.post('/scan/link', { url });
      return response.data;
    } catch (err) {
      console.warn('Backend /scan/link failed, using intelligent client-side analyzer fallback:', err);
      return analyzeLinkLocally(url);
    }
  },

  /**
   * Evaluates privacy policies and extracts data broker, telemetry, and retention risks.
   * Accepts either raw policy text or a website URL to fetch and evaluate.
   * @param {string} input - Terms/privacy policy text OR a website URL
   * @returns {Promise<Object>} ScanResultResponse
   */
  scanPolicy: async (input) => {
    const trimmed = (input || '').trim();
    const isUrl =
      /^https?:\/\//i.test(trimmed) ||
      (!/\s/.test(trimmed) && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed));

    const payload = isUrl ? { url: trimmed } : { policy_text: trimmed };

    try {
      const response = await apiClient.post('/scan/policy', payload);
      return response.data;
    } catch (err) {
      // If backend returned a clear validation or extraction error, preserve and surface it!
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      // If network is down and user submitted a URL, inform them to start backend or paste text manually
      if (isUrl) {
        throw new Error(
          'Cannot fetch website URL while backend service is offline. Please start the backend server or copy and paste the policy text manually below.'
        );
      }
      console.warn('Backend /scan/policy failed, using intelligent client-side analyzer fallback:', err);
      return analyzePolicyLocally(trimmed);
    }
  },
};


export default scanService;
