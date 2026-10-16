# 📋 Phase 4 GitHub Issues: Responsive Frontend Application & UI/UX

> **Phase**: Phase 4 (Core User Experience)  
> **Backend Assignee**: Vaishnavi (@vaishnavi)  
> **Frontend Assignee**: Kalyani (@kalyani)  
> **Scope**: Complete UI/UX Experience, Micro-Animations, Mobile Responsiveness, API Formatting & Performance

---

## 🚀 Issue 1: Backend Implementation (Assignee: @vaishnavi)

**Title**: `[Phase 4 - Backend] API Performance Optimization, Response Payload Formatting & Frontend Integration Support`  
**Labels**: `backend`, `fastapi`, `phase-4`, `api-optimization`, `integration`  
**Assignee**: Vaishnavi  
**Milestone**: Phase 4: Responsive Frontend Application & UI/UX  

### 📝 Description
Optimize the FastAPI backend microservices and response payloads to seamlessly support the interactive Phase 4 frontend user experience. This includes harmonizing threat response schemas, enforcing character payload limits, adding URL normalization and input validation rules, and configuring rate limiting and CORS headers for smooth frontend integration.

---

### 🎯 Key Deliverables & Modules

#### 1. Module 1: Response Schema Harmonization for Frontend Visualizers
- [x] Ensure all 3 scan endpoints (`/api/v1/scan/message`, `/api/v1/scan/link`, `/api/v1/scan/policy`) return consistent fields expected by the frontend `ResultCard`:
  - `scan_type`: `message` | `link` | `policy`
  - `risk_level`: `Low` | `Medium` | `High`
  - `risk_score`: Integer (0–100)
  - `summary`: Plain-language executive summary (max 2 sentences)
  - `detected_threats`: Array of categorized threat string tags
  - `exposed_pii`: Array of extracted sensitive data tokens
  - `recommendations`: Actionable, non-technical safety steps
  - `disclaimer`: Mandatory digital safety disclaimer
- [x] Provide structured fallbacks if external AI or threat intelligence APIs fail or experience high latency.

#### 2. Module 2: Request Sanitization & Size Limit Enforcement
- [x] Enforce 20,000 character maximum limit across all text payloads:
  - Return `413 Payload Too Large` with clear error detail if character limit is exceeded.
- [x] URL input normalization on `/api/v1/scan/link`:
  - Automatically strip leading/trailing whitespace.
  - Auto-prepend `https://` if protocol is omitted.
  - Reject malformed or invalid URL syntax with `422 Unprocessable Entity` before calling Google Safe Browsing.

#### 3. Module 3: Rate Limiting & Quota Safeguards
- [x] Implement rate limiting to protect external Google Gemini and Safe Browsing API quotas:
  - Add request throttling per IP / user token.
  - Return standard `429 Too Many Requests` status code with `Retry-After` header when rate limits are exceeded.

#### 4. Module 4: CORS Configuration & API Documentation
- [x] Verify CORS origins whitelist supports frontend development (`http://localhost:5173`, `http://localhost:3000`) and deployment hosts.
- [x] Ensure FastAPI Swagger UI (`/docs`) and ReDoc (`/redoc`) contain up-to-date schema examples matching all Phase 4 endpoints.

---

### ✅ Acceptance Criteria (Backend)
- [x] All scan endpoints return consistent JSON payloads matching the frontend `ResultCard` schema contract.
- [x] Character limit validations (413) and URL syntax validations (422) return user-friendly error messages.
- [x] Rate limiting triggers `429 Too Many Requests` gracefully under high-frequency requests.
- [x] CORS headers allow frontend requests without browser security blocks.
- [x] Swagger API documentation at `/docs` accurately reflects all request and response schemas.

---
---

## 🎨 Issue 2: Frontend Implementation (Assignee: @kalyani)

**Title**: `[Phase 4 - Frontend] Core UI/UX Experience, Micro-Animations, Mobile Responsiveness & Scanner Workflow Polish`  
**Labels**: `frontend`, `react`, `phase-4`, `ui/ux`, `mobile-responsive`, `accessibility`  
**Assignee**: Kalyani  
**Milestone**: Phase 4: Responsive Frontend Application & UI/UX  

### 📝 Description
Polish and complete the interactive user experience for DataRaksha AI following modern cybersecurity glassmorphism design principles. This includes enhancing scanner workflows with micro-animations and loading feedback, perfecting the Threat Report Card with actionable quick-links, ensuring mobile responsiveness down to 375px viewports, and verifying accessibility (WCAG AA) standards.

---

### 🎯 Key Deliverables & Modules

#### 1. Module 1: Interactive Scanner Hub Polish (`Dashboard.jsx`, `ScannerTabs.jsx`, `InputBox.jsx`)
- [ ] **Tab Switching & Context Preservation**:
  - Smooth animated transitions between Message, Link, and Policy modes.
  - Preserve unsubmitted input text when switching between scan tabs.
- [ ] **Dynamic Input Controls**:
  - Contextual placeholders, icons, and helper hints per tab.
  - Live character counter with visual warning color shifts approaching 20,000 characters.
  - One-click "Clear" button and quick scenario preset chips.
- [ ] **Scan Execution & Micro-Animations**:
  - Animated cyber-shield scanning loader during analysis processing.
  - Disable input and show animated progress pulse to prevent duplicate submissions.

#### 2. Module 2: Threat Report Card Polish (`ResultCard.jsx`)
- [ ] **Visual Threat Gauge**:
  - Semi-circular meter or progress bar animating from 0 to the calculated risk score.
  - Pulsating risk badges (🟢 Low Risk, 🟡 Medium Risk, 🔴 High Risk).
- [ ] **Categorized Threat & PII Tags**:
  - Visual tag chips for detected threats and exposed sensitive information.
- [ ] **Actionable Safety Advice**:
  - Numbered checklist with copyable advice points.
- [ ] **Cross-Module Workflows**:
  - 📋 **Copy Full Report** action with tooltip confirmation.
  - 📝 **"Draft Deletion Notice"** action button that seamlessly opens the Data Request Letter Studio pre-filling the detected entity or company name!

#### 3. Module 3: Mobile Responsiveness & Navigation Drawer (`Navbar.jsx`, `App.css`)
- [ ] **Mobile Navigation Drawer**:
  - Hamburger menu toggle on viewports narrower than `768px`.
  - Accessible touch targets (minimum `44x44px`) for buttons, links, and tabs.
- [ ] **Fluid Single-Column Layouts**:
  - Seamless layout collapse on mobile devices (tested down to `375px` width).
  - Eliminate horizontal overflow and ensure all cards scale smoothly.

#### 4. Module 4: Accessibility (a11y) & Visual Polish
- [ ] Verify color contrast ratios adhere to WCAG AA standards against dark glass surfaces.
- [ ] Add `aria-label`, `role`, and focus rings for keyboard navigation.
- [ ] Smooth hover glows and micro-transitions across buttons, badges, and cards.

---

### ✅ Acceptance Criteria (Frontend)
- [ ] Seamless tab transitions and micro-animations on all scanning interactions.
- [ ] Live character counter warns users approaching limits and blocks empty inputs.
- [ ] Result card displays animated score meter, badges, threats, PII tags, and disclaimer.
- [ ] Quick-action button on Result Card pre-fills the Letter Generator with detected entity name.
- [ ] Tested and confirmed zero horizontal scrolling or clipping on mobile viewports (375px–414px).
- [ ] Full keyboard accessibility with visible focus indicators.
