'use client';
/**
 * DealerRegistrationForm — Public single-page dealer registration form.
 * Simplified from the old multi-step wizard to a single clean form.
 */

import React, { useState } from 'react';
import { Building2, User, MapPin, Briefcase, ChevronRight, CheckCircle2, Zap, ArrowLeft, X, ScrollText, ShieldCheck } from 'lucide-react';

// ── Terms & Conditions Modal ─────────────────────────────────────────────────

const TERMS = [
  {
    number: '1',
    title: 'LEAD GENERATION',
    body: 'VOLTRIX will provide only genuine customer leads for business opportunities.',
  },
  {
    number: '2',
    title: 'DEALER RESPONSIBILITIES',
    body: 'The dealer is solely responsible for customer communication, product selection, pricing, quotations, billing, GST, legal compliance, payment collection, installation, delivery, warranty, product quality, after-sales service, and AMC.',
  },
  {
    number: '3',
    title: 'PROFESSIONAL CONDUCT',
    body: 'The dealer must maintain professional and ethical behavior while dealing with customers.',
  },
  {
    number: '4',
    title: 'COMMISSION POLICY',
    body: 'Commission is applicable only on successful orders. The commission amount/percentage will be mutually agreed in advance.',
  },
  {
    number: '5',
    title: 'ORDER REPORTING & PAYMENT',
    body: 'The dealer must share successful order details immediately in dealer portal. The dealer must pay the agreed commission immediately. Payment will be made via UPI, NEFT, or RTGS.',
  },
  {
    number: '6',
    title: 'CONFIDENTIALITY & COMPLIANCE',
    body: 'Misusing customer information, hiding orders, concealing commission, or repeatedly delaying payments may result in suspension of leads or termination of the partnership.',
  },
  {
    number: '7',
    title: 'LIMITATION OF LIABILITY',
    body: 'VOLTRIX is not responsible for pricing, quotations, payments, warranty, installation, delivery, product quality, service, or any dispute between the dealer and the customer. All such responsibilities rest solely with the dealer.',
  },
  {
    number: '8',
    title: 'ACCEPTANCE OF TERMS',
    body: 'By accepting leads from VOLTRIX, the dealer agrees to comply with all the above terms and conditions.',
  },
];

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-[#0A2342] to-[#0d3060] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-base uppercase tracking-wider leading-none">Dealer Partnership Terms</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Voltrix Power Systems — Please read carefully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {TERMS.map(term => (
            <div key={term.number} className="flex gap-4">
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <span className="text-emerald-700 font-black text-xs">{term.number}</span>
              </div>
              <div>
                <h3 className="text-[#0A2342] font-black text-xs uppercase tracking-wider mb-1">{term.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{term.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer banner */}
        <div className="px-7 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 text-xs font-bold uppercase tracking-wide">
              Let's Grow Together. Let's Build Trust.
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="px-7 pb-6 pt-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 bg-[#0A2342] hover:bg-[#0d3060] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-colors"
          >
            I've Read the Terms
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onNavigate: (hash: string) => void;
}

const PRODUCT_OPTIONS = [
  'UPS Systems', 'Servo Stabilizers', 'Inverters', 'Batteries',
  'Solar Systems',
];

const BUSINESS_TYPES = [
  'Proprietorship', 'Partnership', 'Private Limited', 'Distributor', 'Retailer', 'RegionalSupplier',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi',
];

export default function DealerRegistrationForm({ onNavigate }: Props) {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    alternateMobile: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    shopAddress: '',
    pinCode: '',
    gstin: '',
    panNumber: '',
    aadhaarNumber: '',
    businessType: 'Proprietorship',
    yearsOfExperience: '',
    interestedProducts: [] as string[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleProduct = (product: string) => {
    setForm(prev => ({
      ...prev,
      interestedProducts: prev.interestedProducts.includes(product)
        ? prev.interestedProducts.filter(p => p !== product)
        : [...prev.interestedProducts, product],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.companyName || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to proceed.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, interestedProducts: form.interestedProducts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center space-y-6 animate-fade-in">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0A2342] uppercase tracking-tight">Registration Submitted!</h2>
            <p className="text-slate-600 text-sm font-medium">
              Thank you, <strong>{form.name}</strong>. Your dealership application has been received. Our admin team will review your details and notify you within 24–48 hours.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-semibold">
            ⏳ You will be able to log in once your account is approved by the Voltrix admin team.
          </div>
          <button
            onClick={() => onNavigate('#home')}
            className="w-full h-11 bg-[#0A2342] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#0d2d52] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium placeholder:text-slate-400";
  const labelCls = "block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-10 px-4">
      {/* Terms & Conditions Modal */}
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <button onClick={() => onNavigate('#home')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-semibold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#0A2342] uppercase tracking-tight">Become a Voltrix Dealer</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium max-w-md mx-auto">
            Join our authorized dealer network. Fill in your details and our team will confirm your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

          {/* Section: Personal & Company Info */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base font-black text-[#0A2342] uppercase tracking-wide">Personal & Company Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" className={inputCls} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Company / Firm Name <span className="text-red-500">*</span></label>
                <input type="text" className={inputCls} placeholder="e.g. Sharma Power Solutions" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                <input type="email" className={inputCls} placeholder="e.g. rahul@sharmapowers.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Mobile Number <span className="text-red-500">*</span></label>
                <input type="tel" className={inputCls} placeholder="+91 98000 00000" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Alternate Mobile Number</label>
                <input type="tel" className={inputCls} placeholder="+91 98000 00000 (Optional)" value={form.alternateMobile} onChange={e => set('alternateMobile', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                <input type="password" className={inputCls} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" className={inputCls} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Section: Business Details */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-base font-black text-[#0A2342] uppercase tracking-wide">Business Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Business Type</label>
                <select className={inputCls} value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Years of Experience</label>
                <input type="number" className={inputCls} placeholder="e.g. 5" min="0" max="60" value={form.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input type="text" className={`${inputCls} uppercase`} placeholder="e.g. 29ABCDE1234F1Z5" value={form.gstin} onChange={e => set('gstin', e.target.value)} maxLength={15} />
              </div>
              <div>
                <label className={labelCls}>PAN Number</label>
                <input type="text" className={`${inputCls} uppercase`} placeholder="e.g. ABCDE1234F" value={form.panNumber} onChange={e => set('panNumber', e.target.value)} maxLength={10} />
              </div>
              <div>
                <label className={labelCls}>Aadhaar Number</label>
                <input type="text" className={inputCls} placeholder="XXXX XXXX XXXX" value={form.aadhaarNumber} onChange={e => set('aadhaarNumber', e.target.value)} maxLength={14} />
              </div>
            </div>
          </div>

          {/* Section: Address */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-base font-black text-[#0A2342] uppercase tracking-wide">Location & Address</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelCls}>Shop / Office Address</label>
                <input type="text" className={inputCls} placeholder="Street, Area" value={form.shopAddress} onChange={e => set('shopAddress', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>City <span className="text-red-500">*</span></label>
                <input type="text" className={inputCls} placeholder="e.g. Hyderabad" value={form.city} onChange={e => set('city', e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>State <span className="text-red-500">*</span></label>
                <select className={inputCls} value={form.state} onChange={e => set('state', e.target.value)} required>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>PIN Code</label>
                <input type="text" className={inputCls} placeholder="e.g. 500043" value={form.pinCode} onChange={e => set('pinCode', e.target.value)} maxLength={6} />
              </div>
            </div>
          </div>

          {/* Section: Product Interests */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-base font-black text-[#0A2342] uppercase tracking-wide">Products You Want to Deal</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {PRODUCT_OPTIONS.map(product => (
                <button
                  key={product}
                  type="button"
                  onClick={() => toggleProduct(product)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.interestedProducts.includes(product)
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                >
                  {product}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="p-8">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-sm text-red-700 font-semibold">
                {error}
              </div>
            )}
            {/* Terms & Conditions Checkbox */}
            <div className="mb-5 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    id="terms-checkbox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${termsAccepted
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-slate-300 group-hover:border-emerald-400'
                    }`}>
                    {termsAccepted && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium leading-snug">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-emerald-600 font-bold underline underline-offset-2 hover:text-emerald-700 transition-colors"
                  >
                    Terms &amp; Conditions
                  </button>
                  {' '}of the Voltrix Dealer Partnership Program.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !termsAccepted}
              className="w-full h-13 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
              style={{ height: '52px' }}
            >
              {submitting ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span>
              ) : (
                <><ChevronRight className="h-5 w-5" />Submit Registration</>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium">
              Already registered?{' '}
              <button type="button" onClick={() => onNavigate('#login')} className="text-emerald-600 font-bold hover:underline">
                Login here
              </button>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
