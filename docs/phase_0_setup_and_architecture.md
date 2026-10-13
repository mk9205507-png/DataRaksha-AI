# 📁 Phase 0: Project Architecture, Environment Setup & Database Schema

## 📌 Phase Summary
Phase 0 lays the foundation for DataRaksha AI. This includes structuring the project workspace, setting up dependency management for both FastAPI and React, provisioning external cloud accounts (Google Gemini, Google Safe Browsing, Supabase), and designing the PostgreSQL database schema with Row Level Security (RLS).

---

## 🎯 Objectives & Goals
1. Establish a structured directory layout for the backend and frontend.
2. Formulate comprehensive environment configuration templates (`.env.example`).
3. Define the relational database schema in Supabase with strict isolation policies.
4. Prepare API client skeletons for Google Gemini, Google Safe Browsing, and Supabase.

---

## 🏗️ Directory Layout Specifications

```text
DataRaksha-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── scan.py          # Message, Link, Policy scan routes
│   │   │   │   │   ├── letters.py       # Data request letter generator routes
│   │   │   │   │   ├── history.py       # User scan history endpoints
│   │   │   │   │   └── admin.py         # Administrator dashboard metrics
│   │   │   │   └── router.py            # Central v1 route aggregator
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic BaseSettings for env vars
│   │   │   ├── security.py              # Supabase JWT token verification
│   │   │   └── exceptions.py            # Custom HTTP exceptions and handlers
│   │   ├── models/
│   │   │   ├── schemas.py               # Pydantic input/output schemas
│   │   │   └── db_models.py             # Database entity representations
│   │   └── services/
│   │       ├── gemini_service.py        # Google Gemini AI API integration
│   │       ├── safe_browsing_service.py # Google Safe Browsing API v4 client
│   │       ├── letter_service.py        # Legal letter template formatter
│   │       └── supabase_service.py      # Supabase database client
│   ├── tests/                           # Unit and integration test suite
│   ├── .env.example                     # Backend environment blueprint
│   ├── requirements.txt                 # Python dependencies
│   └── main.py                          # FastAPI application entrypoint
├── frontend/
│   ├── public/                          # Static assets and icons
│   ├── src/
│   │   ├── assets/                      # SVG icons and graphics
│   │   ├── components/
│   │   │   ├── common/                  # Navbar, Footer, Modal, Button, Alert
│   │   │   ├── scanner/                 # ScannerTabs, InputCard, ResultCard
│   │   │   ├── letters/                 # LetterForm, LetterPreview
│   │   │   └── history/                 # HistoryTable, HistoryCard
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Supabase authentication provider
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Main scanning workspace
│   │   │   ├── LetterGenerator.jsx      # Data access/deletion letter tool
│   │   │   ├── History.jsx              # User past scan archive
│   │   │   ├── AdminDashboard.jsx       # Admin analytics view
│   │   │   └── AuthPage.jsx             # Login & Registration
│   │   ├── services/
│   │   │   ├── api.js                   # Axios client for FastAPI backend
│   │   │   └── supabaseClient.js        # Supabase JS client
│   │   ├── styles/
│   │   │   ├── variables.css            # Color tokens, typography, radii
│   │   │   └── index.css                # Base reset and utilities
│   │   ├── App.jsx                      # Router & layout provider
│   │   └── main.jsx                     # Vite React entrypoint
│   ├── .env.example                     # Frontend environment blueprint
│   ├── package.json                     # Node.js dependencies
│   └── vite.config.js                   # Vite configuration
├── database/
│   └── schema.sql                       # Complete Supabase PostgreSQL DDL
├── docs/                                # Phase specifications and guides
├── .gitignore                           # Git ignore rules
└── README.md                            # Project overview and quickstart
```

---

## 🗄️ Database Schema & DDL Specification (Supabase PostgreSQL)

### 1. `profiles` Table
Stores extended user profile information mapped 1:1 with Supabase `auth.users`.
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'individual' CHECK (role IN ('individual', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `scan_history` Table
Stores scan reports generated for authenticated users.
```sql
CREATE TABLE public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('message', 'link', 'policy')),
    input_preview TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    summary TEXT NOT NULL,
    detected_threats JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. `data_request_letters` Table
Persists generated and customized data rights letters.
```sql
CREATE TABLE public.data_request_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    letter_type TEXT NOT NULL CHECK (letter_type IN ('access', 'deletion', 'consent_withdrawal')),
    recipient_email TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4. Row-Level Security (RLS) Policies
```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_request_letters ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Scan History: Users only read and delete their own history
CREATE POLICY "Users view own scans" ON public.scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scans" ON public.scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scans" ON public.scan_history FOR DELETE USING (auth.uid() = user_id);

-- Data Request Letters: Users manage own letters
CREATE POLICY "Users manage own letters" ON public.data_request_letters FOR ALL USING (auth.uid() = user_id);
```

---

## ⚙️ Environment Variables Specification

### Backend (`backend/.env`)
```env
PORT=8000
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173

# AI & Threat Intelligence APIs
GEMINI_API_KEY=your_gemini_api_key_here
SAFE_BROWSING_API_KEY=your_google_safe_browsing_key_here

# Supabase Auth & Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ✅ Phase 0 Acceptance Criteria
- [ ] Directory structure is created and verified.
- [ ] `.env.example` templates exist with all required configuration keys.
- [ ] `requirements.txt` and `package.json` list exact stable versions of dependencies.
- [ ] Database migration DDL script is validated with RLS policies enabled.
- [ ] Basic FastAPI entrypoint starts with `/health` endpoint returning `{"status": "ok"}`.
