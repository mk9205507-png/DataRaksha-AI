import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({ onAuthSuccess }) => {
  const { login } = useAuth();

  // Check if user has signed in before
  const savedName = localStorage.getItem('dataraksha_person_name') || '';
  const savedEmail = localStorage.getItem('dataraksha_saved_email') || '';
  const hasSignedInBefore = Boolean(savedName);

  // Form inputs: Name, Email, Password
  // If signed in before, prefill name and email so they can confirm or change it!
  const [name, setName] = useState(savedName || 'Kalyani');
  const [email, setEmail] = useState(savedEmail || (savedName ? 'kalyani@dataraksha.ai' : ''));
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Please enter your name.';
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setAlert(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const trimmedName = name.trim();
      // Save name & email so the app always remembers and calls them by name!
      localStorage.setItem('dataraksha_person_name', trimmedName);
      localStorage.setItem('dataraksha_saved_email', email.trim());

      const result = await login({
        name: trimmedName,
        email: email.trim(),
        password,
      });

      const authenticatedUser = {
        ...result.user,
        displayName: trimmedName,
      };

      if (onAuthSuccess) {
        onAuthSuccess(authenticatedUser);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Authentication failed. Please verify credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickFill = (fillName, fillEmail) => {
    setName(fillName);
    setEmail(fillEmail);
    setPassword('SecureP@ss2026');
    setFieldErrors({});
    setAlert(null);
  };

  return (
    <div className="auth-page-wrapper" id="auth-page-view">
      <div className="auth-card-panel card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-shield-icon">
            <Shield size={28} className="shield-svg" />
          </div>

          {hasSignedInBefore ? (
            <>
              <h2 className="auth-main-title">
                Welcome back, <span className="text-blue">{savedName}</span>!
              </h2>
              <p className="auth-sub-title">
                Confirm your name and credentials below to access your security dashboard.
              </p>
            </>
          ) : (
            <>
              <h2 className="auth-main-title">Sign In to DataRaksha AI</h2>
              <p className="auth-sub-title">
                Enter your name, email, and password to access your threat protection dashboard.
              </p>
            </>
          )}
        </div>

        {alert && (
          <div className="auth-alert-box">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* 3 Input Form: Name, Email, Password */}
        <form onSubmit={handleSignIn} className="auth-input-form" noValidate>
          {/* Field 1: Name */}
          <div className="form-field-group">
            <label htmlFor="auth-name-input" className="form-label">
              Your Name
            </label>
            <div className={`input-wrapper ${fieldErrors.name ? 'has-error' : ''}`}>
              <User size={18} className="input-icon text-muted" />
              <input
                id="auth-name-input"
                type="text"
                className="input-field auth-text-input"
                placeholder="Enter your name (e.g. Kalyani)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                }}
                disabled={isLoading}
                autoFocus={!hasSignedInBefore}
              />
            </div>
            {fieldErrors.name && (
              <span className="field-error-msg">{fieldErrors.name}</span>
            )}
          </div>

          {/* Field 2: Email */}
          <div className="form-field-group">
            <label htmlFor="auth-email-input" className="form-label">
              Email Address
            </label>
            <div className={`input-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
              <Mail size={18} className="input-icon text-muted" />
              <input
                id="auth-email-input"
                type="email"
                className="input-field auth-text-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-msg">{fieldErrors.email}</span>
            )}
          </div>

          {/* Field 3: Password */}
          <div className="form-field-group">
            <label htmlFor="auth-password-input" className="form-label">
              Password
            </label>
            <div className={`input-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
              <Lock size={18} className="input-icon text-muted" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                className="input-field auth-text-input pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
                disabled={isLoading}
                autoFocus={hasSignedInBefore}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="field-error-msg">{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary auth-submit-btn w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner sm" /> Entering Dashboard...
              </>
            ) : (
              <>
                <span>Sign In as {name.trim() || 'User'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill Pills */}
        <div className="auth-quick-fill-section">
          <span className="quick-fill-label">
            <Sparkles size={13} /> Quick Sign In Options:
          </span>
          <div className="quick-fill-chips">
            <button
              type="button"
              className="quick-fill-chip"
              onClick={() => handleQuickFill('Kalyani', 'kalyani@dataraksha.ai')}
            >
              Sign In as Kalyani
            </button>
            <button
              type="button"
              className="quick-fill-chip"
              onClick={() => handleQuickFill('Admin', 'admin@dataraksha.ai')}
            >
              Sign In as Admin
            </button>
            {hasSignedInBefore && (
              <button
                type="button"
                className="quick-fill-chip reset-chip"
                onClick={() => {
                  setName('');
                  setEmail('');
                  setPassword('');
                  localStorage.removeItem('dataraksha_person_name');
                  localStorage.removeItem('dataraksha_saved_email');
                  setFieldErrors({});
                }}
                title="Clear saved name"
              >
                <RotateCcw size={12} /> Clear Saved Name
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
