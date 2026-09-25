'use client';

import React, { useState, useEffect } from 'react';
import {
  X, BadgeIndianRupee, ShieldCheck, Check, AlertCircle, Building2, User, Phone, Mail, Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  dealer: any;
  initialFee?: string | number;
  initialPct?: string | number;
  onClose: () => void;
  onSaveAndApprove: (dealerId: string, fee: number, pct: number) => Promise<boolean | void>;
}

export default function ApproveDealerCommissionModal({
  isOpen,
  dealer,
  initialFee,
  initialPct,
  onClose,
  onSaveAndApprove
}: Props) {
  const [fee, setFee] = useState<string>('');
  const [pct, setPct] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && dealer) {
      const feeVal = initialFee !== undefined && initialFee !== ''
        ? String(initialFee)
        : (dealer.perCustomerAssignmentFee !== undefined && dealer.perCustomerAssignmentFee !== null && dealer.perCustomerAssignmentFee > 0
          ? String(dealer.perCustomerAssignmentFee)
          : '');

      const pctVal = initialPct !== undefined && initialPct !== ''
        ? String(initialPct)
        : (dealer.commissionPercentage !== undefined && dealer.commissionPercentage !== null && dealer.commissionPercentage > 0
          ? String(dealer.commissionPercentage)
          : '');

      setFee(feeVal);
      setPct(pctVal);
      setError('');
    }
  }, [isOpen, dealer, initialFee, initialPct]);

  if (!isOpen || !dealer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedFee = parseFloat(fee);
    const parsedPct = parseFloat(pct);

    if (isNaN(parsedFee) || parsedFee < 0) {
      setError('Please enter a valid fixed price per customer (₹0 or greater).');
      return;
    }

    if (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
      setError('Please enter a valid commission percentage between 0% and 100%.');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveAndApprove(dealer.id, parsedFee, parsedPct);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save commission rates and approve dealer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0A2342] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <BadgeIndianRupee className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  Dealer Approval Required
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mt-1">
                  Set Pricing & Commission
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Dealer Info strip */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{dealer.companyName}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
              <span>{dealer.name}</span>
              <span>•</span>
              <span className="font-mono text-emerald-300">{dealer.phone}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Requirement Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <strong className="font-extrabold text-amber-950 block">Pricing & Commission Not Set</strong>
              Before approving this dealer account, you must configure and save the fixed price per assigned customer and deal commission percentage.
            </div>
          </div>

          {/* Input 1: Fixed Price Per Customer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0A2342] uppercase tracking-wider">
                Fixed Price Per Assigned Customer (₹) *
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Lead assignment fee</span>
            </div>
            <div className="flex rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-xs">
              <div className="flex items-center justify-center px-4 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold select-none text-sm">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 15, 25, 50"
                value={fee}
                onChange={e => setFee(e.target.value)}
                className="w-full px-3.5 py-3 text-slate-900 text-sm font-bold placeholder:text-slate-400 bg-transparent focus:outline-none font-mono"
                autoFocus
              />
              <div className="flex items-center px-3 bg-slate-50 border-l border-slate-200 text-slate-500 text-xs font-extrabold select-none">
                / customer
              </div>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Set:</span>
              {[10, 15, 25, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFee(String(val))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Closed Deals Commission % */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0A2342] uppercase tracking-wider">
                Deal Commission Percentage (%) *
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">On closed orders</span>
            </div>
            <div className="flex rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all bg-white shadow-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                required
                placeholder="e.g. 5, 10, 12, 15"
                value={pct}
                onChange={e => setPct(e.target.value)}
                className="w-full px-3.5 py-3 text-slate-900 text-sm font-bold placeholder:text-slate-400 bg-transparent focus:outline-none font-mono"
              />
              <div className="flex items-center px-3 bg-slate-50 border-l border-slate-200 text-slate-500 text-xs font-extrabold select-none">
                % on closed deals
              </div>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Set:</span>
              {[5, 10, 12, 15, 20].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPct(String(val))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Approving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Rates & Approve Dealer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
