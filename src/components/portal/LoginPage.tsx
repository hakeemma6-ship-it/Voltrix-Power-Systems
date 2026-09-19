'use client';
/**
 * LoginPage — Clean unified login for Admin, Dealer, and Customer.
 * Now includes Google / Auth0 Login integration with automatic 
 * profile completion onboarding for new Google signins.
 * Styled in a premium Split-Screen layout with clean light theme form.
 */

import React, { useState, useEffect } from 'react';
import { Zap, LogIn, Eye, EyeOff, ArrowLeft, UserPlus, User, Phone, CheckCircle, Mail } from 'lucide-react';

interface Props {
  onAdminLogin: (admin: any, isActiveLogin: boolean) => void;
  onDealerLogin: (dealer: any, isActiveLogin: boolean) => void;
  onCustomerLogin: (customer: any, isActiveLogin: boolean) => void;
  onNavigate: (hash: string) => void;
  dealerSession: any;
  adminSession: any;
  customerSession: any;
}

type Tab = 'login' | 'register' | 'forgot';

export default function LoginPage({ onAdminLogin, onDealerLogin, onCustomerLogin, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields - Default to Indian Mobile Number (+91) with option for Email
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register fields (customer only)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Forgot password fields
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');

  // 2FA / OTP State
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpRole, setOtpRole] = useState('');

  // Google Onboarding State
  const [onboardingData, setOnboardingData] = useState<{ email: string; name: string; phone: string } | null>(null);
  const [onboardingOtpSent, setOnboardingOtpSent] = useState(false);
  const [onboardingOtp, setOnboardingOtp] = useState('');

  // Interactive Simulation Mode State
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');
  const [mockGoogleName, setMockGoogleName] = useState('');

  // Catch Auth0 callbacks/parameters on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search || (url.hash.includes('?') ? url.hash.substring(url.hash.indexOf('?')) : ''));

    const token = params.get('auth0_token');
    const onboarding = params.get('google_onboarding');
    const email = params.get('email');
    const name = params.get('name');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Sanitise url
      const hashPath = window.location.hash.includes('?') ? window.location.hash.split('?')[0] : window.location.hash;
      window.history.replaceState({}, document.title, window.location.pathname + hashPath);
    }

    if (token) {
      localStorage.setItem('voltrix_auth_token', token);
      const fetchSession = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              if (data.user.role === 'admin') onAdminLogin(data.user, true);
              else if (data.user.role === 'dealer') onDealerLogin(data.user, true);
              else if (data.user.role === 'customer') onCustomerLogin(data.user, true);
            }
          }
        } catch {
          setError('Failed to query active session details.');
        } finally {
          setLoading(false);
        }
      };
      fetchSession();
      const hashPath = window.location.hash.includes('?') ? window.location.hash.split('?')[0] : window.location.hash;
      window.history.replaceState({}, document.title, window.location.pathname + hashPath);
    }

    if (onboarding && email) {
      setOnboardingData({
        email: decodeURIComponent(email),
        name: decodeURIComponent(name || ''),
        phone: ''
      });
      const hashPath = window.location.hash.includes('?') ? window.location.hash.split('?')[0] : window.location.hash;
      window.history.replaceState({}, document.title, window.location.pathname + hashPath);
    }

    const paramEmail = params.get('email');
    const paramPassword = params.get('password');
    if (paramEmail && paramPassword) {
      const decodedIdentifier = decodeURIComponent(paramEmail).trim();
      if (decodedIdentifier.includes('@')) {
        setLoginMethod('email');
        setLoginEmail(decodedIdentifier);
      } else {
        setLoginMethod('phone');
        setLoginPhone(decodedIdentifier.replace(/^\+91/, '').replace(/\D/g, ''));
      }
      setLoginPass(decodeURIComponent(paramPassword));
      setTab('login');
      window.history.replaceState({}, document.title, window.location.pathname + '#login');
    }
  }, [onAdminLogin, onDealerLogin, onCustomerLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    let identifier = '';
    if (loginMethod === 'phone') {
      const digits = loginPhone.replace(/\D/g, '');
      if (!digits) {
        setError('Please enter your 10-digit mobile number.');
        return;
      }
      if (digits.length !== 10) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      identifier = `+91${digits}`;
    } else {
      if (!loginEmail.trim()) {
        setError('Please enter your email address.');
        return;
      }
      identifier = loginEmail.trim();
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
      } else {
        if (data.requiresOtp) {
          setRequiresOtp(true);
          setOtpEmail(data.phone || identifier);
          setOtpRole(data.role);
          setSuccess('OTP sent via 2Factor SMS to your registered mobile number.');
        } else {
          if (data.token) localStorage.setItem('voltrix_auth_token', data.token);
          if (data.user?.role === 'admin') {
            onAdminLogin(data.user, true);
          } else if (data.user?.role === 'dealer') {
            onDealerLogin(data.user, true);
          } else if (data.user?.role === 'customer') {
            onCustomerLogin(data.user, true);
          }
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setLoading(true);
    try {
      const digits = loginPhone.replace(/\D/g, '');
      const currentIdentifier = loginMethod === 'phone' ? `+91${digits}` : loginEmail.trim();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail || currentIdentifier, identifier: currentIdentifier, password: loginPass, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid OTP.');
      } else {
        if (data.token) localStorage.setItem('voltrix_auth_token', data.token);
        if (data.user?.role === 'admin') {
          onAdminLogin(data.user, true);
        } else if (data.user?.role === 'dealer') {
          onDealerLogin(data.user, true);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPhone || !regPass) {
      setError('All fields are required.');
      return;
    }
    if (regPass !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (regPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim(),
          password: regPass,
          confirmPassword: regConfirm,
          role: 'customer'
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        setSuccess('Account created! You can now log in.');
        setTab('login');
        if (regPhone) {
          setLoginMethod('phone');
          setLoginPhone(regPhone.replace(/^\+91/, '').replace(/\D/g, ''));
        } else {
          setLoginMethod('email');
          setLoginEmail(regEmail.trim().toLowerCase());
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to Mobile Number for Password Reset
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const cleanDigits = forgotPhone.replace(/\D/g, '');
    if (!cleanDigits) {
      setError('Please enter your registered mobile number.');
      return;
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : forgotPhone.trim();
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setForgotStep(2);
        setSuccess(data.message || 'OTP sent via 2Factor SMS to your registered mobile number.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleForgotVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotOtp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: forgotPhone.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPass.trim(),
          confirmPassword: forgotConfirmPass.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccess(data.message || 'Password reset successfully! You can now log in.');
        // Return to login tab with phone prefilled
        setTab('login');
        setLoginEmail(forgotPhone.trim());
        setLoginPass('');
        setForgotStep(1);
        setForgotPhone('');
        setForgotOtp('');
        setForgotNewPass('');
        setForgotConfirmPass('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Triggers Auth0 redirection or shows Interactive Onboarding Simulation Modal
  const handleGoogleLoginClick = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/auth0-config');
      if (res.ok) {
        const config = await res.json();
        if (config.configured && config.authUrl) {
          // Redirecting to Auth0
          window.location.href = config.authUrl;
        } else {
          // Open mock simulation popup
          setShowMockGoogleModal(true);
        }
      } else {
        setShowMockGoogleModal(true);
      }
    } catch {
      setShowMockGoogleModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Finishes Google login check (for mock popup entries)
  const handleMockGoogleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockGoogleEmail) return;
    setError('');
    setLoading(true);
    setShowMockGoogleModal(false);
    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockGoogleEmail, name: mockGoogleName }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.onboarded) {
          // Fully onboarded - log them in directly
          if (data.token) localStorage.setItem('voltrix_auth_token', data.token);
          onCustomerLogin(data.user, true);
        } else {
          // Needs onboarding
          setOnboardingData({
            email: data.email,
            name: data.name || '',
            phone: ''
          });
          setOnboardingOtpSent(false);
          setOnboardingOtp('');
        }
      } else {
        setError(data.error || 'Simulated Google login failed.');
      }
    } catch {
      setError('Network simulation error.');
    } finally {
      setLoading(false);
    }
  };

  // Google Onboarding Step 1: Send OTP to Mobile Number
  const handleSendOnboardingOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData?.name || !onboardingData?.phone) {
      setError('Name and Mobile phone number are required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google-onboard/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: onboardingData.email,
          phone: onboardingData.phone
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP to this mobile number.');
      } else {
        setOnboardingOtpSent(true);
        setSuccess(data.message || 'OTP sent! Please enter the 6-digit verification code.');
      }
    } catch {
      setError('Network error sending verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Google Onboarding Step 2: Verify OTP and finalize profile
  const handleVerifyOnboardingOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingData?.phone || !onboardingOtp) {
      setError('Mobile number and 6-digit OTP are required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google-onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: onboardingData.email,
          name: onboardingData.name,
          phone: onboardingData.phone,
          otp: onboardingOtp.trim()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem('voltrix_auth_token', data.token);
        onCustomerLogin(data.user, true);
      } else {
        setError(data.error || 'Failed to verify OTP or complete profile.');
      }
    } catch {
      setError('Database submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 px-4 py-3 text-sm focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-semibold placeholder:text-slate-400 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden font-sans">

      {/* Floating background glow (Left side support on mobile/desktop) */}
      <div className="absolute inset-0 pointer-events-none md:hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Forms column (Left side) */}
      <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[35%] bg-white flex flex-col justify-between p-8 sm:p-12 shadow-2xl z-10 border-r border-slate-100 min-h-screen">

        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (onboardingData) {
                setOnboardingData(null);
              } else {
                onNavigate('#home');
              }
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 text-xs font-bold uppercase transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{onboardingData ? 'Cancel' : 'Home'}</span>
          </button>

          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#10b981] text-white">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] text-[#0A2342] font-black uppercase tracking-wider">Voltrix Portal</span>
          </div>
        </div>

        {/* Center content wrapper */}
        <div className="my-auto space-y-7">

          {/* Headline titles */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0A2342] uppercase tracking-tight leading-none">
              {requiresOtp ? 'Two-Factor Verification' : onboardingData ? 'Finish Profile' : tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Sign Up' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {requiresOtp
                ? 'Enter the 6-digit OTP sent via 2Factor SMS to continue.'
                : onboardingData
                ? 'Associate your mobile number to complete Google OAuth registration.'
                : tab === 'login'
                  ? 'Sign in to access your inquiries, AMC tracker, & quotations.'
                  : tab === 'register'
                  ? 'Register a customer profile to request blueprints.'
                  : 'Enter your registered mobile number to receive a verification OTP.'}
            </p>
          </div>

          {/* TWO-FACTOR OTP VIEW */}
          {requiresOtp ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  We've sent a 6-digit verification code via <strong>2Factor SMS</strong> to{' '}
                  <span className="font-extrabold text-[#0A2342]">{otpEmail}</span>.
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Enter 6-Digit SMS OTP</label>
                  <input
                    type="text"
                    className={`${inputCls} text-center font-mono text-lg tracking-[0.25em] font-extrabold`}
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-[#e11d48] text-xs font-bold bg-[#fff1f2] border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
                >
                  {loading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify OTP & Login'}
                </button>
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setRequiresOtp(false); setOtp(''); setError(''); setSuccess(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold underline transition-colors"
                  >
                    Cancel and Return to Login
                  </button>
                </div>
              </form>
            </div>
          ) : onboardingData ? (
            <div className="space-y-4">
              {!onboardingOtpSent ? (
                <form onSubmit={handleSendOnboardingOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-205 bg-slate-100 text-slate-500 px-4 py-3 text-sm focus:outline-none font-semibold shadow-sm cursor-not-allowed"
                      value={onboardingData.email}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. Anand Verma"
                      value={onboardingData.name}
                      onChange={e => setOnboardingData({ ...onboardingData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Primary Mobile Number *</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-inner">
                      <div className="flex items-center gap-1.5 px-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 select-none">
                        <span className="text-base leading-none">🇮🇳</span>
                        <span className="text-slate-800 font-black text-xs tracking-wider">+91</span>
                      </div>
                      <input
                        type="tel"
                        className="w-full px-3.5 py-3 text-slate-900 placeholder:text-slate-400 bg-transparent text-sm font-semibold tracking-wide focus:outline-none"
                        placeholder="9876543210"
                        maxLength={10}
                        value={onboardingData.phone.replace(/^\+91/, '').replace(/\D/g, '')}
                        onChange={e => setOnboardingData({ ...onboardingData, phone: `+91${e.target.value.replace(/\D/g, '')}` })}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                      A 6-digit OTP will be sent via 2Factor SMS to verify this mobile number.
                    </p>
                  </div>

                  {error && <p className="text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                  {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Phone className="h-4 w-4" />
                        <span>Send Verification OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOnboardingOtp} className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-600 font-medium">
                      Verifying mobile number: <span className="font-bold text-slate-900">{onboardingData.phone}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Enter 6-Digit SMS OTP *</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="123456"
                      maxLength={6}
                      value={onboardingOtp}
                      onChange={e => setOnboardingOtp(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {error && <p className="text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                  {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Verify & Finish Onboarding</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendOnboardingOtp}
                      className="text-slate-500 hover:text-slate-800 font-bold underline"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOnboardingOtpSent(false); setOnboardingOtp(''); setError(''); }}
                      className="text-slate-500 hover:text-slate-800 font-bold"
                    >
                      Change Phone Number
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* UNIFIED CONTAINER */
            <>
              {/* Tab Selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {(['login', 'register'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                    className={`flex-grow py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? 'bg-white text-[#0A2342] shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {t === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>

              {tab === 'register' ? (
                <div className="space-y-4">
                  <p className="text-slate-500 text-xs font-medium text-center">
                    Create a customer account.{' '}
                    <button onClick={() => onNavigate('#dealer-register')} className="text-[#10b981] font-bold hover:underline">
                      Dealer Registration →
                    </button>
                  </p>
                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input type="text" className={inputCls} placeholder="Your full name" value={regName} onChange={e => setRegName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input type="email" className={inputCls} placeholder="your@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Unique Mobile Phone</label>
                      <input type="tel" className={inputCls} placeholder="+91 99000 00000" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Password</label>
                      <input type="password" className={inputCls} placeholder="Min 6 characters" value={regPass} onChange={e => setRegPass(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Confirm Password</label>
                      <input type="password" className={inputCls} placeholder="Re-enter password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required />
                    </div>
                    {error && <p className="text-red-600 text-xs font-bold bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer">
                      {loading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="h-4 w-4" />Create Account</>}
                    </button>
                  </form>
                </div>
              ) : tab === 'forgot' ? (
                <div className="space-y-4">
                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Registered Mobile Number</label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-inner">
                          <div className="flex items-center gap-1.5 px-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 select-none">
                            <span className="text-base leading-none">🇮🇳</span>
                            <span className="text-slate-800 font-black text-xs tracking-wider">+91</span>
                          </div>
                          <input
                            type="tel"
                            className="w-full px-3.5 py-3 text-slate-900 placeholder:text-slate-400 bg-transparent text-sm font-semibold tracking-wide focus:outline-none"
                            placeholder="9876543210"
                            maxLength={10}
                            value={forgotPhone.replace(/^\+91/, '').replace(/\D/g, '')}
                            onChange={e => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                          We will send a 6-digit OTP via 2Factor SMS to verify your mobile number.
                        </p>
                      </div>
                      {error && <p className="text-red-[#e11d48] text-xs font-bold bg-[#fff1f2] border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                      {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
                      >
                        {loading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send OTP via SMS'}
                      </button>
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold underline transition-colors"
                        >
                          Back to Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotVerifyReset} className="space-y-4">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-600 font-medium">
                          OTP sent to: <span className="font-bold text-slate-900">{forgotPhone}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="123456"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={e => setForgotOtp(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">New Password</label>
                        <input
                          type="password"
                          className={inputCls}
                          placeholder="At least 6 characters"
                          value={forgotNewPass}
                          onChange={e => setForgotNewPass(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          className={inputCls}
                          placeholder="Re-enter new password"
                          value={forgotConfirmPass}
                          onChange={e => setForgotConfirmPass(e.target.value)}
                          required
                        />
                      </div>

                      {error && <p className="text-red-[#e11d48] text-xs font-bold bg-[#fff1f2] border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                      {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
                      >
                        {loading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify OTP & Reset Password'}
                      </button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleForgotSendOtp}
                          className="text-slate-500 hover:text-slate-800 font-bold underline"
                        >
                          Resend OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => { setForgotStep(1); setError(''); setSuccess(''); }}
                          className="text-slate-500 hover:text-slate-800 font-bold"
                        >
                          Change Number
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
                      </label>
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => { setLoginMethod('phone'); setError(''); }}
                          className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                            loginMethod === 'phone' ? 'bg-white text-[#0A2342] shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span>🇮🇳 +91 Mobile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLoginMethod('email'); setError(''); }}
                          className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                            loginMethod === 'email' ? 'bg-white text-[#0A2342] shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Mail className="h-3 w-3" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>

                    {loginMethod === 'phone' ? (
                      <div>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-inner">
                          <div className="flex items-center gap-1.5 px-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 select-none">
                            <span className="text-base leading-none">🇮🇳</span>
                            <span className="text-slate-800 font-black text-xs tracking-wider">+91</span>
                          </div>
                          <input
                            type="tel"
                            className="w-full px-3.5 py-3 text-slate-900 placeholder:text-slate-400 bg-transparent text-sm font-semibold tracking-wide focus:outline-none"
                            placeholder="Enter 10-digit mobile number"
                            maxLength={10}
                            value={loginPhone}
                            onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                            required
                            id="login-phone"
                            autoFocus
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          2FA verification code will be sent via 2Factor SMS to <span className="font-bold text-slate-600">+91 {loginPhone || 'XXXXXXXXXX'}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          className={`${inputCls} pl-11`}
                          placeholder="e.g. your@email.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          required
                          id="login-email"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        className={`${inputCls} pr-12`}
                        placeholder="Your password"
                        value={loginPass}
                        onChange={e => setLoginPass(e.target.value)}
                        required
                        id="login-password"
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setTab('forgot'); setError(''); setSuccess(''); }}
                        className="text-[10px] font-bold text-brand-green hover:text-emerald-700 hover:underline uppercase tracking-wider transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-[#e11d48] text-xs font-bold bg-[#fff1f2] border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
                  {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-250 px-3.5 py-2.5 rounded-xl">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    id="login-submit-btn"
                    className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
                  >
                    {loading
                      ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><LogIn className="h-4 w-4" />Login</>}
                  </button>

                  {/* Google Sign In Divider */}
                  <>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <hr className="w-full border-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">OR</span>
                      <hr className="w-full border-slate-200" />
                    </div>

                    {/* Continue with Google button */}
                    <button
                      type="button"
                      onClick={handleGoogleLoginClick}
                      disabled={loading}
                      className="w-full h-12 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </>

                  <p className="text-center text-xs text-slate-500 font-semibold pt-2">
                    Authorized Dealer?{' '}
                    <button type="button" onClick={() => onNavigate('#dealer-register')} className="text-[#10b981] font-bold hover:underline">
                      Access Dealer Portal →
                    </button>
                  </p>
                </form>
              )}
            </>
          )}

        </div>

        {/* Footer info branding */}
        <div className="pt-8 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
            Fortune Traders Regional Hub • Hyderabad
          </p>
        </div>

      </div>

      {/* Brand marketing showcase column (Right side) */}
      <div className="hidden md:flex md:flex-1 bg-[#0A2342] relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
        {/* Glow rings */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Background grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Small top logo mark */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981] shadow-md shadow-emerald-500/25">
            <Zap className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="text-white font-black tracking-widest text-[11px] uppercase">Voltrix Technology</span>
        </div>

        {/* Brand copywriting content */}
        <div className="max-w-[480px] space-y-8 z-10 my-auto">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 uppercase tracking-widest px-3.5 py-1.5 rounded-lg inline-block">B2B Power Logistics Hub</span>
            <h2 className="text-3xl lg:text-4xl text-white font-extrabold tracking-tight uppercase leading-[1.15]">
              Configure Premium Power Solutions
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              Generate detailed technical system specifications, monitor order milestones, and coordinate backup logistics directly with regional network partners.
            </p>
          </div>

          {/* Interactive Feature List card overlay */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl z-20">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider">Blueprints in Under 40 Seconds</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Our system evaluates load capacity specifications automatically to generate detailed solution estimates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <LogIn className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider">Unified Handshake Credentials</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Connect via Google OAuth secure callbacks or standard JWT account verification profiles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer citation */}
        <div className="z-10">
          <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
            © 2026 Voltrix Power Systems. Certified Regional Partner Hub.
          </p>
        </div>
      </div>

      {/* MOCK GOOGLE AUTH0 CONSENT WINDOW MODAL */}
      {showMockGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border-2 border-slate-100 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-5">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowMockGoogleModal(false)}
                className="text-slate-400 hover:text-slate-605 font-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 mx-auto shadow-md">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <h2 className="text-sm font-black text-[#0A2342] uppercase tracking-wider">Auth0 Google Sign-In Sandbox</h2>
              <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                Auth0 credentials are ready. You are in <strong>Simulation Mode</strong>. Please type an email to test the Google sign in flow.
              </p>
            </div>

            <form onSubmit={handleMockGoogleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Simulation Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@gmail.com"
                  className={inputCls}
                  value={mockGoogleEmail}
                  onChange={e => setMockGoogleEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">Simulation Profile Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Abhinav Roy"
                  className={inputCls}
                  value={mockGoogleName}
                  onChange={e => setMockGoogleName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg border-none cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Submit Simulated Login</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
