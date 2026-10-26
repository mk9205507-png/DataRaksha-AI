-- ==============================================================================
-- DataRaksha AI - Database Migration: Secure Admin Portal & Role-Based Access Control
-- File: database/01_admin_portal_security.sql
-- ==============================================================================

-- 1. Helper Function: Check if a user is an administrator
-- Security Definer ensures the check runs with owner privileges to read public.profiles
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = check_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Audit Trail Table: Records sensitive administrative operations
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policy: Only verified administrators can read audit logs
DROP POLICY IF EXISTS "Admins read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Audit Logs Policy: Admins or service_role can insert audit records
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 3. Security Guard Trigger: Prevent non-admin users from escalating their own role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS TRIGGER AS $$
DECLARE
    current_jwt_role TEXT;
BEGIN
    -- Only inspect when role column is modified
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Safely extract JWT role claim if available
        BEGIN
            current_jwt_role := current_setting('request.jwt.claim.role', true);
        EXCEPTION WHEN OTHERS THEN
            current_jwt_role := NULL;
        END;

        -- Allow if executed directly via Supabase Service-Role key
        IF current_jwt_role IS DISTINCT FROM 'service_role' THEN
            -- Check if caller is already a verified administrator
            IF NOT public.is_admin(auth.uid()) THEN
                RAISE EXCEPTION 'Access Denied: You cannot grant yourself or others administrator privileges.';
            END IF;
        END IF;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_profile_role_tampering ON public.profiles;
CREATE TRIGGER tr_prevent_profile_role_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_tampering();

-- 4. Refined Profiles Policies
-- Normal users can view only their own profile; Admins can view all profiles for User Management
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Normal users can update non-role fields of their own profile; Admins can manage roles
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- 5. Refined Scan History Policies
-- Normal users view only their own scans; Admins can view platform scan records
DROP POLICY IF EXISTS "Users view own scans" ON public.scan_history;
CREATE POLICY "Users view own scans" ON public.scan_history
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 6. Initial Administrator Assignment Procedure
-- Replace 'admin@dataraksha.ai' with your registered account email
-- Example:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
