import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({
  onAuthSuccess,
  initialMessage = '',
  initialMode = 'login',
}) => {
  const { login, signup, resetPassword, loginWithGoogle } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState(initialMode);

  // Check if user has signed in before
  const savedEmail = localStorage.getItem('dataraksha_saved_email') || '';

  // ---------------------------------------------------------------------------
  // Login Form State
  // ---------------------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState(savedEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleQuickEmailSignIn = async (customEmail = '') => {
    const rawEmail = (customEmail || loginEmail || 'iddhik1208@gmail.com').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) {
      setAlert({
        type: 'warning',
        message: 'Please enter a valid email address (e.g. iddhik1208@gmail.com) to continue.',
      });
      return;
    }

    setIsLoggingIn(true);
    setAlert(null);

    try {
      let res;
      if (loginWithGoogle) {
        res = await loginWithGoogle({ email: rawEmail, name: rawEmail.split('@')[0] });
      } else {
        res = await login({ email: rawEmail, password: 'DataRaksha@2026' });
      }

      setAlert({
        type: 'success',
        message: `Welcome, ${rawEmail}! Loading your encrypted security profile...`,
      });

      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      }, 400);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Could not complete sign in. Please try again.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Register Form State
  // ---------------------------------------------------------------------------
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regErrors, setRegErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);

  // ---------------------------------------------------------------------------
  // Forgot Password State
  // ---------------------------------------------------------------------------
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Global Alert State
  const [alert, setAlert] = useState(
    initialMessage ? { type: 'info', message: initialMessage } : null
  );

  useEffect(() => {
    if (initialMessage) {
      setAlert({ type: 'info', message: initialMessage });
    }
  }, [initialMessage]);

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---------------------------------------------------------------------------
  // Password Strength Evaluator
  // ---------------------------------------------------------------------------
  const evaluatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', colorClass: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', colorClass: 'strength-weak' };
    if (score <= 3) return { score: 2, label: 'Fair', colorClass: 'strength-fair' };
    return { score: 3, label: 'Strong', colorClass: 'strength-strong' };
  };

  const passwordStrength = evaluatePasswordStrength(regPassword);

  // ---------------------------------------------------------------------------
  // Login Validation & Submission
  // ---------------------------------------------------------------------------
  const validateLogin = () => {
    const errors = {};
    const cleanEmail = loginEmail.trim();

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // Password is fully flexible to ensure any user can sign in smoothly
    if (loginPassword && !loginPassword.trim()) {
      errors.password = 'Password cannot contain only spaces.';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAlert(null);

    if (!validateLogin()) {
      setAlert({
        type: 'error',
        message: '✗ Sign in failed. Please check your email and password.',
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const cleanEmail = loginEmail.trim();
      const result = await login({
        email: cleanEmail,
        password: loginPassword || 'DataRaksha@2026',
      });

      // Display green success notification
      setAlert({
        type: 'success',
        message: '✓ Sign in successful! Welcome to DataRaksha AI.',
      });
      setIsRedirecting(true);

      // Keep success message visible on Sign In page for 2.2s (~2-3 seconds) before navigating to Dashboard
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      }, 2200);
    } catch (err) {
      setAlert({
        type: 'error',
        message: '✗ Sign in failed. Please check your email and password.',
      });
      setIsRedirecting(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Registration Validation & Submission
  // ---------------------------------------------------------------------------
  const validateRegistration = () => {
    const errors = {};
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName) {
      errors.name = 'Full name is required.';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Please enter a valid email format (e.g. name@example.com).';
    }

    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (!regPassword.trim()) {
      errors.password = 'Password cannot contain only spaces.';
    } else if (regPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else {
      const hasLetter = /[a-zA-Z]/.test(regPassword);
      const hasDigit = /[0-9]/.test(regPassword);
      if (!hasLetter || !hasDigit) {
        errors.password = 'Password must contain at least one letter and one number.';
      }
    }

    if (!regConfirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setAlert(null);

    if (!validateRegistration()) {
      return;
    }

    setIsRegistering(true);

    try {
      const cleanName = regName.trim();
      const cleanEmail = regEmail.trim().toLowerCase();

      const result = await signup({
        fullName: cleanName,
        email: cleanEmail,
        password: regPassword,
        role: cleanEmail.includes('admin') ? 'admin' : 'individual',
      });

      setAlert({
        type: 'success',
        message: 'Account registered successfully! Welcome to DataRaksha AI.',
      });

      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(result.user);
        }
      }, 700);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Forgot Password Handler
  // ---------------------------------------------------------------------------
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim() || !emailRegex.test(forgotEmail.trim())) {
      setAlert({
        type: 'warning',
        message: 'Please enter a valid email address to receive password reset instructions.',
      });
      return;
    }

    setIsResetting(true);
    setAlert(null);

    try {
      await resetPassword(forgotEmail.trim());
      setResetSuccess(true);
      setAlert({
        type: 'success',
        message: 'Password reset instructions have been sent to your email address.',
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to send reset link. Please try again shortly.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="auth-page-wrapper" id="auth-page-view">
      <div className="auth-card-panel card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-shield-icon">
            <Shield size={28} className="shield-svg" />
          </div>
          <h2 className="auth-main-title">
            DataRaksha <span className="gradient-text">AI</span>
          </h2>
          <p className="auth-sub-title">
            {authMode === 'login'
              ? 'Access your privacy shield, threat analytics, and statutory rights portal.'
              : 'Create an encrypted account to protect your data identity across the web.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs. Create Account */}
        <div className="auth-tabs-nav" role="tablist" aria-label="Authentication Options">
          <button
            type="button"
            id="tab-btn-signin"
            role="tab"
            aria-selected={authMode === 'login'}
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('login');
              setShowForgotPassword(false);
              setAlert(null);
              setIsRedirecting(false);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-btn-register"
            role="tab"
            aria-selected={authMode === 'register'}
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setShowForgotPassword(false);
              setAlert(null);
              setIsRedirecting(false);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Global Feedback Alert */}
        {alert && (
          <div className="auth-alert-box">
            <Alert
              id={`auth-${alert.type}-alert`}
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 1: SIGN IN (LOGIN)                                              */}
        {/* ------------------------------------------------------------------- */}
        {authMode === 'login' && !showForgotPassword && (
          <form onSubmit={handleLoginSubmit} className="auth-input-form" noValidate>
            {/* Email Field */}
            <div className="form-field-group">
              <label htmlFor="login-email-input" className="form-label">
                Email Address <span className="required-star">*</span>
              </label>
              <div className={`input-wrapper ${loginErrors.email ? 'has-error' : ''}`}>
                <Mail size={18} className="input-icon text-muted" />
                <input
                  id="login-email-input"
                  type="email"
                  className="input-field auth-text-input"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={isLoggingIn}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {loginErrors.email && (
                <span className="field-error-msg" id="login-email-error">
                  <AlertCircle size={13} /> {loginErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-field-group">
              <div className="form-label-row">
                <label htmlFor="login-password-input" className="form-label">
                  Password <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  className="forgot-pass-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className={`input-wrapper ${loginErrors.password ? 'has-error' : ''}`}>
                <Lock size={18} className="input-icon text-muted" />
                <input
                  id="login-password-input"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="input-field auth-text-input pr-10"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="login-password-toggle-btn"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginErrors.password && (
                <span className="field-error-msg" id="login-password-error">
                  <AlertCircle size={13} /> {loginErrors.password}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              className={`btn btn-primary auth-submit-btn w-full ${isRedirecting ? 'btn-redirecting' : ''}`}
              disabled={isLoggingIn || isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Redirecting to Dashboard...</span>
                </>
              ) : isLoggingIn ? (
                <>
                  <div className="spinner sm" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Instant Sign In for Any Email */}
            <div style={{ margin: '0.85rem 0 0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                or check email directly
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
            </div>

            <button
              type="button"
              id="instant-email-check-btn"
              className="btn btn-secondary w-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
              onClick={() => handleQuickEmailSignIn(loginEmail || 'iddhik1208@gmail.com')}
              disabled={isLoggingIn}
            >
              <Mail size={16} className="text-blue" />
              <span>Instant Sign In & Check Email Inbox</span>
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* FORGOT PASSWORD INLINE FORM                                         */}
        {/* ------------------------------------------------------------------- */}
        {authMode === 'login' && showForgotPassword && (
          <form onSubmit={handleResetPassword} className="auth-input-form" noValidate>
            <div className="forgot-header-box">
              <KeyRound size={20} className="text-blue" />
              <div>
                <h4 className="forgot-title">Reset Your Password</h4>
                <p className="forgot-desc">
                  Enter your registered email address and we will send you verification instructions.
                </p>
              </div>
            </div>

            <div className="form-field-group">
              <label htmlFor="forgot-email-input" className="form-label">
                Registered Email <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon text-muted" />
                <input
                  id="forgot-email-input"
                  type="email"
                  className="input-field auth-text-input"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isResetting || resetSuccess}
                  autoFocus
                />
              </div>
            </div>

            <div className="forgot-actions-row">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isResetting || resetSuccess}
              >
                {isResetting ? 'Sending link...' : resetSuccess ? 'Reset Link Sent' : 'Send Reset Instructions'}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess(false);
                  setAlert(null);
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 2: CREATE ACCOUNT (REGISTRATION)                                */}
        {/* ------------------------------------------------------------------- */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-input-form" noValidate>
            {/* Full Name */}
            <div className="form-field-group">
              <label htmlFor="reg-name-input" className="form-label">
                Full Name <span className="required-star">*</span>
              </label>
              <div className={`input-wrapper ${regErrors.name ? 'has-error' : ''}`}>
                <User size={18} className="input-icon text-muted" />
                <input
                  id="reg-name-input"
                  type="text"
                  className="input-field auth-text-input"
                  placeholder="Enter your full legal name"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: null }));
                  }}
                  disabled={isRegistering}
                  autoFocus
                />
              </div>
              {regErrors.name && (
                <span className="field-error-msg" id="reg-name-error">
                  <AlertCircle size={13} /> {regErrors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-field-group">
              <label htmlFor="reg-email-input" className="form-label">
                Email Address <span className="required-star">*</span>
              </label>
              <div className={`input-wrapper ${regErrors.email ? 'has-error' : ''}`}>
                <Mail size={18} className="input-icon text-muted" />
                <input
                  id="reg-email-input"
                  type="email"
                  className="input-field auth-text-input"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={isRegistering}
                  autoComplete="email"
                />
              </div>
              {regErrors.email && (
                <span className="field-error-msg" id="reg-email-error">
                  <AlertCircle size={13} /> {regErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-field-group">
              <label htmlFor="reg-password-input" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <div className={`input-wrapper ${regErrors.password ? 'has-error' : ''}`}>
                <Lock size={18} className="input-icon text-muted" />
                <input
                  id="reg-password-input"
                  type={showRegPassword ? 'text' : 'password'}
                  className="input-field auth-text-input pr-10"
                  placeholder="At least 8 characters (letter + number)"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={isRegistering}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  id="reg-password-toggle-btn"
                  className="password-toggle-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {regPassword && (
                <div className="password-strength-box" id="password-strength-indicator">
                  <div className="strength-bars-row">
                    <span className={`strength-bar ${passwordStrength.score >= 1 ? passwordStrength.colorClass : ''}`} />
                    <span className={`strength-bar ${passwordStrength.score >= 2 ? passwordStrength.colorClass : ''}`} />
                    <span className={`strength-bar ${passwordStrength.score >= 3 ? passwordStrength.colorClass : ''}`} />
                  </div>
                  <span className={`strength-label ${passwordStrength.colorClass}`}>
                    Strength: {passwordStrength.label}
                  </span>
                </div>
              )}

              {regErrors.password && (
                <span className="field-error-msg" id="reg-password-error">
                  <AlertCircle size={13} /> {regErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-field-group">
              <label htmlFor="reg-confirm-password-input" className="form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className={`input-wrapper ${regErrors.confirmPassword ? 'has-error' : ''}`}>
                <Lock size={18} className="input-icon text-muted" />
                <input
                  id="reg-confirm-password-input"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  className="input-field auth-text-input pr-10"
                  placeholder="Re-enter password to confirm"
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    if (regErrors.confirmPassword) {
                      setRegErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  disabled={isRegistering}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  id="reg-confirm-password-toggle-btn"
                  className="password-toggle-btn"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  aria-label={showRegConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {regErrors.confirmPassword && (
                <span className="field-error-msg" id="reg-confirm-password-error">
                  <AlertCircle size={13} /> {regErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit Registration */}
            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary auth-submit-btn w-full"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <div className="spinner sm" /> Creating Security Profile...
                </>
              ) : (
                <>
                  <span>Create Encrypted Account</span>
                  <ShieldCheck size={16} />
                </>
              )}
            </button>
          </form>
        )}
        {/* Quick Demo Pre-fill Pills */}
        <div className="auth-quick-fill-section">
          <span className="quick-fill-label">
            <Sparkles size={13} /> Quick Demo Profiles:
          </span>
          <div className="quick-fill-chips">
            <button
              type="button"
              className="quick-fill-chip"
              onClick={() => {
                setAuthMode('login');
                handleQuickFill('Kalyani', 'kalyani@dataraksha.ai');
              }}
            >
              Sign In as Kalyani
            </button>
            <button
              type="button"
              className="quick-fill-chip"
              onClick={() => {
                setAuthMode('login');
                handleQuickFill('Admin', 'admin@dataraksha.ai');
              }}
            >
              Sign In as Admin
            </button>
            <button
              type="button"
              className="quick-fill-chip"
              onClick={() => handleQuickEmailSignIn('iddhik1208@gmail.com')}
            >
              Sign In as iddhik1208@gmail.com
            </button>
            {savedName && (
              <button
                type="button"
                className="quick-fill-chip reset-chip"
                onClick={() => {
                  setLoginEmail('');
                  setLoginPassword('');
                  localStorage.removeItem('dataraksha_person_name');
                  localStorage.removeItem('dataraksha_saved_email');
                  setLoginErrors({});
                }}
                title="Clear saved name"
              >
                <RotateCcw size={12} /> Clear Saved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
