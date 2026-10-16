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
    if (!rawUser) return 'User';
    const nameFromMeta = rawUser.user_metadata?.full_name || rawUser.user_metadata?.name;
    if (nameFromMeta && typeof nameFromMeta === 'string' && nameFromMeta.trim()) {
      return nameFromMeta.trim();
    }
    if (rawUser.full_name && typeof rawUser.full_name === 'string' && rawUser.full_name.trim()) {
      return rawUser.full_name.trim();
    }
    if (rawUser.name && typeof rawUser.name === 'string' && rawUser.name.trim()) {
      return rawUser.name.trim();
    }
    const emailPrefix = (rawUser.email || '').split('@')[0];
    if (emailPrefix) {
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'User';
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
        } else {
          // 2. Check local persistence fallback (e.g. demo mode or offline development)
          const storedUser = localStorage.getItem('dataraksha_user');
          const storedToken = localStorage.getItem('dataraksha_auth_token');
          if (storedUser && storedToken) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (mounted) syncAuthState(null, parsedUser);
            } catch {
              localStorage.removeItem('dataraksha_user');
            }
          }
        }
      } catch (err) {
        console.warn('Supabase auth initialization fallback:', err.message);
        const storedUser = localStorage.getItem('dataraksha_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (mounted) syncAuthState(null, parsedUser);
          } catch {
            localStorage.removeItem('dataraksha_user');
          }
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

  // Login handler
  const login = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      syncAuthState(data.session, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // Offline / Placeholder mode fallback for local developer preview
      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key') ||
        err.message?.includes('fetch');

      if (isPlaceholder) {
        const demoRole = email.toLowerCase().includes('admin') ? 'admin' : 'individual';
        const demoUser = {
          id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
          email,
          role: demoRole,
          created_at: new Date().toISOString(),
          token: `demo_jwt_token_${demoRole}_${Date.now()}`,
        };
        syncAuthState(null, demoUser);
        return { success: true, user: demoUser, isDemo: true };
      }
      throw err;
    }
  };

  // Sign up handler
  const signup = async ({ fullName = '', email, password, role: selectedRole = 'individual' }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        syncAuthState(data.session, data.user);
      }
      return {
        success: true,
        user: data.user,
        requiresEmailVerification: !data.session,
      };
    } catch (err) {
      const isPlaceholder =
        err.message?.includes('placeholder') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('Invalid API key') ||
        err.message?.includes('fetch');

      if (isPlaceholder) {
        const demoUser = {
          id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
          email,
          full_name: fullName || email.split('@')[0],
          displayName: fullName || email.split('@')[0],
          role: selectedRole,
          created_at: new Date().toISOString(),
          token: `demo_jwt_token_${selectedRole}_${Date.now()}`,
        };
        syncAuthState(null, demoUser);
        return { success: true, user: demoUser, isDemo: true };
      }
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err.message);
    } finally {
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
  const setDemoAuth = (targetRole = 'individual') => {
    const isTargetAdmin = targetRole === 'admin';
    const demoUser = {
      id: isTargetAdmin ? 'admin-001-sec' : 'user-001-ind',
      email: isTargetAdmin ? 'admin@dataraksha.ai' : 'kalyani@example.com',
      full_name: isTargetAdmin ? 'Security Admin' : 'Kalyani More',
      displayName: isTargetAdmin ? 'Security Admin' : 'Kalyani More',
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
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    setDemoAuth,
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
