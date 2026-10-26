# 📋 Phase 1 GitHub Issues: Core AI & Threat Detection Engines

> **Phase**: Phase 1 (Must-Have MVP)  
> **Backend Assignee**: Vaishnavi  
> **Frontend Assignee**: Kalyani  
> **Scope**: Strictly Phase 1 only (No components from other phases)

---

## 🚀 Issue 1: Backend Implementation (Assignee: @vaishnavi)

**Title**: `[Phase 1 - Backend] Core AI & Threat Detection Engines API (Gemini, Safe Browsing, Risk Scoring)`  
**Labels**: `backend`, `fastapi`, `phase-1`, `ai-engine`, `mvp`  
**Assignee**: Vaishnavi  
**Milestone**: Phase 1: Core AI & Threat Detection Engines  

### 📝 Description
Implement the core detection microservices and RESTful API endpoints for DataRaksha AI using FastAPI. This includes integrating Google Gemini AI for text analysis and PII extraction, Google Safe Browsing API v4 for link validation, and building the centralized Risk Scoring and Recommendation Engine.

---

### 🎯 Key Deliverables & Modules

#### 1. Module 1: Message & Email Checker Service (`POST /api/v1/scan/message`)
- [ ] Implement Gemini AI prompt blueprint for natural language threat analysis:
  - Detect phishing, urgency tactics, fake bank impersonation, and credential harvesting.
- [ ] Implement PII extraction (Regex + Entity detection):
  - Phone numbers, email addresses, plain-text passwords/PINs/OTPs, financial data (bank accounts, UPI IDs, credit/debit numbers).
- [ ] Request schema: `{"content": "<message text>"}`

#### 2. Module 2: Link & URL Safety Checker (`POST /api/v1/scan/link`)
- [ ] Pre-lookup sanitization & normalization:
  - Auto-prepend `https://` if protocol omitted.
  - Flag IP-based URLs, high subdomain depth, and suspicious homoglyphs.
  - Reject malformed URLs before API call.
- [ ] Google Safe Browsing API v4 integration:
  - Query `https://safebrowsing.googleapis.com/v4/threatMatches:find`.
  - Check for `MALWARE`, `SOCIAL_ENGINEERING`, `UNWANTED_SOFTWARE`, and `POTENTIALLY_HARMFUL_APPLICATION`.
- [ ] Request schema: `{"url": "<target url>"}`

#### 3. Module 3: Privacy Policy Simplifier (`POST /api/v1/scan/policy`)
- [ ] Implement Gemini AI policy analysis prompt:
  - Ingest dense legal text and generate an executive summary in plain language.
  - Extract and flag critical risk tags:
    - `Data Selling` (data brokers / ad partners)
    - `Location & Telemetry` (continuous background tracking)
    - `Retention Limits` (indefinite storage)
    - `Biometrics` (facial geometry, voice, fingerprints)
    - `Account Deletion Complexity`
- [ ] Request schema: `{"policy_text": "<policy content>"}`

#### 4. Module 4: Unified Risk Scoring & Recommendation Engine
- [ ] Aggregate raw signals into unified risk metrics:
  - **Low (0–39)**: Green rating; standard digital vigilance advice.
  - **Medium (40–69)**: Amber rating; caution and selective disclosure guidance.
  - **High (70–100)**: Crimson rating; immediate avoidance and credential change warnings.
- [ ] Generate actionable, non-technical safety recommendations.
- [ ] Append mandatory safety disclaimer to every scan:
  > *"No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online."*

#### 5. Validation Rules & HTTP Error Handling
| Condition | HTTP Status | Detail / Message |
| :--- | :--- | :--- |
| Empty input string or whitespace only | `400 Bad Request` | `"Please enter text or a URL to analyze."` |
| Invalid URL format | `422 Unprocessable Entity` | `"Please enter a valid web address (e.g., https://example.com)."` |
| Payload exceeding 20,000 characters | `413 Payload Too Large` | `"Payload exceeds maximum character limit of 20,000."` |
| External API timeout or failure | `503 Service Unavailable`| `"Analysis service is temporarily unavailable. Please try again shortly."` |
| Rate limit hit | `429 Too Many Requests` | `"Request limit reached. Please wait a moment."` |

---

### 📦 Unified Response Schema Contract
```json
{
  "scan_type": "message", // "message" | "link" | "policy"
  "risk_level": "High",   // "Low" | "Medium" | "High"
  "risk_score": 92,       // Integer 0 - 100
  "summary": "This message exhibits strong signs of a phishing scam attempting bank impersonation.",
  "detected_threats": [
    "Urgent pressure tactic",
    "Bank impersonation",
    "Suspicious URL included"
  ],
  "exposed_pii": [
    "Phone: +91-9876543210"
  ],
  "recommendations": [
    "Do not click on the link provided in the message.",
    "Never share OTPs, PINs, or banking credentials via message.",
    "Contact your bank directly using official customer care channels."
  ],
  "disclaimer": "No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online."
}
```

---

### ✅ Acceptance Criteria
- [ ] Unit tests written for message scanner, URL scanner, and policy scanner.
- [ ] Accurate classification of test phishing emails, malicious test URLs, and sample policy text.
- [ ] All specified HTTP status codes (400, 413, 422, 429, 503) triggered accurately under edge cases.
- [ ] Endpoints verified via Postman or FastAPI Swagger UI (`/docs`).

---
---

## 🎨 Issue 2: Frontend Implementation (Assignee: @kalyani) [CLOSED]

**Title**: `[Phase 1 - Frontend] Core Threat Scanner UI & Backend API Integration (ScannerTabs, InputCard, ResultCard)`  
**Labels**: `frontend`, `react`, `phase-1`, `ui/ux`, `mvp`  
**Assignee**: Kalyani  
**Status**: Closed (Completed)  
**Milestone**: Phase 1: Core AI & Threat Detection Engines  

### 📝 Description
Build and finalize the user interface and API integration for the three Phase 1 core scanners (Message/Email, Link/URL, and Privacy Policy) on the main scanning Dashboard. Connect React components directly to the Phase 1 backend endpoints developed by Vaishnavi, with responsive feedback, risk badge visualization, character limits, and error handling.

---

### 🎯 Key Deliverables & Modules

#### 1. Scanner Tabs & Input Component (`ScannerTabs`, `InputBox`)
- [x] Enable smooth switching between the 3 core scan types:
  1. **Message / Email** (Placeholder: Paste SMS, email, or chat message)
  2. **Link / URL** (Placeholder: Enter web address e.g., https://example.com)
  3. **Privacy Policy** (Placeholder: Paste terms of service or privacy policy text)
- [x] Implement live character counter with visual warning approaching 20,000 characters.
- [x] Implement pre-scan client-side validation:
  - Check for non-empty text.
  - Basic URL formatting check before submission on Link tab.
- [x] Provide one-click sample loader for testing each of the 3 scan types.

#### 2. Backend API Integration (`services/api.js`)
- [x] Replace temporary mock logic with actual HTTP calls to Phase 1 backend endpoints:
  - Message: `POST /api/v1/scan/message` with `{ "content": text }`
  - Link: `POST /api/v1/scan/link` with `{ "url": url }`
  - Policy: `POST /api/v1/scan/policy` with `{ "policy_text": text }`
- [x] Manage loading states: show animated spinner / scanning skeleton while API processes request.

#### 3. Risk Results Visualization (`ResultCard`)
- [x] Display Risk Level with color-coded badges and risk score meter:
  - 🟢 **Low Risk** (Score 0–39): Green badge (`#10B981`)
  - 🟡 **Medium Risk** (Score 40–69): Amber badge (`#F59E0B`)
  - 🔴 **High Risk** (Score 70–100): Crimson badge (`#EF4444`)
- [x] Plain-language summary banner.
- [x] **Detected Threats** chip list / tags.
- [x] **Exposed PII** breakdown section (highlighting sensitive tokens detected).
- [x] **Actionable Recommendations** numbered or bulleted list.
- [x] Prominent display of the **Mandatory Safety Disclaimer**:
  > *"No obvious risks were detected; however, this does not guarantee the content is completely safe. Always exercise caution when sharing sensitive information online."*

#### 4. Error Handling & Edge Case User Feedback
- [x] Display user-friendly banner/toast notifications for HTTP errors:
  - `400`: *"Please enter text or a URL to analyze."*
  - `422`: *"Please enter a valid web address (e.g., https://example.com)."*
  - `413`: *"Content exceeds the maximum limit of 20,000 characters."*
  - `503`: *"Threat analysis service is temporarily unavailable. Please try again shortly."*
  - `429`: *"Rate limit reached. Please wait a few moments before trying again."*
- [x] Graceful retry button if request fails.

---

### ✅ Acceptance Criteria
- [x] Seamless tab switching between Message, URL, and Policy scan modes.
- [x] Input field blocks submission and alerts when empty or exceeding 20,000 chars.
- [x] Correct API payloads dispatched based on the active tab.
- [x] Result card properly parses and renders risk score, badges, detected threats, PII, recommendations, and disclaimer.
- [x] Friendly UI error alerts shown for all backend HTTP error responses.
- [x] Fully responsive on mobile, tablet, and desktop viewports.
