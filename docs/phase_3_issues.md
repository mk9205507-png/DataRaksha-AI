# 📋 Phase 3 GitHub Issues: Data Request Letters, Analysis History & Admin Module

> **Phase**: Phase 3 (Should-Have Features)  
> **Backend Assignee**: Vaishnavi (@vaishnavi)  
> **Frontend Assignee**: Kalyani (@kalyani)  
> **Scope**: Data Request Letters, Scan History & Audit Trail, Admin Analytics Dashboard

---

## 🚀 Issue 1: Backend Implementation (Assignee: @vaishnavi)

**Title**: `[Phase 3 - Backend] Data Request Letter Generator, Scan History Persistence & Admin Overview APIs`  
**Labels**: `backend`, `fastapi`, `supabase`, `phase-3`, `audit-trail`, `admin`  
**Assignee**: Vaishnavi  
**Milestone**: Phase 3: Data Request Letters, Analysis History & Admin Module  

### 📝 Description
Implement the core backend endpoints and database persistence layers for Phase 3 of DataRaksha AI. This includes:
1. Legal Data Request Letter Generator supporting DPDP Act (India) and GDPR (EU) frameworks.
2. Authenticated user scan history audit trail with privacy-preserving input sanitization, filtering, and deletion endpoints.
3. System Administrator aggregated threat metrics and external engine health inspection endpoints with strict RBAC enforcement.

---

### 🎯 Key Deliverables & Modules

#### 1. Module 1: Data Request Letter Generation Service (`POST /api/v1/letters/generate`)
- [ ] Implement legal template generation supporting three core notice types:
  - `access`: Formal Subject Access Request (SAR) inquiring what personal data is processed, collection purposes, and third parties/brokers shared with.
  - `deletion`: Statutory erasure notice demanding complete and permanent removal of personal data, telemetry, and tracking records.
  - `consent_withdrawal`: Revocation of marketing, profiling, and behavioural tracking consent.
- [ ] Support both statutory privacy frameworks:
  - **DPDP Act (India 2023)**: Sections on right to information, right to correction/erasure, and grievance redressal.
  - **GDPR (EU)**: Article 15 (Right of Access), Article 17 (Right to Erasure / Right to be Forgotten), and Article 7(3) (Withdrawal of Consent).
- [ ] Input parameters:
  - `company_name`: Target organization name
  - `letter_type`: `access` | `deletion` | `consent_withdrawal`
  - `user_full_name`: User's full legal name
  - `user_email`: Registered email address
  - `account_identifier` / `account_id`: (Optional) User/customer ID or phone
  - `framework`: `DPDP` | `GDPR`
  - `custom_notes`: (Optional) User notes or specific data categories requested
- [ ] If authenticated (`user_id` present via JWT), asynchronously persist letter metadata to Supabase `letters` table via `BackgroundTasks`.
- [ ] Request schema:
  ```json
  {
    "company_name": "Acme Social Inc.",
    "letter_type": "deletion",
    "user_full_name": "Aarav Sharma",
    "user_email": "aarav@example.com",
    "account_identifier": "usr_994821",
    "framework": "DPDP",
    "custom_notes": "Please also remove telemetry and marketing profile records."
  }
  ```
- [ ] Response schema:
  ```json
  {
    "id": "e44c2194-4fa9-43c2-b7e6-6218d6ca7120",
    "letter_type": "deletion",
    "framework": "DPDP",
    "company_name": "Acme Social Inc.",
    "subject": "Formal Request for Permanent Erasure of Personal Data under DPDP Act 2023 - Aarav Sharma",
    "content": "Date: October 16, 2026\nTo: Data Protection Officer, Acme Social Inc....",
    "recipient_email": "privacy@acmesocial.com",
    "created_at": "2026-10-16T10:30:00Z"
  }
  ```

#### 2. Module 2: Analysis History & User Audit Trail (`/api/v1/history`)
- [ ] **Privacy-Preserving Ingestion**: When scans are saved for authenticated users:
  - Never store raw unmasked sensitive input.
  - Generate a sanitized `input_preview` snippet (max 80 chars, masked phone numbers/emails/OTPs).
- [ ] **List History (`GET /api/v1/history`)**:
  - Requires valid JWT bearer token (`get_current_user_id`).
  - Query parameters:
    - `page` (default: 1)
    - `limit` (default: 10, max: 50)
    - `scan_type` (optional filter: `message` | `link` | `policy`)
    - `risk_level` (optional filter: `Low` | `Medium` | `High`)
  - Enforce Supabase Row-Level Security (RLS) / query filtering scoped strictly to authenticated user's `user_id`.
  - Response schema:
    ```json
    {
      "total_records": 24,
      "page": 1,
      "limit": 10,
      "records": [
        {
          "id": "6d3cbf72-4b21-4f11-9a72-10f8520ce4b1",
          "scan_type": "message",
          "input_preview": "URGENT: Your bank account has been suspended... [MASKED]",
          "risk_level": "High",
          "risk_score": 92,
          "summary": "Phishing scam attempting bank impersonation.",
          "created_at": "2026-10-16T09:15:00Z"
        }
      ]
    }
    ```
- [ ] **Delete Single Record (`DELETE /api/v1/history/{record_id}`)**:
  - Deletes specific scan record belonging to the authenticated user.
  - Return `200 OK` with confirmation or `404 Not Found` if record does not belong to user.
- [ ] **Clear All History (`DELETE /api/v1/history`)**:
  - Wipes all scan history entries for the authenticated user.
  - Return `200 OK` with count of deleted records.

#### 3. Module 3: Administrator Dashboard & Metrics (`GET /api/v1/admin/overview`)
- [ ] **Strict Role-Based Authorization**:
  - Restrict access using `require_admin` dependency (checks user role == `'admin'`).
  - Return `403 Forbidden` if requested by standard user.
- [ ] **Zero User PII Aggregations**:
  - `total_scans`: Total scans processed across all time.
  - `scans_today`: Total scans processed today (UTC).
  - `risk_breakdown`: Total count of `low`, `medium`, and `high` risk evaluations.
  - `scans_by_type`: Total count of `message`, `link`, and `policy` evaluations.
  - `system_status`:
    - `gemini_api`: Check operational latency / connectivity.
    - `safe_browsing_api`: Safe Browsing lookup health.
    - `supabase_db`: Database connectivity and response check.
- [ ] Response schema:
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
      "gemini_api": "Operational (Latency 340ms)",
      "safe_browsing_api": "Operational (Quota healthy)",
      "supabase_db": "Healthy (RLS Enforced)"
    }
  }
  ```

---

### ✅ Acceptance Criteria (Backend)
- [x] `POST /api/v1/letters/generate` formats legally accurate letters for both DPDP and GDPR.
- [x] Background task saves letter records to Supabase when user is authenticated.
- [x] `GET /api/v1/history` supports pagination, `scan_type` filter, and `risk_level` filter.
- [x] Individual delete and bulk clear history endpoints securely delete records without cross-user leakage.
- [x] `GET /api/v1/admin/overview` is protected by `require_admin` role check and returns complete aggregated metrics.
- [x] Unit and integration tests pass for all Phase 3 endpoints.

---
---

## 🎨 Issue 2: Frontend Implementation (Assignee: @kalyani)

**Title**: `[Phase 3 - Frontend] UI/UX Integration for Data Request Letters, Audit History & Admin Dashboard`  
**Labels**: `frontend`, `react`, `phase-3`, `ui/ux`, `history`, `admin`  
**Assignee**: Kalyani  
**Milestone**: Phase 3: Data Request Letters, Analysis History & Admin Module  

### 📝 Description
Complete and polish the user interface and backend API integration for the three Phase 3 modules:
1. **Data Request Letter Generator**: Form controls, legal framework toggle, editable preview, and copy/download capabilities.
2. **Analysis History & Audit Trail**: Paginated list/table, type & risk filters, record deletion, and clear-history controls.
3. **Administrator Dashboard**: Elevated admin view with KPI summary cards, threat distribution visualizers, and service health indicators.

---

### 🎯 Key Deliverables & Modules

#### 1. Module 1: Data Request Letter Generator (`pages/LetterGenerator.jsx`, `components/letters/`)
- [ ] **Letter Form (`LetterForm.jsx`)**:
  - Letter type selector dropdown / radio cards:
    - 🗑️ Data Erasure / Deletion Request
    - 🔍 Subject Access Request (SAR)
    - 🚫 Consent Revocation Notice
  - Legal framework selector toggle:
    - 🇮🇳 **DPDP Act 2023** (Digital Personal Data Protection Act - India)
    - 🇪🇺 **GDPR** (General Data Protection Regulation - EU)
  - Inputs for:
    - Target Company / Organization Name (Required)
    - User Full Name (Required, auto-fills from auth profile if logged in)
    - Registered Email Address (Required, auto-fills from auth profile)
    - Account Identifier / Customer ID / Phone (Optional)
    - Specific Data Categories / Custom Notes (Optional)
  - Pre-fill presets for popular organizations (e.g., Social Media, E-commerce, Telecom).
  - Client-side validation with helpful error alerts.
- [ ] **Letter Preview & Export (`LetterPreview.jsx`)**:
  - Live preview box with markdown formatting or clean preformatted typography.
  - Interactive edit mode: User can customize or fine-tune generated letter text in-place.
  - **Export Action Toolbar**:
    - 📋 **Copy to Clipboard** button with success tooltip feedback ("Copied!").
    - 💾 **Download as .txt** file (`Data_Erasure_Request_<Company>.txt`).
    - 📄 **Download as .md** file (`Data_Erasure_Request_<Company>.md`).
    - ✉️ **Open in Email Client** (`mailto:` link prefilling Subject and Body).
- [ ] **API Connection**:
  - Connect generation form to `POST /api/v1/letters/generate`.
  - Display loading skeleton / spinner during generation.
  - Graceful fallback to client-side template generator if API is offline.

#### 2. Module 2: Threat Assessment History (`pages/History.jsx`, `components/history/`)
- [ ] **History Table & Cards (`HistoryTable.jsx`, `HistoryCard.jsx`)**:
  - Connect to `GET /api/v1/history` using authenticated JWT bearer token.
  - Display scan records with:
    - Scan type icon badge (Message, Link, Policy).
    - Sanitized preview snippet with sensitive tokens masked.
    - Color-coded risk badge (🟢 Low, 🟡 Medium, 🔴 High) with risk score.
    - AI threat summary snippet.
    - Relative timestamp (e.g., "2 hours ago", "Yesterday").
- [ ] **Filtering & Search**:
  - Scan Type dropdown: `All Types`, `Message Scans`, `Link Scans`, `Policy Scans`.
  - Risk Level dropdown: `All Risk Levels`, `Low Risk`, `Medium Risk`, `High Risk`.
  - Dynamic client-side / server-side filter updates without page reload.
- [ ] **User Control & Deletion**:
  - Individual "Delete Record" button with quick removal confirmation.
  - "Clear All History" button triggering a safety confirmation dialog.
  - Immediate optimistic UI update + backend synchronization (`DELETE /api/v1/history/{id}` & `DELETE /api/v1/history`).
- [ ] **Empty State & Authentication Guard**:
  - Beautiful empty state when no scan history exists ("No scan history records found").
  - Prompt guest users to sign in to access persistent history saving.

#### 3. Module 3: Admin Overview Dashboard (`pages/AdminDashboard.jsx`)
- [ ] **Role Guard & Access Control**:
  - Check user role via `AuthContext`. If user is not an `admin`, show `403 Access Denied` alert banner with redirect button to `/dashboard`.
- [ ] **KPI Stat Cards**:
  - Total Scans Processed (with formatted number separator).
  - Scans Processed Today (with daily traffic highlight).
  - Active Threat Rate percentage.
- [ ] **Visual Breakdown Displays**:
  - **Risk Distribution Visualizer**: Color-coded progress / ratio bars for Low, Medium, and High risk threats.
  - **Scan Type Breakdown**: Proportion of Message vs Link vs Privacy Policy evaluations.
- [ ] **Service & Engine Health Monitor**:
  - Gemini AI Engine status pill & latency check.
  - Google Safe Browsing API status pill & quota check.
  - Supabase Database status pill & RLS verification indicator.
- [ ] Connect directly to backend endpoint `GET /api/v1/admin/overview`.

---

### ✅ Acceptance Criteria (Frontend)
- [x] User can customize and generate DPDP and GDPR legal letters with live editable preview.
- [x] One-click copy, download (.txt / .md), and mailto actions work seamlessly.
- [x] History page fetches authenticated user scan logs and updates upon filtering.
- [x] Individual deletion and clear-all actions remove items from UI and sync with backend.
- [x] Admin dashboard renders KPI cards, threat distribution visualizers, and health monitors.
- [x] Admin route properly restricts unauthorized non-admin users.
- [x] Responsive design across desktop, tablet, and mobile with consistent Dark Glassmorphism aesthetics.
