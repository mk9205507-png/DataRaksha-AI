# 📜 Phase 3: Data Request Letters, Analysis History & Admin Module (Should-Have Features)

## 📌 Phase Summary
Phase 3 develops the should-have features from the DataRaksha AI requirement document: the automated **Data Request Letter Generator** (for statutory data rights under DPDP / GDPR), the **Analysis History & Audit Trail** persistence module, and the **Administrator Metrics** dashboard backend.

---

## 🎯 Objectives & Goals
1. Implement the legal letter generator allowing users to request data access or permanent deletion.
2. Build history persistence, filtering, and deletion endpoints for authenticated users.
3. Build administrative reporting endpoints to track overall system usage and threat trends.

---

## 📝 Module 1: Data Request Letter Generator

### Functional Capabilities
- **Legal Alignment:** Pre-formulated templates based on modern privacy frameworks:
  - **Data Access Request:** Inquiring what personal data a company holds, why it is processed, and third parties it has been shared with.
  - **Data Erasure / Deletion Request:** Requesting complete and permanent removal of personal data and tracking records.
  - **Consent Revocation:** Withdrawing prior consent for marketing and behavioral profiling.
- **Customizable Variables:**
  - Company/Organization Name
  - User's Full Name & Contact Details (Email/Phone)
  - Account Number / Username / Registered ID
  - Specific Categories of Data (e.g. browsing history, location records, purchase data)
  - Reference Legal Framework (e.g. *Digital Personal Data Protection Act (DPDP)* / *GDPR*)
- **Export Options:**
  - In-browser live editable markdown/text draft.
  - One-click copy-to-clipboard.
  - Download as `.txt` or `.md`.

### Letter API Specification
- **Endpoint:** `POST /api/v1/letters/generate`
- **Request Body:**
  ```json
  {
    "letter_type": "deletion",
    "company_name": "Acme Social Inc.",
    "user_name": "Aarav Sharma",
    "user_email": "aarav@example.com",
    "account_identifier": "usr_994821",
    "framework": "DPDP",
    "custom_notes": "Please also remove all telemetry and biometric records."
  }
  ```
- **Response Body:**
  ```json
  {
    "id": "e44c2194-4fa9-43c2-b7e6-6218d6ca7120",
    "subject": "Formal Data Erasure Request under the DPDP Act - Aarav Sharma",
    "body": "To Data Protection Officer, Acme Social Inc.,\n\nI am writing to formally request the permanent deletion and erasure of all personal data associated with my account...",
    "created_at": "2026-10-13T10:30:00Z"
  }
  ```

---

## 🕒 Module 2: Analysis History & User Audit Trail

### Functional Capabilities
- **Persistence:** Automatically saves scan results when authenticated users perform scans.
- **Privacy Sanitization:** Avoids saving raw full texts. Saves a truncated, masked snippet (e.g., *"Dear Customer, your ac... [MASKED]"*).
- **Filtering & Search:**
  - Filter by `scan_type`: `message`, `link`, `policy`.
  - Filter by `risk_level`: `Low`, `Medium`, `High`.
  - Sort by date (newest first).
- **User Control:** Users can delete individual scan entries or clear their entire history at will.

### History API Specifications
1. **List User History:**
   - **Endpoint:** `GET /api/v1/history?page=1&limit=10&scan_type=message&risk_level=High`
   - **Headers:** `Authorization: Bearer <token>`
   - **Response Body:**
     ```json
     {
       "total_records": 12,
       "page": 1,
       "limit": 10,
       "records": [
         {
           "id": "6d3cbf72-4b21-4f11-9a72-10f8520ce4b1",
           "scan_type": "message",
           "input_preview": "Urgent: Your bank account will be blocked...",
           "risk_level": "High",
           "risk_score": 92,
           "summary": "Phishing scam attempting bank impersonation.",
           "created_at": "2026-10-13T09:15:00Z"
         }
       ]
     }
     ```
2. **Delete Single Record:**
   - **Endpoint:** `DELETE /api/v1/history/{record_id}`
3. **Clear All History:**
   - **Endpoint:** `DELETE /api/v1/history`

---

## 📊 Module 3: Administrator Dashboard & Metrics

### Functional Capabilities
- **Aggregated Analytics (Zero User Data Exposure):**
  - Total scans processed across all time / today.
  - Risk breakdown (Percentage of High vs Medium vs Low threats).
  - Most common threat categories detected (e.g. Phishing vs Data Broker Sharing).
  - External API health status (Gemini API latency, Safe Browsing quota consumption).

### Admin API Specification
- **Endpoint:** `GET /api/v1/admin/overview`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Response Body:**
  ```json
  {
    "total_scans": 1420,
    "scans_today": 84,
    "risk_breakdown": {
      "low": 580,
      "medium": 520,
      "high": 320
    },
    "scans_by_type": {
      "message": 810,
      "link": 430,
      "policy": 180
    },
    "system_status": {
      "gemini_api": "healthy",
      "safe_browsing_api": "healthy",
      "supabase_db": "healthy"
    }
  }
  ```

---

## ✅ Phase 3 Acceptance Criteria
- [x] Users can generate both Data Access and Deletion request letters with custom parameters.
- [x] Generated letters can be retrieved, edited, and copied to the clipboard.
- [x] Authenticated scans appear in the user's history in real-time.
- [x] Users can filter their history by scan type and risk severity, and delete entries.
- [x] Admin overview endpoint computes accurate aggregates without exposing private user content.
