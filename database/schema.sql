-- ==============================================================================
-- DataRaksha AI - Supabase PostgreSQL Database Schema (Phase 0)
-- ==============================================================================

-- 1. Profiles Table (1:1 extension with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'individual' CHECK (role IN ('individual', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Scan History Table
CREATE TABLE IF NOT EXISTS public.scan_history (
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

-- 3. Data Request Letters Table
CREATE TABLE IF NOT EXISTS public.data_request_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    letter_type TEXT NOT NULL CHECK (letter_type IN ('access', 'deletion', 'consent_withdrawal')),
    recipient_email TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_request_letters ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Scan History Policies
DROP POLICY IF EXISTS "Users view own scans" ON public.scan_history;
CREATE POLICY "Users view own scans" ON public.scan_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own scans" ON public.scan_history;
CREATE POLICY "Users insert own scans" ON public.scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own scans" ON public.scan_history;
CREATE POLICY "Users delete own scans" ON public.scan_history FOR DELETE USING (auth.uid() = user_id);

-- Data Request Letters Policies
DROP POLICY IF EXISTS "Users manage own letters" ON public.data_request_letters;
CREATE POLICY "Users manage own letters" ON public.data_request_letters FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- Automatic Profile Creation Trigger on Auth Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, COALESCE(NEW.email, ''), 'individual')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
