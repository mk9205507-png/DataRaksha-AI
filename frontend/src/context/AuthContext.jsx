import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { historyService } from '../services/historyService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('dataraksha_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('dataraksha_auth_token') || null;
  });
  const [role, setRole] = useState(() => {
    if (typeof window === 'undefined') return 'individual';
    try {
      const saved = localStorage.getItem('dataraksha_user');
      return saved ? JSON.parse(saved)?.role || 'individual' : 'individual';
    } catch {
      return 'individual';
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Track browser network connectivity (Online / Offline)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to extract user display name
  const resolveUserDisplayName = (rawUser) => {
    if (!rawUser) return '';
    const nameFromMeta = rawUser?.user_metadata?.full_name || rawUser?.user_metadata?.name;
    if (nameFromMeta && typeof nameFromMeta === 'string' && nameFromMeta.trim()) {
      return nameFromMeta.trim();
    }
    if (rawUser?.full_name && typeof rawUser.full_name === 'string' && rawUser.full_name.trim()) {
      return rawUser.full_name.trim();
    }
    if (rawUser?.displayName && typeof rawUser.displayName === 'string' && rawUser.displayName.trim()) {
      return rawUser.displayName.trim();
    }
    const savedPersonName = localStorage.getItem('dataraksha_person_name');
    if (savedPersonName && typeof savedPersonName === 'string' && savedPersonName.trim()) {
      return savedPersonName.trim();
    }
    if (rawUser?.email && typeof rawUser.email === 'string') {
      const prefix = rawUser.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'User';
  };

  // Helper to securely fetch user role from Supabase database profiles table
  const fetchProfileRole = useCallback(async (userId) => {
    if (!userId) return 'individual';
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.role && (data.role === 'admin' || data.role === 'individual')) {
        return data.role;
      }
    } catch (e) {
      console.warn('Could not query role from profiles table:', e);
    }
    return 'individual';
  }, []);

  // Synchronize authentication state
  const syncAuthState = useCallback(
    async (currentSession, activeUserOverride = null) => {
      // Purge any un-scoped legacy scan history so old test scans never bleed into user accounts
      historyService.purgeLegacyUnscopedHistory();

      if (currentSession && currentSession.user) {
        const rawUser = activeUserOverride || currentSession.user;
        const dbRole = await fetchProfileRole(rawUser.id);
        const resolvedRole =
          rawUser.app_metadata?.role === 'admin' || dbRole === 'admin' ? 'admin' : 'individual';
        const displayName = resolveUserDisplayName(rawUser);

        const enrichedUser = {
          ...rawUser,
          role: resolvedRole,
          displayName,
        };

        setSession(currentSession);
        setUser(enrichedUser);
        setToken(currentSession.access_token);
        setRole(resolvedRole);

        localStorage.setItem('dataraksha_auth_token', currentSession.access_token);
        localStorage.setItem('dataraksha_user', JSON.stringify(enrichedUser));
        if (displayName) {
          localStorage.setItem('dataraksha_person_name', displayName);
        }
      } else {
        setSession(null);
        setUser(null);
        setToken(null);
        setRole('individual');
        localStorage.removeItem('dataraksha_auth_token');
        localStorage.removeItem('dataraksha_user');
        localStorage.removeItem('dataraksha_person_name');
        localStorage.removeItem('dataraksha_saved_email');
        localStorage.removeItem('dataraksha_scan_history');
        window.dispatchEvent(
          new CustomEvent('dataraksha:history_updated', {
            detail: { allRecords: [], userId: null },
          })
        );
      }
    },
    [fetchProfileRole]
  );

  // Initialize session on startup
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          if (mounted) await syncAuthState(data.session);
        } else {
          if (mounted) await syncAuthState(null);
        }
      } catch (err) {
        console.warn('Supabase auth session initialization error:', err.message);
        if (mounted) await syncAuthState(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to Supabase auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION'
        ) {
          if (currentSession) {
            await syncAuthState(currentSession);
          }
        } else if (event === 'SIGNED_OUT') {
          await syncAuthState(null);
        }
      }
    );

    // Listen to unauthorized interceptor events from api.js
    const handleUnauthorizedEvent = async () => {
      if (!mounted) return;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          await syncAuthState(data.session);
          return;
        }
      } catch (err) {
        console.warn('Session check during unauthorized event failed:', err);
      }
      await syncAuthState(null);
    };
    window.addEventListener('dataraksha:unauthorized', handleUnauthorizedEvent);

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('dataraksha:unauthorized', handleUnauthorizedEvent);
    };
  }, [syncAuthState]);

  // Login handler using real Supabase Authentication
  const login = async ({ email, password }) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').toString();

    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (!cleanPassword) {
      throw new Error('Password is required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email address has not been verified. Please check your inbox.');
      }
      throw new Error(msg || 'Sign in failed. Please check your credentials.');
    }

    if (!data?.session || !data?.user) {
      throw new Error('Authentication failed. No active session returned.');
    }

    // Verify role directly from database
    const dbRole = await fetchProfileRole(data.user.id);
    const resolvedRole =
      data.user.app_metadata?.role === 'admin' || dbRole === 'admin' ? 'admin' : 'individual';
    const displayName = resolveUserDisplayName(data.user);

    localStorage.setItem('dataraksha_saved_email', cleanEmail);
    if (displayName) {
      localStorage.setItem('dataraksha_person_name', displayName);
    }

    const activeUser = {
      ...data.user,
      role: resolvedRole,
      displayName,
    };

    await syncAuthState(data.session, activeUser);

    return {
      success: true,
      user: activeUser,
      role: resolvedRole,
      isAdmin: resolvedRole === 'admin',
    };
  };

  // Sign up handler using real Supabase Authentication
  const signup = async ({ fullName = '', email, password }) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').toString();

    if (!cleanName) {
      throw new Error('Full name is required.');
    }
    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (!cleanPassword || cleanPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanName,
          role: 'individual',
        },
      },
    });

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('unique')) {
        throw new Error('An account with this email address is already registered. Please sign in instead.');
      }
      throw new Error(msg || 'Registration failed. Please try again.');
    }

    localStorage.setItem('dataraksha_saved_email', cleanEmail);
    localStorage.setItem('dataraksha_person_name', cleanName);

    // If session was established immediately (email confirmation disabled or auto-confirmed)
    if (data?.session && data?.user) {
      const activeUser = {
        ...data.user,
        role: 'individual',
        displayName: cleanName,
      };
      await syncAuthState(data.session, activeUser);
      return {
        success: true,
        user: activeUser,
        role: 'individual',
        requiresEmailVerification: false,
      };
    }

    // Email verification required
    return {
      success: true,
      user: data?.user || null,
      role: 'individual',
      requiresEmailVerification: true,
    };
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err.message);
    } finally {
      await syncAuthState(null);
    }
  };

  // Password reset request
  const resetPassword = async (email) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your registered email address.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}#auth`,
    });
    if (error) throw new Error(error.message || 'Could not send reset link.');
    return { success: true };
  };

  // Update password (when in recovery session)
  const updatePassword = async (newPassword) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message || 'Failed to update password.');
    return { success: true, user: data.user };
  };

  // Google OAuth / Gmail connection state helper
  const loginWithGoogle = async ({ email = '', name = '' } = {}) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const personName = (name || '').trim() || cleanEmail.split('@')[0];
    if (cleanEmail) {
      localStorage.setItem('dataraksha_gmail_email', cleanEmail);
      localStorage.setItem('dataraksha_gmail_connected', 'true');
    }
    if (personName && !localStorage.getItem('dataraksha_person_name')) {
      localStorage.setItem('dataraksha_person_name', personName);
    }
    return { success: true };
  };

  const value = {
    user,
    session,
    token,
    role,
    isAuthenticated: Boolean((user || session?.user) && (token || session?.access_token)),
    isAdmin: role === 'admin',
    isLoading,
    isOnline,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    loginWithGoogle,
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
