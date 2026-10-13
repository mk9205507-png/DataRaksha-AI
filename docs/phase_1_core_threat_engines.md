# 🧠 Phase 1: Core AI & Threat Detection Engines (Must-Have MVP)

## 📌 Phase Summary
Phase 1 implements the core detection logic that powers DataRaksha AI. It integrates Google Gemini AI for natural language analysis and PII extraction, Google Safe Browsing API for real-time URL threat intelligence, and a centralized Risk Scoring Engine that translates raw metrics into Low, Medium, or High risk classifications.

---

## 🎯 Objectives & Goals
1. Develop the **Message & Email Checker** to detect phishing, social engineering, and sensitive PII exposures.
2. Develop the **Link & URL Checker** using Google Safe Browsing API v4.
3. Develop the **Privacy Policy Simplifier** using Google Gemini AI to highlight critical concerns.
4. Build a unified **Risk Scoring & Recommendation Engine**.
5. Implement rigorous validation rules and edge case handlers.

---

## 🔍 Module 1: Message & Email Checker

### Functional Capabilities
- **Phishing & Fraud Detection:** Evaluates incoming message content for urgency tactics (e.g., *"account suspended in 24 hours"*), fake bank impersonation, lottery/crypto scams, and credential harvesting cues.
- **Personally Identifiable Information (PII) Detection:**
  - Phone numbers (Regex + contextual entity recognition).
  - Email addresses.
  - Plain-text passwords, PINs, OTP patterns.
  - Financial data: Credit/debit card numbers, UPI IDs, bank account sequences.
- **Output:** Flagged threat categories, list of exposed PII items, risk rating, and actionable instructions.

### Gemini Prompt Blueprint
```text
System Prompt:
You are an expert cybersecurity and privacy analyst for DataRaksha AI.
Analyze the user-submitted text/email and return a strict JSON response.
Do NOT store or retain any personal information.
Identify:
1. Threat indicators (phishing, impersonation, scam, urgency, credential harvesting).
2. PII exposed (phone, email, password, banking tokens).
3. Risk level: Low, Medium, or High.
4. Concise explanation in plain language (no technical jargon).
5. Specific, actionable safety recommendations.
6. Cautious disclaimer if no explicit risks are detected.
```

---

## 🔗 Module 2: Link & URL Safety Checker

### Functional Capabilities
- **Google Safe Browsing API Integration:**
  - Queries Google Safe Browsing v4 endpoint (`https://safebrowsing.googleapis.com/v4/threatMatches:find`).
  - Checks for: `MALWARE`, `SOCIAL_ENGINEERING` (phishing), `UNWANTED_SOFTWARE`, and `POTENTIALLY_HARMFUL_APPLICATION`.
- **Pre-Lookup Sanity & Sanitization:**
  - Normalizes URLs (prepends `https://` if protocol omitted).
  - Flags suspicious patterns (IP-based URLs, excessive subdomain depth, known homoglyph/typosquatting attacks).
  - Rejects malformed strings before triggering external API quota.

---

## 📜 Module 3: Privacy Policy Simplifier

### Functional Capabilities
- **Legal Jargon Translation:**
  - Ingests lengthy legal policies and generates an executive summary understandable by non-technical users.
- **Critical Risk Tags:**
  - **Data Selling:** Sharing data with third-party data brokers or advertisers.
  - **Location & Telemetry:** Continuous background location tracking.
  - **Retention Limits:** Infinite or ambiguous data retention schedules.
  - **Biometrics:** Collection of facial geometry, fingerprint, or voice recordings.
  - **Account Deletion Complexity:** Buried or non-existent account deletion procedures.

---

## 📊 Module 4: Unified Risk Scoring & Recommendation Engine

### Risk Rating Algorithm
The engine synthesizes findings into three clear levels:

| Risk Rating | Criteria & Triggers | Recommended UI Indicator | Default User Guidance |
| :--- | :--- | :--- | :--- |
| **Low** | No known threats detected; minimal standard telemetry; no sensitive credentials exposed. | 🟢 Green Badge | Content appears safe, but maintain standard digital vigilance. |
| **Medium** | General tracking enabled; marketing data shared; moderate PII present (e.g., email/phone in text). | 🟡 Amber Badge | Exercise caution. Avoid submitting sensitive passwords or financial details. |
| **High** | Phishing detected; malicious domain match; credentials/passwords exposed; aggressive data brokering. | 🔴 Crimson Badge | **Do not click link or interact.** Change passwords immediately if credentials were shared. |

### Mandatory Safety Disclaimer
Every response must include:
> *"No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online."*

---

## ⚠️ Edge Cases & Input Validation Matrix

| Edge Case | Expected System Behavior | HTTP Status / Error Code |
| :--- | :--- | :--- |
| **Empty Input** | Reject request; prompt user: *"Please enter text or a URL to analyze."* | `400 Bad Request` |
| **Invalid URL** | Reject input; prompt user: *"Please enter a valid web address (e.g., https://example.com)."* | `422 Unprocessable Entity` |
| **Payload Too Large** | Reject input exceeding 20,000 characters; display max character limit. | `413 Payload Too Large` |
| **External API Outage** | Catch timeout/error gracefully; notify: *"Analysis service is temporarily unavailable. Please try again shortly."* | `503 Service Unavailable` |
| **Rate Limit Exceeded** | Throttle requests per IP/user; advise: *"Request limit reached. Please wait a moment."* | `429 Too Many Requests` |

---

## 🔌 API Endpoint Specifications

### 1. Scan Message / Email
- **Endpoint:** `POST /api/v1/scan/message`
- **Request Body:**
  ```json
  {
    "content": "Urgent: Your bank account will be blocked today! Click here to update: http://fake-bank-auth.com"
  }
  ```
- **Response Body:**
  ```json
  {
    "scan_type": "message",
    "risk_level": "High",
    "risk_score": 92,
    "summary": "This message exhibits strong signs of a phishing scam attempting bank impersonation.",
    "detected_threats": ["Urgent pressure tactic", "Bank impersonation", "Suspicious URL included"],
    "exposed_pii": [],
    "recommendations": [
      "Do not click on the link provided in the message.",
      "Never share OTPs, PINs, or banking credentials via message.",
      "Contact your bank directly using official customer care channels."
    ],
    "disclaimer": "Analysis indicates high risk. Never disclose private details."
  }
  ```

### 2. Scan URL / Link
- **Endpoint:** `POST /api/v1/scan/link`
- **Request Body:** `{"url": "http://suspicious-download.xyz"}`

### 3. Scan Privacy Policy
- **Endpoint:** `POST /api/v1/scan/policy`
- **Request Body:** `{"policy_text": "We reserve the right to sell your location data to third-party ad brokers..."}`

---

## ✅ Phase 1 Acceptance Criteria
- [ ] Message scan accurately flags sample phishing emails and credit card/password strings.
- [ ] Safe Browsing service correctly identifies test malicious domains (e.g. Google test URLs).
- [ ] Policy simplifier produces readable bullet-point summaries and flags data-broker clauses.
- [ ] All edge case scenarios (empty, invalid URL, oversized input, API downtime) return user-friendly messages.
