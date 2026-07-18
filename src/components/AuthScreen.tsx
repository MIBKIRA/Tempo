import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Chrome, ArrowRight, Command, Check, AlertCircle, Calendar, AtSign } from 'lucide-react';
import { Logo, LogoSm } from './Logo';
import { supabase } from '../supabaseClient';
import EngineeredButton from './EngineeredButton';

interface AuthScreenProps {
  onLoginSuccess: (email: string, name: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    username?: string;
    email?: string;
    dob?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      
      if (e.key === 'Tab' && !isInput) {
        e.preventDefault();
        setActiveTab(prev => prev === 'signin' ? 'signup' : 'signin');
        flashKeyMessage('Tab');
      }

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('signin');
        flashKeyMessage('Alt + 1');
      }
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('signup');
        flashKeyMessage('Alt + 2');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      // Validate origin to ensure security match
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('supabase.co')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { isComplete, email, name } = event.data;
        onLoginSuccess(email || 'google-user@domain.com', name || 'Google User');
        window.dispatchEvent(new Event('tempo-profile-updated'));
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        setErrorMessage('Failed to complete Google Sign-In.');
        setIsSubmitting(false);
      }
    };

    window.addEventListener('message', handleOauthMessage);
    return () => window.removeEventListener('message', handleOauthMessage);
  }, [onLoginSuccess]);

  const flashKeyMessage = (key: string) => {
    setLastKeyPressed(key);
    const timer = setTimeout(() => {
      setLastKeyPressed(null);
    }, 2000);
    return () => clearTimeout(timer);
  };

  const getPasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0: return { label: 'Empty', color: '#4A4A52' };
      case 1: return { label: 'Weak', color: '#FB7185' };
      case 2: return { label: 'Fair', color: '#FBBF24' };
      case 3: return { label: 'Good', color: '#34D399' };
      case 4: return { label: 'Unstoppable', color: '#34D399' };
      default: return { label: 'Empty', color: '#4A4A52' };
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("signIn response:", { data, error });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setSuccessMessage('Successfully Authenticated');
        const userFullName = data.user?.user_metadata?.full_name || 'Adrian Vance';
        onLoginSuccess(email, userFullName);
      } else {
        setErrorMessage("User session could not be established.");
      }
    } catch (err: any) {
      console.error("signIn unexpected error:", err);
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear state
    setValidationErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors: {
      fullName?: string;
      username?: string;
      email?: string;
      dob?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // 1. Full name validation
    if (!fullName) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Username validation
    if (!username) {
      errors.username = 'Username is required.';
    } else if (username.length < 3 || username.length > 20) {
      errors.username = 'Username must be between 3 and 20 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, or underscores with no spaces.';
    }

    // 3. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 4. DOB validation (must be 13+)
    if (!dob) {
      errors.dob = 'Date of birth is required.';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 13) {
        errors.dob = 'You must be at least 13 years old to sign up';
      }
    }

    // 5. Password validation
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    // 6. Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // If any validation errors, set them and abort
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            date_of_birth: dob,
          },
        },
      });

      console.log("signUp response:", { data, error });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Check registration progress status
      // We do NOT redirect immediately
      setIsSignupSuccess(true);
    } catch (err: any) {
      console.error("signUp unexpected error:", err);
      setErrorMessage(err.message || 'An unexpected error occurred during sign up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address first.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setSuccessMessage(`Reset link dispatched to ${email}`);
    } catch (err: any) {
      console.error("forgotPassword unexpected error:", err);
      setErrorMessage(err.message || 'A problem occurred sending the reset email.');
    }
  };

  const handleGoogleSSO = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          skipBrowserRedirect: true
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('Google OAuth failed to provide redirects.');
      }

      const googleOauthPopup = window.open(
        data.url,
        'google_oauth_tab_popup',
        'width=500,height=600,status=no,resizable=yes,scrollbars=yes'
      );

      if (!googleOauthPopup) {
        setErrorMessage('Please allow popups for this site to complete connection.');
        setIsSubmitting(false);
        return;
      }

      const checkPopupClosed = setInterval(() => {
        if (googleOauthPopup.closed) {
          clearInterval(checkPopupClosed);
          setIsSubmitting(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Google SSO Error:', err);
      setErrorMessage(err.message || 'Something went wrong, try again');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full select-none bg-[#0D0D0F] text-[#F1F1F1] font-sans flex flex-col md:flex-row overflow-x-hidden relative">
      
      <style>{`
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.3deg); }
        }
        @keyframes card-float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-0.3deg); }
        }
        @keyframes card-float-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(0.2deg); }
        }
        @keyframes fade-in-grid {
          0% { opacity: 0; }
          100% { opacity: 0.12; }
        }
        @keyframes gravity-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 113, 133, 0); }
          50%      { box-shadow: 0 0 0 8px rgba(251, 113, 133, 0.3); }
        }
        @keyframes pulse-accent-dot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .animate-grid-fade {
          animation: fade-in-grid 2.5s ease-out forwards;
        }
        .feature-card {
          opacity: 0;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.2s ease;
        }
        .feature-card:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          transform: scale(1.02);
        }
        .feature-card-1 {
          animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, card-float-1 7s ease-in-out infinite alternate;
          animation-delay: 0.2s, 1.0s;
        }
        .feature-card-2 {
          animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, card-float-2 8s ease-in-out infinite alternate-reverse;
          animation-delay: 0.4s, 1.2s;
        }
        .feature-card-3 {
          animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, card-float-3 7.5s ease-in-out infinite alternate;
          animation-delay: 0.6s, 1.4s;
        }
        .coral-pulse-dot {
          animation: gravity-pulse 2s infinite;
        }
        .glowing-dot {
          animation: pulse-accent-dot 2.5s infinite ease-in-out;
        }
        .form-stagger-container > * {
          opacity: 0;
          animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .form-stagger-container > *:nth-child(1) { animation-delay: 0.05s; }
        .form-stagger-container > *:nth-child(2) { animation-delay: 0.10s; }
        .form-stagger-container > *:nth-child(3) { animation-delay: 0.15s; }
        .form-stagger-container > *:nth-child(4) { animation-delay: 0.20s; }
        .form-stagger-container > *:nth-child(5) { animation-delay: 0.25s; }
        .form-stagger-container > *:nth-child(6) { animation-delay: 0.30s; }
        .form-stagger-container > *:nth-child(7) { animation-delay: 0.35s; }
        .form-stagger-container > *:nth-child(8) { animation-delay: 0.40s; }
        .form-stagger-container > *:nth-child(9) { animation-delay: 0.45s; }
        .form-stagger-container > *:nth-child(10) { animation-delay: 0.50s; }

        .tempo-input {
          background-color: var(--tempo-bg-tertiary);
          border: 1px solid var(--tempo-border);
          color: var(--tempo-text-primary);
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tempo-input:focus {
          outline: none;
          border-color: var(--tempo-accent-blue);
          box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
        }
        .btn-gradient {
          background: linear-gradient(135deg, var(--tempo-accent-blue), var(--tempo-accent-purple));
          color: #FFFFFF;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-gradient:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25), 0 0 0 2px rgba(79, 142, 247, 0.2);
        }
        .btn-gradient:active:not(:disabled) {
          transform: scale(0.97);
        }
        .strength-bar {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
        }
        .tab-underline {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .key-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--tempo-border);
          padding: 1px 4px;
          border-radius: 4px;
        }
      `}</style>

      {lastKeyPressed && (
        <div id="keyboard-toast" className="fixed top-8 right-8 z-50 bg-[#141416]/95 border border-[#4F8EF7]/40 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-[slide-up-fade_0.2s_ease-out]">
          <div className="flex p-1 bg-[#1C1C1F] border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-[#4F8EF7] font-semibold uppercase">
            {lastKeyPressed}
          </div>
          <span className="text-sm font-sans text-[#F1F1F1]">Triggered Shortcut</span>
        </div>
      )}

      {/* LEFT PANEL */}
      <div id="brand-panel" className="w-full md:w-[45%] flex flex-col justify-between p-8 md:p-16 relative overflow-hidden border-b md:border-b-0 md:border-r border-[#2A2A2D]">
        
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 animate-grid-fade"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(circle at 45% 45%, black 40%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(circle at 45% 45%, black 40%, transparent 95%)'
          }}
        />

        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#8B5CF6]/5 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#2DD4BF]/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-2.5 z-10 select-none">
          <LogoSm className="w-8 h-8 rounded-lg shadow-lg" />
          <span className="text-sm font-mono font-bold tracking-widest text-[#F1F1F1]">TEMPO</span>
        </div>

        <div className="my-auto py-12 md:py-20 flex flex-col justify-center relative z-10">
          <div className="w-32 h-32 mb-8 flex items-center justify-center">
            <Logo className="w-32 h-32" />
          </div>
          <h1 className="text-8xl tracking-tighter font-serif text-[#F1F1F1] select-none font-medium mb-4">
            TEMPO
          </h1>
          <p className="text-lg md:text-xl text-[#8A8A90] font-sans font-light tracking-wide max-w-sm mb-12">
            Every hour. <span className="text-[#F1F1F1] font-medium">Intentional.</span>
          </p>

          <div className="flex flex-col gap-4 max-w-md w-full">
            <div id="feature-card-1" className="feature-card feature-card-1 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] glowing-dot" />
                </div>
                <span className="text-sm font-sans font-medium text-[#F1F1F1] tracking-wide">
                  Energy-Aware Planning
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                ⚡ Focus
              </span>
            </div>

            <div id="feature-card-2" className="feature-card feature-card-2 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] coral-pulse-dot" />
                </div>
                <span className="text-sm font-sans font-medium text-[#F1F1F1] tracking-wide">
                  Gravity Task System
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                🎯 Orbit
              </span>
            </div>

            <div id="feature-card-3" className="feature-card feature-card-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF] glowing-dot" />
                </div>
                <span className="text-sm font-sans font-medium text-[#F1F1F1] tracking-wide">
                  Velocity Dashboard
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                📊 Analytics
              </span>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-[#4A4A52] font-mono select-none flex items-center gap-2">
          <span>DESIGN SPEC 1.04</span>
          <span>•</span>
          <span>SYSTEM OF ACTIONS</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div id="auth-panel" className="w-full md:w-[55%] flex flex-col justify-between py-12 px-6 md:px-16 lg:px-24 bg-[#0D0D0F] relative">
        
        <div className="flex justify-between items-center w-full max-w-[400px] mx-auto mb-8 md:mb-0 select-none">
          <span className="text-xs text-[#8A8A90] font-sans">Keyboard Navigation</span>
          <span className="text-[11px] font-mono text-[#4A4A52] flex items-center gap-1">
            Press <kbd className="key-badge">Tab</kbd> to toggle view
          </span>
        </div>

        <div id="auth-card" className="w-full max-w-[400px] mx-auto p-6 md:p-8 bg-[#141416] border border-[#2A2A2D] rounded-2xl shadow-2xl relative z-10 transition-all duration-300">
          
          <div className="flex border-b border-[#2A2A2D] pb-3 relative mb-8 select-none">
            <button
              id="tab-signin"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
                setValidationErrors({});
                setIsSignupSuccess(false);
              }}
              className="w-1/2 text-center py-2 text-sm font-sans font-medium cursor-pointer relative transition-colors duration-200"
              style={{ color: activeTab === 'signin' ? '#F1F1F1' : '#4A4A52' }}
            >
              Sign In
              <span className="ml-1.5 text-[10px] font-mono opacity-40 hover:opacity-100 hidden sm:inline-block border border-white/10 bg-white/5 rounded px-1">
                Alt+1
              </span>
            </button>
            <button
              id="tab-signup"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
                setValidationErrors({});
                setIsSignupSuccess(false);
              }}
              className="w-1/2 text-center py-2 text-sm font-sans font-medium cursor-pointer relative transition-colors duration-200"
              style={{ color: activeTab === 'signup' ? '#F1F1F1' : '#4A4A52' }}
            >
              Sign Up
              <span className="ml-1.5 text-[10px] font-mono opacity-40 hover:opacity-100 hidden sm:inline-block border border-white/10 bg-white/5 rounded px-1">
                Alt+2
              </span>
            </button>
            
            <div 
              className="absolute bottom-0 left-0 h-[2px] bg-[#4F8EF7] tab-underline"
              style={{
                width: '50%',
                transform: activeTab === 'signin' ? 'translateX(0%)' : 'translateX(100%)',
              }}
            />
          </div>

          {successMessage && (
            <div id="success-banner" className="mb-6 p-3 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 text-xs text-[#34D399] flex items-start gap-2.5 animate-[slide-up-fade_0.20s_ease-out]">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div id="error-banner" className="mb-6 p-3 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/20 text-xs text-[#FB7185] flex items-start gap-2.5 animate-[slide-up-fade_0.20s_ease-out]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div key={activeTab} className="form-stagger-container">
            {activeTab === 'signin' ? (
              <form id="signin-form" onSubmit={handleSignIn} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signin-email" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signin-email"
                      type="email"
                      required
                      placeholder="e.g., adrian@tempo.so"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="signin-password" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={handleForgotPassword}
                      className="text-xs font-sans text-[#4F8EF7] hover:underline cursor-pointer bg-none border-none outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="tempo-input w-full pl-10 pr-10 h-[44px] text-sm rounded-lg"
                    />
                    <button
                      id="signin-password-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1 text-[#4A4A52] hover:text-[#8A8A90] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    id="signin-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-[#1C1C1F] border border-[#2A2A2D] rounded text-[#4F8EF7] focus:ring-1 focus:ring-offset-0 focus:ring-[#4F8EF7]"
                  />
                  <label htmlFor="signin-remember" className="text-xs text-[#8A8A90] cursor-pointer hover:text-[#F1F1F1] transition-colors duration-150">
                    Stay logged in on this machine
                  </label>
                </div>

                <div className="flex justify-center w-full">
                  <EngineeredButton
                    id="signin-btn-submit"
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    hasError={!!errorMessage}
                    hintText="↵ enter"
                  >
                    Sign In
                  </EngineeredButton>
                </div>

                <div className="flex items-center gap-3 my-2 select-none">
                  <div className="h-[1px] flex-grow bg-[#2A2A2D]" />
                  <span className="text-[10px] font-mono text-[#4A4A52] uppercase tracking-widest">
                    or continue with
                  </span>
                  <div className="h-[1px] flex-grow bg-[#2A2A2D]" />
                </div>

                <div className="flex justify-center w-full">
                  <EngineeredButton
                    id="signin-google-sso"
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={handleGoogleSSO}
                  >
                    Continue with Google
                  </EngineeredButton>
                </div>
              </form>
            ) : isSignupSuccess ? (
              <div id="signup-success-view" className="flex flex-col gap-6 py-4 animate-[slide-up-fade_0.20s_ease-out]">
                <div className="p-4 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#34D399]/20 flex items-center justify-center text-[#34D399] select-none">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-[#F1F1F1] leading-relaxed font-sans font-medium">
                    ✅ Account created! Check your email to confirm your account before signing in.
                  </p>
                </div>
                
                <div className="flex justify-center w-full">
                  <EngineeredButton
                    id="go-to-signin-btn"
                    type="button"
                    variant="primary"
                    onClick={() => {
                      setActiveTab('signin');
                      setIsSignupSuccess(false);
                      setSuccessMessage(null);
                      setErrorMessage(null);
                    }}
                  >
                    Go to Sign In
                  </EngineeredButton>
                </div>
              </div>
            ) : (
              <form id="signup-form" onSubmit={handleSignUp} className="flex flex-col gap-4">
                {/* 1. Full name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-name" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      placeholder="e.g., Adrian Vance"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (validationErrors.fullName) {
                          setValidationErrors(prev => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg ${validationErrors.fullName ? 'border-[#FB7185]/50' : ''}`}
                    />
                  </div>
                  {validationErrors.fullName && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.fullName}
                    </span>
                  )}
                </div>

                {/* 2. Username */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-username" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Username
                  </label>
                  <div className="relative flex items-center">
                    <AtSign className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-username"
                      type="text"
                      required
                      placeholder="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (validationErrors.username) {
                          setValidationErrors(prev => ({ ...prev, username: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg ${validationErrors.username ? 'border-[#FB7185]/50' : ''}`}
                    />
                  </div>
                  {validationErrors.username && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.username}
                    </span>
                  )}
                </div>

                {/* 3. Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-email" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      placeholder="adrian@tempo.so"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg ${validationErrors.email ? 'border-[#FB7185]/50' : ''}`}
                    />
                  </div>
                  {validationErrors.email && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.email}
                    </span>
                  )}
                </div>

                {/* 4. Date of Birth */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-dob" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Date of Birth
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        if (validationErrors.dob) {
                          setValidationErrors(prev => ({ ...prev, dob: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg ${validationErrors.dob ? 'border-[#FB7185]/50' : ''}`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  {validationErrors.dob && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.dob}
                    </span>
                  )}
                </div>

                {/* 5. Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-password" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-10 h-[44px] text-sm rounded-lg ${validationErrors.password ? 'border-[#FB7185]/50' : ''}`}
                    />
                    <button
                      id="signup-password-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1 text-[#4A4A52] hover:text-[#8A8A90] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.password}
                    </span>
                  )}

                  <div id="password-strength-section" className="mt-1 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-[10px] text-[#4A4A52] font-mono">Password strength</span>
                      {password && (
                        <span 
                          className="text-[10px] font-mono font-medium tracking-wide uppercase"
                          style={{ color: getStrengthLabel(strength).color }}
                        >
                          {getStrengthLabel(strength).label}
                        </span>
                      )}
                    </div>
                    
                    <div id="strength-bars-container" className="flex gap-1.5 h-1 w-full select-none">
                      {[1, 2, 3, 4].map((barIndex) => {
                        const isFilled = strength >= barIndex;
                        let barColor = '#2A2A2D';
                        
                        if (isFilled) {
                          if (strength === 1) barColor = '#FB7185';
                          else if (strength === 2) barColor = '#FBBF24';
                          else barColor = '#34D399';
                        }

                        return (
                          <div
                            key={barIndex}
                            className="h-full flex-grow rounded-full strength-bar"
                            style={{ backgroundColor: barColor }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 6. Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-confirm-password" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (validationErrors.confirmPassword) {
                          setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      className={`tempo-input w-full pl-10 pr-10 h-[44px] text-sm rounded-lg ${validationErrors.confirmPassword ? 'border-[#FB7185]/50' : ''}`}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                      {validationErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="flex justify-center w-full mt-2">
                  <EngineeredButton
                    id="signup-btn-submit"
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    hasError={!!errorMessage}
                    hintText="↵ enter"
                  >
                    Create Account
                  </EngineeredButton>
                </div>

                <div className="flex items-center gap-3 my-2 select-none">
                  <div className="h-[1px] flex-grow bg-[#2A2A2D]" />
                  <span className="text-[10px] font-mono text-[#4A4A52] uppercase tracking-widest">
                    OR
                  </span>
                  <div className="h-[1px] flex-grow bg-[#2A2A2D]" />
                </div>

                <div className="flex justify-center w-full">
                  <EngineeredButton
                    id="signup-google-sso"
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={handleGoogleSSO}
                  >
                    Continue with Google
                  </EngineeredButton>
                </div>

                <p id="signup-disclaimer" className="text-[11px] text-[#4A4A52] font-sans text-center mt-3 leading-relaxed">
                  By signing up you agree to our{' '}
                  <a href="#" className="text-[#8A8A90] hover:text-[#F1F1F1] underline">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-[#8A8A90] hover:text-[#F1F1F1] underline">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>

        <div id="auth-footer" className="w-full text-center mt-8 select-none">
          <p className="text-xs text-[#4A4A52] font-sans tracking-wide">
            Trusted by <span className="text-[#8A8A90] font-semibold">12,000+</span> knowledge workers globally
          </p>
          <div className="flex gap-4 items-center justify-center mt-3 opacity-30 grayscale saturate-0">
            <span className="text-[10px] font-mono tracking-widest uppercase">LINEAR</span>
            <span className="text-sm font-light font-sans">•</span>
            <span className="text-[10px] font-mono tracking-widest uppercase">OBSIDIAN</span>
            <span className="text-sm font-light font-sans">•</span>
            <span className="text-[10px] font-mono tracking-widest uppercase">STRIPE</span>
          </div>
        </div>

      </div>

    </div>
  );
}
