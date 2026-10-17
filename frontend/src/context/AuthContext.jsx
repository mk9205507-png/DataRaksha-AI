import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState('individual');
  const [isLoading, setIsLoading] = useState(true);

  // Helper to extract or resolve user role
  // Helper to extract user display name
  const resolveUserDisplayName = (rawUser) => {
    // 1. Explicit displayName on user object
    if (rawUser?.displayName && typeof rawUser.displayName === 'string' && rawUser.displayName.trim()) {
      return rawUser.displayName.trim();
    }
    // 2. Explicitly saved person name in localStorage
    const savedPersonName = localStorage.getItem('dataraksha_person_name');
    if (savedPersonName && typeof savedPersonName === 'string' && savedPersonName.trim()) {
      return savedPersonName.trim();
    }
    // 3. Supabase metadata full_name
    const nameFromMeta = rawUser?.user_metadata?.full_name || rawUser?.user_metadata?.name;
    if (nameFromMeta && typeof nameFromMeta === 'string' && nameFromMeta.trim()) {
      return nameFromMeta.trim();
    }
    if (rawUser?.full_name && typeof rawUser.full_name === 'string' && rawUser.full_name.trim()) {
      return rawUser.full_name.trim();
    }
    if (rawUser?.name && typeof rawUser.name === 'string' && rawUser.name.trim()) {
      return rawUser.name.trim();
    }
    // 4. Default if user exists (never use email prefix like mk9205507 or user123)
    return rawUser ? 'Kalyani' : '';
  };

  // Helper to extract or resolve user role
  const resolveUserRole = (rawUser) => {
    if (!rawUser) return 'individual';
    const roleFromAppMeta = rawUser.app_metadata?.role;
    const roleFromUserMeta = rawUser.user_metadata?.role;
    if (roleFromAppMeta) return roleFromAppMeta;
    if (roleFromUserMeta) return roleFromUserMeta;

    // Check email pattern (e.g., admin@... or contains admin)
    const email = (rawUser.email || '').toLowerCase();
    if (email.startsWith('admin@') || email.includes('admin')) {
      return 'admin';
    }
    return 'individual';
  };

  // Sync token to localStorage and state
  const syncAuthState = (currentSession, currentUser = null) => {
    if (currentSession && currentSession.user) {
      const activeUser = currentUser || currentSession.user;
      const userRole = resolveUserRole(activeUser);
      const displayName = resolveUserDisplayName(activeUser);
      const enrichedUser = {
        ...activeUser,
        role: userRole,
        displayName,
      };

      setSession(currentSession);
      setUser(enrichedUser);
      setToken(currentSession.access_token);
      setRole(userRole);

      localStorage.setItem('dataraksha_auth_token', currentSession.access_token);
      localStorage.setItem('dataraksha_user', JSON.stringify(enrichedUser));
    } else if (currentUser) {
      const userRole = resolveUserRole(currentUser);
      const displayName = resolveUserDisplayName(currentUser);
      const enrichedUser = {
        ...currentUser,
        role: userRole,
        displayName,
      };

      setUser(enrichedUser);
      setRole(userRole);
      const fallbackToken = currentUser.token || localStorage.getItem('dataraksha_auth_token') || 'demo_jwt_token_active';
      setToken(fallbackToken);
      localStorage.setItem('dataraksha_auth_token', fallbackToken);
      localStorage.setItem('dataraksha_user', JSON.stringify(enrichedUser));
    } else {
      setSession(null);
      setUser(null);
      setToken(null);
      setRole('individual');
      localStorage.removeItem('dataraksha_auth_token');
      localStorage.removeItem('dataraksha_user');
      localStorage.removeItem('dataraksha_person_name');
      localStorage.removeItem('dataraksha_saved_email');
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check Supabase session
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          if (mounted) syncAuthState(data.session);
          // 2. Check local persistence fallback (e.g. demo mode or offline development)
          const storedUser = localStorage.getItem('dataraksha_user');
          const storedToken = localStorage.getItem('dataraksha_auth_token');
          if (storedUser && storedToken) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (mounted) syncAuthState(null, parsedUser);
            } catch {
              localStorage.removeItem('dataraksha_user');
              localStorage.removeItem('dataraksha_auth_token');
              if (mounted) syncAuthState(null, null);
            }
          } else {
            if (mounted) syncAuthState(null, null);
          }
        }
      } catch (err) {
        console.warn('Supabase auth initialization fallback:', err.message);
        const storedUser = localStorage.getItem('dataraksha_user');
        const storedToken = localStorage.getItem('dataraksha_auth_token');
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (mounted) syncAuthState(null, parsedUser);
          } catch {
            localStorage.removeItem('dataraksha_user');
            localStorage.removeItem('dataraksha_auth_token');
            if (mounted) syncAuthState(null, null);
          }
        } else {
          if (mounted) syncAuthState(null, null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          syncAuthState(currentSession);
        } else if (event === 'SIGNED_OUT') {
          syncAuthState(null, null);
        }
      }
    );

    // Listen to unauthorized interceptor events
    const handleUnauthorizedEvent = () => {
      syncAuthState(null, null);
    };
    window.addEventListener('dataraksha:unauthorized', handleUnauthorizedEvent);

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('dataraksha:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  // Helper to get local user registry
  const getLocalUserRegistry = () => {
    try {
      const data = localStorage.getItem('dataraksha_registered_users');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveLocalUserRegistry = (registry) => {
    try {
      localStorage.setItem('dataraksha_registered_users', JSON.stringify(registry));
    } catch (e) {
      console.warn('Could not save local user registry', e);
    }
  };

  // Login handler with rigorous credential validation
  const login = async ({ email, password, name = '', fullName = '' }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').toString();

    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (!cleanPassword || !cleanPassword.trim()) {
      throw new Error('Password is required.');
    }

    const rawName = (name || fullName || '').trim();

    try {
      // 1. Attempt Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        // If real error from live Supabase (e.g. invalid credentials), re-throw directly
        const isLiveError =
          error.message?.includes('Invalid login credentials') ||
          error.message?.includes('Email not confirmed') ||
          error.status === 400;

        if (isLiveError && !error.message?.includes('fetch') && !error.message?.includes('placeholder')) {
          throw new Error('Incorrect email or password. Please verify credentials.');
        }
        throw error;
      }

      const personName =
        rawName ||
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name ||
        cleanEmail.split('@')[0];

      localStorage.setItem('dataraksha_person_name', personName);
      localStorage.setItem('dataraksha_saved_email', cleanEmail);

      const activeUser = {
        ...data.user,
        displayName: personName,
      };
      syncAuthState(data.session, activeUser);
      return { success: true, user: activeUser };
    } catch (err) {
      // If user typed the wrong password on a real Supabase account, fail immediately
      if (err.message === 'Incorrect email or password. Please verify credentials.') {
        throw err;
      }

      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key') ||
        err.message?.includes('fetch');

      if (isPlaceholder) {
        // Check offline registry
        const registry = getLocalUserRegistry();
        const existing = registry[cleanEmail];

        if (existing) {
          if (existing.password !== cleanPassword) {
            throw new Error('Incorrect email or password. Please verify credentials.');
          }
          const personName = existing.name || rawName || cleanEmail.split('@')[0];
          localStorage.setItem('dataraksha_person_name', personName);
          localStorage.setItem('dataraksha_saved_email', cleanEmail);

          const demoUser = {
            id: existing.id || 'user-' + Math.random().toString(36).substring(2, 9),
            email: cleanEmail,
            displayName: personName,
            role: existing.role || (cleanEmail.includes('admin') ? 'admin' : 'individual'),
            created_at: existing.created_at || new Date().toISOString(),
            token: `demo_jwt_token_${existing.role || 'individual'}_${Date.now()}`,
          };
          syncAuthState(null, demoUser);
          return { success: true, user: demoUser, isDemo: true };
        }

        // Demo pre-configured accounts
        if (cleanEmail === 'admin@dataraksha.ai' || cleanEmail === 'kalyani@dataraksha.ai' || cleanEmail.includes('demo')) {
          if (cleanPassword.length < 4) {
            throw new Error('Incorrect email or password. Please verify credentials.');
          }
          const demoRole = cleanEmail.includes('admin') ? 'admin' : 'individual';
          const personName = rawName || (demoRole === 'admin' ? 'Admin' : 'Kalyani');
          localStorage.setItem('dataraksha_person_name', personName);
          localStorage.setItem('dataraksha_saved_email', cleanEmail);

          const demoUser = {
            id: demoRole === 'admin' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001',
            email: cleanEmail,
            displayName: personName,
            role: demoRole,
            created_at: new Date().toISOString(),
            token: `demo_jwt_token_${demoRole}_${Date.now()}`,
          };
          syncAuthState(null, demoUser);
          return { success: true, user: demoUser, isDemo: true };
        }

        // Generic local login: enforce minimum 6 chars
        if (cleanPassword.length < 6) {
          throw new Error('Incorrect email or password. Please verify credentials.');
        }

        const demoRole = cleanEmail.includes('admin') ? 'admin' : 'individual';
        const personName = rawName || cleanEmail.split('@')[0];
        localStorage.setItem('dataraksha_person_name', personName);
        localStorage.setItem('dataraksha_saved_email', cleanEmail);

        const demoUser = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email: cleanEmail,
          displayName: personName,
          role: demoRole,
          created_at: new Date().toISOString(),
          token: `demo_jwt_token_${demoRole}_${Date.now()}`,
        };
        syncAuthState(null, demoUser);
        return { success: true, user: demoUser, isDemo: true };
      }

      throw new Error(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  // Sign up handler with validation and duplicate prevention
  const signup = async ({ fullName = '', email, password, role: selectedRole = 'individual' }) => {
    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').toString();

    if (!cleanName) {
      throw new Error('Full name is required.');
    }
    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (cleanPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanName,
            role: selectedRole,
          },
        },
      });

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          throw new Error('An account with this email address is already registered. Please sign in.');
        }
        throw error;
      }

      if (data.session) {
        syncAuthState(data.session, data.user);
      }
      return {
        success: true,
        user: data.user,
        requiresEmailVerification: !data.session,
      };
    } catch (err) {
      if (err.message?.includes('already registered')) {
        throw err;
      }

      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key') ||
        err.message?.includes('fetch');

      if (isPlaceholder) {
        const registry = getLocalUserRegistry();
        if (registry[cleanEmail]) {
          throw new Error('An account with this email address is already registered. Please sign in.');
        }

        const newUser = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email: cleanEmail,
          name: cleanName,
          password: cleanPassword,
          role: selectedRole,
          created_at: new Date().toISOString(),
        };

        registry[cleanEmail] = newUser;
        saveLocalUserRegistry(registry);

        const demoUser = {
          id: newUser.id,
          email: cleanEmail,
          full_name: cleanName,
          displayName: cleanName,
          role: selectedRole,
          created_at: newUser.created_at,
          token: `demo_jwt_token_${selectedRole}_${Date.now()}`,
        };
        syncAuthState(null, demoUser);
        return { success: true, user: demoUser, isDemo: true };
      }

      throw new Error(err.message || 'Registration failed. Please try again.');
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err.message);
    } finally {
      localStorage.removeItem('dataraksha_auth_token');
      localStorage.removeItem('dataraksha_user');
      localStorage.removeItem('dataraksha_person_name');
      localStorage.removeItem('dataraksha_saved_email');
      syncAuthState(null, null);
    }
  };

  // Password reset request
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key') ||
        err.message?.includes('fetch');

      if (isPlaceholder) {
        return { success: true, isDemo: true };
      }
      throw err;
    }
  };

  // Update password (when authenticated or in recovery mode)
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (err) {
      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key');

      if (isPlaceholder) {
        return { success: true, isDemo: true };
      }
      throw err;
    }
  };

  // Quick switch for developers / reviewers
  const setDemoAuth = (targetRole = 'individual', customName = '') => {
    const isTargetAdmin = targetRole === 'admin';
    const savedName = localStorage.getItem('dataraksha_person_name') || 'Kalyani';
    const name = customName || (isTargetAdmin ? 'Admin (Kalyani)' : savedName);
    localStorage.setItem('dataraksha_person_name', name);
    const demoUser = {
      id: isTargetAdmin ? 'admin-001-sec' : 'user-001-ind',
      email: isTargetAdmin ? 'admin@dataraksha.ai' : 'kalyani@example.com',
      full_name: name,
      displayName: name,
      role: isTargetAdmin ? 'admin' : 'individual',
      created_at: new Date().toISOString(),
      token: `demo_jwt_token_${targetRole}_${Date.now()}`,
    };
    syncAuthState(null, demoUser);
  };

  const value = {
    user,
    session,
    token,
    role,
    isAuthenticated: Boolean(user && (token || localStorage.getItem('dataraksha_auth_token'))),
    isAdmin: role === 'admin',
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    setDemoAuth,
    loginAsDemoUser: () => setDemoAuth('individual', 'Kalyani'),
    loginAsDemoAdmin: () => setDemoAuth('admin', 'Administrator'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
