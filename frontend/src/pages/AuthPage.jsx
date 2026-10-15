import React, { useState } from 'react';
import {
  Lock,
  Mail,
  UserPlus,
  LogIn,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({ onAuthSuccess }) => {
  const { login, signup, resetPassword, setDemoAuth } = useAuth();

  // Mode: 'login' | 'signup' | 'reset'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('individual'); // 'individual' | 'admin'

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Client-side input validation
  const validateInputs = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address (e.g., name@example.com).';
    }

    if (mode !== 'reset') {
      if (!password) {
        errors.password = 'Password is required.';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long.';
      }
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Confirm your password.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login({ email, password });
        setAlert({
          type: 'success',
          message: result.isDemo
            ? `Demo session active as ${result.user.role === 'admin' ? 'Administrator' : 'Individual User'}!`
            : 'Signed in successfully. Welcome back!',
        });
        if (onAuthSuccess) onAuthSuccess(result.user);
      } else if (mode === 'signup') {
        const result = await signup({ email, password, role });
        if (result.requiresEmailVerification) {
          setAlert({
            type: 'success',
            message: 'Registration initiated! Please check your inbox to confirm your email address.',
          });
        } else {
          setAlert({
            type: 'success',
            message: result.isDemo
              ? `Demo account created as ${role === 'admin' ? 'Administrator' : 'Individual User'}!`
              : 'Account registered successfully!',
          });
          if (onAuthSuccess) onAuthSuccess(result.user);
        }
      } else if (mode === 'reset') {
        await resetPassword(email);
        setAlert({
          type: 'success',
          message: 'Password reset link sent! Check your email inbox for instructions.',
        });
      }
    } catch (err) {
      const errorMsg =
        err.message || 'Authentication operation failed. Please check your credentials and retry.';
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (targetRole) => {
    setAlert(null);
    setFieldErrors({});
    setDemoAuth(targetRole);
    setAlert({
      type: 'success',
      message: `Signed in instantly via Demo Mode as ${targetRole === 'admin' ? 'Administrator' : 'Individual User'}.`,
    });
    if (onAuthSuccess) {
      onAuthSuccess({
        email: targetRole === 'admin' ? 'admin@dataraksha.ai' : 'user@example.com',
        role: targetRole,
      });
    }
  };

  return (
    <div className="auth-page-container" id="auth-view">
      <div className="auth-card glass-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Lock size={24} className="text-cyan" />
          </div>
          <h2 className="auth-title">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create DataRaksha Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login' && 'Access personal scan history and custom privacy deletion letters.'}
            {mode === 'signup' && 'Join the digital shield to safeguard personal credentials and PII.'}
            {mode === 'reset' && 'Enter your verified email to receive a password reset link.'}
          </p>
        </div>

        {/* Global Alert Notification */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Auth Mode Tabs (Login vs Register) */}
        {mode !== 'reset' ? (
          <div className="auth-tab-switch" role="tablist">
            <button
              type="button"
              id="auth-tab-login"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setAlert(null);
                setFieldErrors({});
              }}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setAlert(null);
                setFieldErrors({});
              }}
            >
              <UserPlus size={15} /> Register
            </button>
          </div>
        ) : (
          <div className="auth-reset-back-bar">
            <button
              type="button"
              className="btn btn-ghost action-sm back-to-login-btn"
              onClick={() => {
                setMode('login');
                setAlert(null);
                setFieldErrors({});
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                className={`input-field with-icon ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                required
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-message">
                <AlertCircle size={12} /> {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Role Selection on Sign Up */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Select Account Role</label>
              <div className="role-selection-grid">
                <button
                  type="button"
                  id="role-select-individual"
                  className={`role-select-card ${role === 'individual' ? 'selected' : ''}`}
                  onClick={() => setRole('individual')}
                >
                  <UserCheck size={16} className="role-icon" />
                  <div className="role-info">
                    <span className="role-title">Individual</span>
                    <span className="role-desc">Ad-hoc scans & private history</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="role-select-admin"
                  className={`role-select-card ${role === 'admin' ? 'selected' : ''}`}
                  onClick={() => setRole('admin')}
                >
                  <ShieldCheck size={16} className="role-icon" />
                  <div className="role-info">
                    <span className="role-title">Admin</span>
                    <span className="role-desc">System health & global metrics</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Password Field (for Login and Signup) */}
          {mode !== 'reset' && (
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="auth-password">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => {
                      setMode('reset');
                      setAlert(null);
                      setFieldErrors({});
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field with-icon with-password-toggle ${
                    fieldErrors.password ? 'input-error' : ''
                  }`}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error-message">
                  <AlertCircle size={12} /> {fieldErrors.password}
                </span>
              )}
            </div>
          )}

          {/* Confirm Password Field (Sign Up Mode) */}
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">
                Confirm Password
              </label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input-field with-icon with-password-toggle ${
                    fieldErrors.confirmPassword ? 'input-error' : ''
                  }`}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  id="toggle-confirm-password-visibility-btn"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="field-error-message">
                  <AlertCircle size={12} /> {fieldErrors.confirmPassword}
                </span>
              )}

              {/* Password strength / match cues */}
              <div className="password-requirements-hints">
                <span className={`requirement-tag ${password.length >= 6 ? 'met' : ''}`}>
                  <CheckCircle2 size={12} /> At least 6 characters
                </span>
                <span
                  className={`requirement-tag ${
                    password && confirmPassword && password === confirmPassword ? 'met' : ''
                  }`}
                >
                  <CheckCircle2 size={12} /> Passwords match
                </span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            id="auth-submit-btn"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              'Processing...'
            ) : mode === 'login' ? (
              'Sign In to DataRaksha'
            ) : mode === 'signup' ? (
              'Create Free Account'
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Bar (For Reviewers / Pair Developers) */}
        <div className="auth-demo-section">
          <div className="demo-section-label">
            <Sparkles size={13} className="text-cyan" />
            <span>Developer / Quick Demo Access</span>
          </div>
          <div className="demo-actions-grid">
            <button
              type="button"
              id="quick-demo-user-btn"
              className="btn btn-secondary action-sm demo-btn"
              onClick={() => handleDemoLogin('individual')}
              title="Quick test as regular user"
            >
              Demo User
            </button>
            <button
              type="button"
              id="quick-demo-admin-btn"
              className="btn btn-secondary action-sm demo-btn"
              onClick={() => handleDemoLogin('admin')}
              title="Quick test with Administrator permissions"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Privacy & Security Guarantee */}
        <div className="auth-privacy-guarantee">
          <Shield size={14} className="text-cyan" />
          <span>Secured with Supabase Zero-Knowledge Row Level Security</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
