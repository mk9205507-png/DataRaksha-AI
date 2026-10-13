# 🛡️ DataRaksha AI — Project Phases Index

Welcome to the **DataRaksha AI** implementation documentation. This directory contains the complete phased roadmap to build the entire AI-Powered Privacy & Digital Risk Protection System based on the **October 2026 Requirement Document**.

Each phase is documented in a dedicated markdown file with technical specifications, architecture designs, deliverables, and acceptance criteria.

---

## 📑 Phased Roadmap Breakdown

| Phase File | Phase Title | Focus Area | Priority |
| :--- | :--- | :--- | :--- |
| [Phase 0](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_0_setup_and_architecture.md) | **Project Setup, Architecture & Database** | Monorepo structure, environment configs, Supabase PostgreSQL schema, RLS policies | Foundational |
| [Phase 1](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_1_core_threat_engines.md) | **Core AI & Threat Detection Engines** | Message/Email checker, Link checker, Privacy policy simplifier, Risk scoring engine | Must-Have (MVP) |
| [Phase 2](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_2_auth_and_user_management.md) | **Auth, Roles & User Management** | Supabase Auth, JWT middleware, Individual vs Admin role enforcement, Privacy controls | Core Security |
| [Phase 3](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_3_letters_history_and_admin.md) | **Data Request Letters, History & Admin Portal** | Legal letter generator (DPDP/GDPR), persistent scan history, admin monitoring APIs | Should-Have |
| [Phase 4](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_4_frontend_development.md) | **Responsive React Frontend & UI/UX** | Modern dark-mode UI, tabbed scanners, visual risk cards, letter studio, history views | Core Experience |
| [Phase 5](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_5_testing_and_hardening.md) | **System Integration, Edge Cases & QA** | E2E integration, edge-case failure testing, security audits, payload limit handling | Verification |
| [Phase 6](file:///c:/Users/kalyani%20more/Desktop/Data/docs/phase_6_deployment_and_presentation.md) | **Deployment, Docs & Presentation Readiness** | Production hosting, Swagger API docs, 20-Day MVP checklist validation, Demo script | Delivery |

---

## 🎯 Technology Stack Alignment
- **Frontend:** React (Vite), Modern CSS Design Tokens (Responsive Desktop & Mobile)
- **Backend:** Python 3.10+, FastAPI, Pydantic, Uvicorn
- **AI Intelligence:** Google Gemini API (Free Tier)
- **URL Threat Intelligence:** Google Safe Browsing API v4
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security)
