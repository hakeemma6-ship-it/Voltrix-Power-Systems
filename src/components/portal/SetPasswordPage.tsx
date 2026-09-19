import React, { useState, useEffect } from 'react';
import {
    ShieldCheck, Lock, AlertTriangle, ArrowRight, Loader2,
    CheckCircle2, Eye, EyeOff, Check, X
} from 'lucide-react';

export default function SetPasswordPage({ onNavigate }: { onNavigate: (hash: string) => void }) {
    const [token, setToken] = useState('');
    const [customerInfo, setCustomerInfo] = useState<{ name?: string; email?: string } | null>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [tokenError, setTokenError] = useState('');
    const [isAlreadyActive, setIsAlreadyActive] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    // Extract token and validate on mount
    useEffect(() => {
        const hash = window.location.hash;
        let extractedToken = '';
        if (hash.includes('?')) {
            const searchParams = new URLSearchParams(hash.split('?')[1]);
            extractedToken = searchParams.get('token') || '';
        }

        if (!extractedToken) {
            setIsValidating(false);
            setTokenError('No activation token was provided in the link. Please open the full link from your WhatsApp message.');
            return;
        }

        setToken(extractedToken);

        // Validate token with backend
        fetch(`/api/auth/set-password?token=${encodeURIComponent(extractedToken)}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    if (data.alreadyActive) {
                        setIsAlreadyActive(true);
                    }
                    if (data.expired) {
                        setIsExpired(true);
                    }
                    setTokenError(data.error || 'This activation link is invalid or has expired.');
                } else {
                    setCustomerInfo({ name: data.name, email: data.email });
                }
            })
            .catch(() => {
                setTokenError('Network error connecting to activation server. Please try again.');
            })
            .finally(() => {
                setIsValidating(false);
            });
    }, []);

    // Password complexity rules
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const passwordsMatch = password.length > 0 && password === confirmPassword;
    const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!token) {
            setSubmitError('Missing activation token.');
            return;
        }

        if (!isPasswordStrong) {
            setSubmitError('Please meet all password security requirements before proceeding.');
            return;
        }

        if (password !== confirmPassword) {
            setSubmitError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();
            if (!res.ok) {
                setSubmitError(data.error || 'Failed to activate account and set password.');
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setSubmitError('An unexpected network error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 font-sans">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm w-full space-y-4">
                    <Loader2 className="h-10 w-10 text-brand-green animate-spin mx-auto" />
                    <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-wide">
                        Verifying Secure Token...
                    </h3>
                    <p className="text-xs text-slate-500">
                        Checking activation credentials and expiration timestamp.
                    </p>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 font-sans">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full space-y-5">
                    <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
                        <AlertTriangle className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-extrabold text-xl text-slate-900 uppercase tracking-tight">
                            {isAlreadyActive ? 'Account Already Active' : isExpired ? 'Activation Link Expired' : 'Invalid Link'}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {tokenError}
                        </p>
                    </div>

                    <div className="pt-2 space-y-3">
                        {isAlreadyActive ? (
                            <button
                                type="button"
                                onClick={() => onNavigate('#login')}
                                className="w-full h-11 bg-brand-green hover:bg-[#16a34a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 font-sans shadow-sm"
                            >
                                <span>Go to Login</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onNavigate('#login')}
                                className="w-full h-11 bg-slate-900 hover:bg-[#0A2342] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 font-sans shadow-sm"
                            >
                                <span>Return to Portal</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 font-sans">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-brand-green shadow-xs">
                        <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-extrabold text-[#0A2342] uppercase tracking-tight">Account Activated!</h2>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Your password has been securely created. You can now log into your Voltrix Customer Portal.
                        </p>
                    </div>
                    <div className="pt-3">
                        <button
                            type="button"
                            onClick={() => onNavigate('#login')}
                            className="w-full h-11 bg-brand-green hover:bg-[#16a34a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm font-sans"
                        >
                            <span>Proceed to Login</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center text-brand-green mb-3">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-brand-green" />
                    </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2342] uppercase tracking-tight">
                    Activate Your Account
                </h2>
                <p className="mt-1.5 text-xs text-slate-500 font-medium">
                    {customerInfo?.name ? `Welcome, ${customerInfo.name}! ` : ''}
                    Create your password to access your customer portal.
                </p>
            </div>

            <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-5 sm:px-9 shadow-sm border border-slate-200 rounded-3xl relative overflow-hidden text-left">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-brand-green"></div>

                    {submitError && (
                        <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* New Password */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                                Create New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                    placeholder="Enter your password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                    placeholder="Re-enter your password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements Checklist (OWASP) */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-[11px]">
                            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                                Password Requirements:
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-slate-600 font-medium">
                                <div className="flex items-center gap-1.5">
                                    {hasMinLength ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={hasMinLength ? 'text-emerald-700 font-bold' : ''}>8+ Characters</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {hasUpperCase ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={hasUpperCase ? 'text-emerald-700 font-bold' : ''}>Uppercase Letter</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {hasLowerCase ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={hasLowerCase ? 'text-emerald-700 font-bold' : ''}>Lowercase Letter</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {hasNumber ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={hasNumber ? 'text-emerald-700 font-bold' : ''}>At least 1 Number</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {hasSpecial ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={hasSpecial ? 'text-emerald-700 font-bold' : ''}>Special Character</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {passwordsMatch ? <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <span className={passwordsMatch ? 'text-emerald-700 font-bold' : ''}>Passwords Match</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting || !isPasswordStrong || !passwordsMatch}
                                className="w-full h-11 bg-brand-green hover:bg-[#16a34a] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm font-sans"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Activating Account...</span>
                                    </>
                                ) : (
                                    <span>Activate Account & Save Password</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
