# 🎨 Phase 4: Responsive React Frontend Application & UI/UX

## 📌 Phase Summary
Phase 4 builds the user interface for DataRaksha AI. Following modern web standards, the frontend will feature a cybersecurity-inspired dark theme, glassmorphic card layouts, micro-animations, and an intuitive workflow across desktop and mobile devices.

---

## 🎯 Objectives & Goals
1. Implement a unified Design System with CSS variables for color, typography, elevation, and responsiveness.
2. Build the **Interactive Scanner Hub** supporting all three input modes (Message, Link, Policy).
3. Create the **Threat Report Card** with visual risk meters, detected PII chips, and safety advice.
4. Build the **Data Request Letter Studio** with live draft editing and export controls.
5. Build the **User History Dashboard** and **Admin Metrics Dashboard**.
6. Ensure mobile screen adaptability and cross-browser reliability.

---

## 🎨 Design System & Aesthetic Guidelines

### 1. Color Palette Tokens
```css
:root {
  /* Surface & Background */
  --bg-primary: #0b0f19;       /* Deep slate/navy dark background */
  --bg-secondary: #111827;     /* Elevated panel background */
  --bg-tertiary: #1f2937;      /* Hover & active card fill */
  --glass-surface: rgba(17, 24, 39, 0.75);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* Primary Accent & Brand */
  --accent-cyan: #06b6d4;      /* Cyber shield primary */
  --accent-indigo: #6366f1;    /* Vibrant gradient companion */

  /* Threat Severity Indicators */
  --risk-low: #10b981;         /* Emerald Green (Safe / Low Risk) */
  --risk-medium: #f59e0b;      /* Warm Amber (Caution / Medium Risk) */
  --risk-high: #ef4444;        /* Crimson Red (Severe / High Risk) */

  /* Typography Colors */
  --text-main: #f9fafb;
  --text-muted: #9ca3af;
  --text-subtle: #6b7280;
}
```

### 2. Typography & Atmosphere
- **Font Stack:** Modern sans-serif (e.g. `Inter`, `Plus Jakarta Sans`, system-ui).
- **Styling Philosophy:** Clean typography hierarchy, subtle glowing borders on hover, backdrop blur effects, zero clutter.

---

## 🖥️ Screen & Component Architecture

### 1. Navigation Bar (`Navbar.jsx`)
- Brand logo: Shield icon with animated glow + **DataRaksha AI**.
- Navigation links: `Dashboard`, `Letter Generator`, `My History`, `Admin` (visible only for admin accounts).
- Auth state button: Shows logged-in user email badge, or `Sign In` / `Sign Up` buttons.

### 2. Main Scanner Hub (`Dashboard.jsx` & `ScannerTabs.jsx`)
- **Mode Switcher Tabs:**
  - `[ ✉️ Message / Email Checker ]`
  - `[ 🔗 Web Link Checker ]`
  - `[ 📜 Privacy Policy Simplifier ]`
- **Dynamic Input Box:**
  - Adapts placeholder and hints based on selected tab.
  - Character counter (e.g. `142 / 20,000 characters`).
  - Clear button and sample preset buttons (e.g. *"Try sample phishing text"*).
  - Prominent CTA: `[ 🛡️ Analyze Content ]` with animated loading spinner.

### 3. Interactive Threat Report Card (`ResultCard.jsx`)
Rendered immediately upon analysis completion:
- **Risk Level Badge:** Large visual indicator (e.g. `HIGH RISK` in crimson badge with pulsating shield icon).
- **Risk Score Meter:** Semi-circular gauge or percentage bar (e.g. `Score: 88/100`).
- **Detected PII & Threats:** Tag pills (e.g., `⚠️ Phone Number Detected`, `⚠️ Phishing Cue: Urgent Threat`, `⚠️ Third-Party Broker`).
- **Plain-Language Summary:** Concise, 2-sentence explanation of why the score was assigned.
- **Actionable Safety Recommendations:** Numbered checklist with copyable advice (e.g. *"Do not click links"*, *"Change password immediately"*).
- **Disclaimers Banner:** Always visible disclaimer: *"No obvious risks found does not guarantee 100% safety."*
- **Action Buttons:** `[ 📋 Copy Report ]`, `[ 📝 Draft Deletion Letter ]`.

### 4. Data Request Letter Studio (`LetterGenerator.jsx`)
- **Two-Column Responsive Studio:**
  - **Left Column (Inputs):** Select letter type (`Access` vs `Deletion`), recipient company name, account email/ID, target data scope.
  - **Right Column (Interactive Preview):** Live editable markdown preview box.
  - **Toolbar:** `[ 📋 Copy to Clipboard ]`, `[ 📥 Download as .txt ]`, `[ 💾 Save to My Letters ]`.

### 5. Scan History Dashboard (`History.jsx`)
- Filter pills: `All`, `High Risk`, `Medium Risk`, `Low Risk`, `Messages`, `Links`, `Policies`.
- Responsive timeline/cards displaying:
  - Date and time of scan.
  - Scan type icon.
  - Truncated content preview.
  - Color-coded risk badge.
  - `[ View Details ]` button (re-opens full report modal) and `[ Delete ]` button.

### 6. Admin Analytics View (`AdminDashboard.jsx`)
- Metric stat cards: Total Scans, Today's Scans, High Risk Incidents.
- CSS-rendered risk distribution breakdown bar.
- Service status indicators (Gemini AI: Online, Safe Browsing: Online, Supabase: Connected).

---

## 📱 Mobile Responsiveness & Accessibility
- Grid layouts collapse gracefully into single-column layouts below `768px` viewport width.
- Touch-friendly tap targets (minimum `44x44px` for buttons and tabs).
- Full screen contrast meets WCAG AA standards.

---

## ✅ Phase 4 Acceptance Criteria
- [ ] User can switch between Message, Link, and Policy tabs without page reloads.
- [ ] Input validations trigger properly (e.g., warning if field is empty or URL is invalid).
- [ ] Scanning triggers an active animated loader and renders the result card within seconds.
- [ ] Threat Report Card renders colors correctly matching Low, Medium, and High ratings.
- [ ] Letter generator live preview updates dynamically and copy-to-clipboard works cleanly.
- [ ] Entire interface displays without horizontal overflow on mobile screens (tested at 375px width).
