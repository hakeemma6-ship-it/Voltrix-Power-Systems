'use client';
/**
 * LoginPage — Clean, direct login for Dealers and Administrators.
 * Direct credential authentication (no OTP).
 * Styled in a premium Split-Screen layout with responsive styling.
 */

import React, { useState, useEffect } from 'react';
import { Zap, LogIn, Eye, EyeOff, ArrowLeft, Mail, CheckCircle, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  onAdminLogin: (admin: any, isActiveLogin: boolean) => void;
  onDealerLogin: (dealer: any, isActiveLogin: boolean) => void;
  onNavigate: (hash: string) => void;
  dealerSession?: any;
  adminSession?: any;
}

export default function LoginPage({ onAdminLogin, onDealerLogin, onNavigate }: Props) {
  const [isForgot, setIsForgot] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Forgot password fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');

  // Catch parameters on mount (e.g. prefilled credentials from registration or email link)
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search || (url.hash.includes('?') ? url.hash.substring(url.hash.indexOf('?')) : ''));

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
      window.history.replaceState({}, document.title, window.location.pathname + '#login');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

    if (!loginPass) {
      setError('Please enter your account password.');
      return;
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
        setError(data.error || 'Login failed. Please verify your credentials.');
      } else {
        if (data.token) {
          localStorage.setItem('voltrix_auth_token', data.token);
        }
        if (data.user?.role === 'admin') {
          onAdminLogin(data.user, true);
        } else if (data.user?.role === 'dealer') {
          onDealerLogin(data.user, true);
        } else {
          setError('Unauthorized portal access.');
        }
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const identifier = forgotIdentifier.trim();
    if (!identifier) {
      setError('Please enter your registered mobile number or email.');
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
          identifier,
          newPassword: forgotNewPass.trim(),
          confirmPassword: forgotConfirmPass.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccess(data.message || 'Password reset successfully! You can now log in.');
        setIsForgot(false);
        if (identifier.includes('@')) {
          setLoginMethod('email');
          setLoginEmail(identifier);
        } else {
          setLoginMethod('phone');
          setLoginPhone(identifier.replace(/^\+91/, '').replace(/\D/g, ''));
        }
        setLoginPass('');
        setForgotIdentifier('');
        setForgotNewPass('');
        setForgotConfirmPass('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 px-4 py-3 text-sm focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-semibold placeholder:text-slate-400 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Forms column (Left side) */}
      <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[35%] bg-white flex flex-col justify-between p-8 sm:p-12 shadow-2xl z-10 border-r border-slate-100 min-h-screen">
        
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('#home')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-800 text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dealer & Admin Portal</span>
            </div>
            <h2 className="text-2xl font-black text-[#0A2342] uppercase tracking-tight leading-none">
              {isForgot ? 'Reset Password' : 'Secure Login'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {isForgot
                ? 'Enter your registered mobile or email to set a new password.'
                : 'Sign in to access your partner workspace, logistics tracker, or admin dashboard.'}
            </p>
          </div>

          {/* FORGOT PASSWORD FORM */}
          {isForgot ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Registered Mobile Number or Email
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. 9876543210 or dealer@company.com"
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Minimum 6 characters"
                  value={forgotNewPass}
                  onChange={e => setForgotNewPass(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Re-enter new password"
                  value={forgotConfirmPass}
                  onChange={e => setForgotConfirmPass(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-600 text-xs font-bold bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
              {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            /* SIMPLE DIRECT LOGIN FORM */
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
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        loginMethod === 'phone' ? 'bg-white text-[#0A2342] shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🇮🇳 +91 Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('email'); setError(''); }}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
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
                    <div className="flex rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-[#10b981] focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-inner">
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
                  </div>
                ) : (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      className={`${inputCls} pl-11`}
                      placeholder="e.g. dealer@company.com or admin"
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
                    placeholder="Enter your password"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    required
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {error && <p className="text-red-600 text-xs font-bold bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl leading-relaxed">{error}</p>}
              {success && <p className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                className="w-full h-12 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">
                  Authorized Dealer Applicant?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('#dealer-register')}
                    className="text-[#10b981] font-black hover:underline cursor-pointer"
                  >
                    Apply for Dealer Account →
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer info branding */}
        <div className="pt-8 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
            Voltrix Power Systems Regional Hub • Hyderabad
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
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 uppercase tracking-widest px-3.5 py-1.5 rounded-lg inline-block">
              Authorized B2B Portal
            </span>
            <h2 className="text-3xl lg:text-4xl text-white font-extrabold tracking-tight uppercase leading-[1.15]">
              Commercial Power Management Platform
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
              Manage technical system configurations, track dealer orders, dispatch regional inquiries, and monitor infrastructure telemetry from one centralized control center.
            </p>
          </div>

          {/* Interactive Feature List card overlay */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl z-20">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider">Fast Quotation Delivery</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Generate verified technical load specs and official dealer invoices seamlessly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs text-white font-bold uppercase tracking-wider">Enterprise Security</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Cryptographically secure token-based access strictly guarded for verified authorized personnel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-slate-400 text-xs font-bold z-10">
          <span>Enterprise Industrial Grade</span>
          <span>Secured Connection</span>
        </div>
      </div>
    </div>
  );
}
