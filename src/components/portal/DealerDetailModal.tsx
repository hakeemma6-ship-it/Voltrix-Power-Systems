'use client';

import React, { useState, useEffect } from 'react';
import {
    X, User, Phone, Mail, Building2, MapPin, Briefcase, Calendar,
    Receipt, ShoppingCart, Users, Check, Ban, RotateCcw, AlertTriangle,
    FileText, Copy, Eye, EyeOff, ShieldCheck, Plus, Trash2, Award, Download, ExternalLink, IndianRupee
} from 'lucide-react';
import type { Dealer } from '@/types';
import ApproveDealerCommissionModal from '../admin/ApproveDealerCommissionModal';

interface Props {
    dealer: Dealer | any;
    onClose: () => void;
    onUpdate: () => void;
}

type TabType = 'overview' | 'customers' | 'deals' | 'documents';

const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-705 border border-amber-200',
    approved: 'bg-emerald-100 text-emerald-705 border border-emerald-200',
    suspended: 'bg-red-105 text-red-700 border border-red-200',
};

export default function DealerDetailModal({ dealer, onClose, onUpdate }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [customers, setCustomers] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Secure view toggles for Aadhaar & PAN
    const [showAadhaar, setShowAadhaar] = useState(false);
    const [showPan, setShowPan] = useState(false);

    // Commission rates configuration state
    const [commPctInput, setCommPctInput] = useState<string>(
        dealer.commissionPercentage !== undefined && dealer.commissionPercentage !== null ? String(dealer.commissionPercentage) : ''
    );
    const [custFeeInput, setCustFeeInput] = useState<string>(
        dealer.perCustomerAssignmentFee !== undefined && dealer.perCustomerAssignmentFee !== null ? String(dealer.perCustomerAssignmentFee) : ''
    );
    const [savingRates, setSavingRates] = useState(false);
    const [ratesSavedFeedback, setRatesSavedFeedback] = useState(false);
    const [showApproveRatesModal, setShowApproveRatesModal] = useState(false);

    useEffect(() => {
        setCommPctInput(dealer.commissionPercentage !== undefined && dealer.commissionPercentage !== null ? String(dealer.commissionPercentage) : '');
        setCustFeeInput(dealer.perCustomerAssignmentFee !== undefined && dealer.perCustomerAssignmentFee !== null ? String(dealer.perCustomerAssignmentFee) : '');
    }, [dealer.commissionPercentage, dealer.perCustomerAssignmentFee]);

    // Copied text notification state
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    const handleSaveCommissionRates = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSavingRates(true);
        try {
            const body = {
                commissionPercentage: parseFloat(commPctInput) || 0,
                perCustomerAssignmentFee: parseFloat(custFeeInput) || 0,
            };
            const res = await fetch(`/api/dealers/${dealer.id}/commission`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setRatesSavedFeedback(true);
                setTimeout(() => setRatesSavedFeedback(false), 2500);
                onUpdate();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to update rates.');
            }
        } catch {
            alert('Network error saving rates.');
        } finally {
            setSavingRates(false);
        }
    };

    useEffect(() => {
        async function loadDealerDetails() {
            setLoading(true);
            try {
                const [custRes, dealRes] = await Promise.all([
                    fetch('/api/customers', { headers }),
                    fetch(`/api/deals?dealerId=${dealer.id}`, { headers }),
                ]);

                if (custRes.ok) {
                    const allCustomers = await custRes.json();
                    const filtered = Array.isArray(allCustomers) ? allCustomers.filter((c: any) =>
                        c.assignedDealerId === dealer.id ||
                        (c.assignedDealers && c.assignedDealers.some((ad: any) => ad.id === dealer.id))
                    ) : [];
                    setCustomers(filtered);
                }

                if (dealRes.ok) {
                    const allDeals = await dealRes.json();
                    const filtered = Array.isArray(allDeals) ? allDeals.filter((d: any) => d.dealerId === dealer.id) : [];
                    setDeals(filtered);
                }
            } catch (err) {
                console.error("Failed to load dealer related data", err);
            } finally {
                setLoading(false);
            }
        }

        if (dealer?.id) {
            loadDealerDetails();
        }
    }, [dealer.id]);

    const copyToClipboard = (text: string, fieldName: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleInitiateApprove = () => {
        const feeNum = custFeeInput ? parseFloat(custFeeInput) : (dealer.perCustomerAssignmentFee ?? 0);
        const pctNum = commPctInput ? parseFloat(commPctInput) : (dealer.commissionPercentage ?? 0);

        const hasSavedRates =
            dealer.perCustomerAssignmentFee !== undefined &&
            dealer.perCustomerAssignmentFee !== null &&
            Number(dealer.perCustomerAssignmentFee) > 0 &&
            dealer.commissionPercentage !== undefined &&
            dealer.commissionPercentage !== null &&
            Number(dealer.commissionPercentage) > 0;

        if (!hasSavedRates || feeNum <= 0 || pctNum <= 0) {
            setShowApproveRatesModal(true);
            return;
        }

        doAction('approve');
    };

    const handleSaveRatesAndApprove = async (dealerId: string, feeVal: number, pctVal: number) => {
        const res = await fetch(`/api/dealers/${dealerId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                action: 'approve',
                perCustomerAssignmentFee: feeVal,
                commissionPercentage: pctVal,
            }),
        });
        if (!res.ok) {
            const d = await res.json();
            throw new Error(d.error || 'Failed to approve dealer.');
        }
        setCustFeeInput(String(feeVal));
        setCommPctInput(String(pctVal));
        onUpdate();
    };

    const doAction = async (action: string) => {
        if (action === 'approve') {
            const feeNum = custFeeInput ? parseFloat(custFeeInput) : (dealer.perCustomerAssignmentFee ?? 0);
            const pctNum = commPctInput ? parseFloat(commPctInput) : (dealer.commissionPercentage ?? 0);
            if (feeNum <= 0 || pctNum <= 0) {
                setShowApproveRatesModal(true);
                return;
            }
        }
        setActioning(true);
        try {
            const body: any = { action };
            if (action === 'approve') {
                body.perCustomerAssignmentFee = parseFloat(custFeeInput) || dealer.perCustomerAssignmentFee || 0;
                body.commissionPercentage = parseFloat(commPctInput) || dealer.commissionPercentage || 0;
            }
            const res = await fetch(`/api/dealers/${dealer.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body),
            });
            if (res.ok) {
                onUpdate();
            } else {
                const d = await res.json();
                alert(d.error || 'Action failed.');
            }
        } catch {
            alert('Network error executing action.');
        } finally {
            setActioning(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this dealer? This action cannot be undone.')) return;
        setActioning(true);
        try {
            const res = await fetch(`/api/dealers/${dealer.id}`, {
                method: 'DELETE',
                headers,
            });
            if (res.ok) {
                onClose();
                onUpdate();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to delete dealer.');
            }
        } catch {
            alert('Network error deleting dealer.');
        } finally {
            setActioning(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setSavingNote(true);
        try {
            const updatedNotes = [...(dealer.notes || []), newNote.trim()];
            const res = await fetch(`/api/dealers/${dealer.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ notes: updatedNotes })
            });
            if (res.ok) {
                setNewNote('');
                onUpdate();
            } else {
                alert('Failed to save note.');
            }
        } catch {
            alert('Network error saving note.');
        } finally {
            setSavingNote(false);
        }
    };

    // Mask function helper
    const maskValue = (value: string, show: boolean, length: number = 4) => {
        if (!value) return '—';
        if (show) return value;
        if (value.length <= length) return '•'.repeat(value.length);
        return '•'.repeat(value.length - length) + value.slice(-length);
    };

    const totalDealValue = deals.reduce((acc, d) => acc + (d.closedAmount || d.finalPrice || d.price || 0), 0);
    const totalCommissionEarned = deals.reduce((acc, d) => {
        if (d.commissionAmount !== undefined && d.commissionAmount !== null && d.commissionAmount > 0) return acc + d.commissionAmount;
        const rate = parseFloat(commPctInput) || dealer.commissionPercentage || 0;
        const val = d.closedAmount || d.finalPrice || d.price || 0;
        return acc + ((val * rate) / 100);
    }, 0);
    const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all text-slate-800";

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[95vh] sm:max-h-[90vh]">

                {/* Modal Header */}
                <div className="bg-[#0A2342] text-white p-4 sm:p-6 shrink-0 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-sm sm:text-lg text-white shadow-sm shrink-0 uppercase">
                            {dealer.companyName?.charAt(0) || dealer.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight leading-tight">{dealer.companyName || 'Corporate Partner'}</h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[dealer.status?.toLowerCase()] || 'bg-white/20 text-white'}`}>
                                    {dealer.status}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                                Contact: <strong className="text-white font-bold">{dealer.name}</strong> • ID: <span className="font-mono text-emerald-400 font-bold">{dealer.id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Quick Status Modifiers */}
                        {dealer.status === 'pending' && (
                            <>
                                <button
                                    disabled={actioning}
                                    onClick={handleInitiateApprove}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-580 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                                >
                                    <Check className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button
                                    disabled={actioning}
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 text-xs font-bold transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Reject
                                </button>
                            </>
                        )}
                        {dealer.status === 'approved' && (
                            <button
                                disabled={actioning}
                                onClick={() => doAction('suspend')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-205 text-xs font-bold hover:bg-red-100 transition-all font-bold"
                            >
                                <Ban className="h-3.5 w-3.5 animate-pulse" /> Suspend Account
                            </button>
                        )}
                        {dealer.status === 'suspended' && (
                            <button
                                disabled={actioning}
                                onClick={() => doAction('reactivate')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Reactivate Partner
                            </button>
                        )}

                        <button onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-2 shrink-0">
                            <X className="h-4.5 w-4.5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Modal Stats Cards Row */}
                <div className="bg-slate-50 py-4 px-4 sm:px-6 border-b border-slate-200 shrink-0 select-none">
                    <div className="grid grid-cols-3 gap-3">

                        {/* Customers Stat */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center relative hover:shadow-sm transition-all sm:flex-row sm:text-left sm:justify-start sm:gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Customers</p>
                                <p className="text-base sm:text-xl font-black text-[#0A2342] mt-1">{loading ? '...' : customers.length}</p>
                            </div>
                        </div>

                        {/* Deals Stat */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center relative hover:shadow-sm transition-all sm:flex-row sm:text-left sm:justify-start sm:gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                                <Award className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Closed Deals</p>
                                <p className="text-base sm:text-xl font-black text-[#0A2342] mt-1">{loading ? '...' : deals.length}</p>
                            </div>
                        </div>

                        {/* Revenue Stat */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center relative hover:shadow-sm transition-all sm:flex-row sm:text-left sm:justify-start sm:gap-3">
                            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                                <IndianRupee className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Total Deal Value</p>
                                <p className="text-base sm:text-xl font-black text-emerald-600 mt-1">{loading ? '...' : `₹${totalDealValue.toLocaleString('en-IN')}`}</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Modal Tabs Navigation */}
                <div className="flex bg-slate-100 border-b border-slate-200 shrink-0 px-2 sm:px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview & Profile', icon: User },
                        { id: 'customers', label: 'Customers List', icon: Users },
                        { id: 'deals', label: 'Closed Deals & Revenue', icon: Award },
                        { id: 'documents', label: 'Verification Docs', icon: ShieldCheck },
                    ].map(t => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as TabType)}
                                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-[11px] sm:text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${isActive
                                    ? 'bg-white text-emerald-700 border-emerald-500 shadow-sm'
                                    : 'text-slate-650 hover:text-slate-900 border-transparent hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Modal Body / Scroll Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-6">

                    {/* TAB 1: OVERVIEW & PROFILE */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">

                            {/* Commission & Assignment Rates Card */}
                            <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50 to-amber-50/50 border-2 border-emerald-100 rounded-2xl p-5 space-y-4 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                            <IndianRupee className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#0A2342] uppercase tracking-tight">
                                                Commission & Customer Assignment Rates
                                            </h4>
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                Configure customer assignment fixed fee and closed deal commission for this dealer.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={savingRates}
                                        onClick={() => handleSaveCommissionRates()}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                            ratesSavedFeedback
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-[#0A2342] hover:bg-[#123966] text-white disabled:opacity-50'
                                        }`}
                                    >
                                        {ratesSavedFeedback ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span>Saved Successfully!</span>
                                            </>
                                        ) : savingRates ? (
                                            <>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span>Update Rates</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Field 1: Fixed rate per customer assigned */}
                                    <div className="bg-white border-2 border-slate-200 rounded-xl p-3 space-y-1.5 focus-within:border-emerald-500 transition-all">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                            Fixed Rate Per Customer Assigned
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-black text-emerald-600">₹</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={1}
                                                placeholder="e.g. 5, 10, 15"
                                                className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none font-mono"
                                                value={custFeeInput}
                                                onChange={e => setCustFeeInput(e.target.value)}
                                            />
                                            <span className="text-xs font-bold text-slate-400 shrink-0">/ customer</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Fixed earnings whenever admin assigns a new customer lead to this dealer.
                                        </p>
                                    </div>

                                    {/* Field 2: Commission on closed deals */}
                                    <div className="bg-white border-2 border-slate-200 rounded-xl p-3 space-y-1.5 focus-within:border-emerald-500 transition-all">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                            Closed Deals Commission Rate
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                placeholder="e.g. 10, 15"
                                                className="w-full text-sm font-bold text-slate-900 bg-transparent focus:outline-none font-mono"
                                                value={commPctInput}
                                                onChange={e => setCommPctInput(e.target.value)}
                                            />
                                            <span className="text-base font-black text-amber-600 shrink-0">%</span>
                                            <span className="text-xs font-bold text-slate-400 shrink-0">on deal amount</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Percentage added for every successfully closed deal recorded by this dealer.
                                        </p>
                                    </div>
                                </div>

                                {/* Financial Estimates Banner */}
                                <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left shadow-xs">
                                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Assigned Leads (Per Customer)</span>
                                        <p className="text-xs font-bold text-slate-700 mt-1">
                                            {customers.length} leads × ₹{parseFloat(custFeeInput) || 0}
                                        </p>
                                        <p className="text-base font-black text-emerald-700 mt-0.5 font-mono">
                                            ₹{((customers.length * (parseFloat(custFeeInput) || 0))).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Deals Commission</span>
                                        <p className="text-xs font-bold text-slate-700 mt-1">
                                            {deals.length} deals · ₹{totalDealValue.toLocaleString('en-IN')} ({parseFloat(commPctInput) || 0}%)
                                        </p>
                                        <p className="text-base font-black text-amber-700 mt-0.5 font-mono">
                                            ₹{(totalCommissionEarned || (((totalDealValue * (parseFloat(commPctInput) || 0)) / 100))).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                                        <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Total Admin Revenue / Payout</span>
                                        <p className="text-xs font-bold text-slate-700 mt-1">
                                            Leads + Deals Commission
                                        </p>
                                        <p className="text-lg font-black text-[#0A2342] mt-0.5 font-mono">
                                            ₹{(((customers.length * (parseFloat(custFeeInput) || 0))) + (totalCommissionEarned || (((totalDealValue * (parseFloat(commPctInput) || 0)) / 100)))).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile details grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Contact Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                                        Primary Contact Details
                                    </h4>
                                    <div className="space-y-3 text-xs text-slate-700 font-semibold">
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Full Name / Contact Person</span>
                                            <span className="text-sm font-bold text-slate-900">{dealer.name || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Email Address</span>
                                            <a href={`mailto:${dealer.email}`} className="text-xs font-bold text-emerald-600 hover:underline">{dealer.email || '—'}</a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Mobile Phone</span>
                                                <span className="text-slate-900 font-mono">{dealer.phone || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">WhatsApp Phone</span>
                                                <span className="text-slate-900 font-mono">{dealer.whatsappPhone || '—'}</span>
                                            </div>
                                        </div>
                                        {dealer.altPhone && (
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Alternate Phone</span>
                                                <span className="text-slate-900 font-mono">{dealer.altPhone}</span>
                                            </div>
                                        )}
                                        {dealer.dob && (
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Date of Birth</span>
                                                <span className="text-slate-900">{new Date(dealer.dob).toLocaleDateString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Business Details Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                                        Business Profile
                                    </h4>
                                    <div className="space-y-3 text-xs text-slate-700 font-semibold">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Constitution Type</span>
                                                <span className="text-slate-900 font-bold">{dealer.businessType || 'Proprietorship'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Years of Experience</span>
                                                <span className="text-slate-900 font-bold">{dealer.yearsOfExperience ? `${dealer.yearsOfExperience} Years` : '—'}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Employees Count</span>
                                                <span className="text-slate-900 font-bold">{dealer.numberOfEmployees || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Website URL</span>
                                                {dealer.website ? (
                                                    <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline truncate block">{dealer.website}</a>
                                                ) : '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Existing Brands represented</span>
                                            <span className="text-slate-800 leading-relaxed block">{dealer.existingBrands || '—'}</span>
                                        </div>
                                        {dealer.interestedProducts && dealer.interestedProducts.length > 0 && (
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">Interested Product Categories</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {dealer.interestedProducts.map((p: string) => (
                                                        <span key={p} className="px-2 py-0.5 rounded bg-slate-200/70 border border-slate-300 text-slate-700 text-[10px] font-bold">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address Details Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 md:col-span-2">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                                        Address & Layout Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-705">
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Office / Shop Address</span>
                                            <span className="text-slate-900 leading-relaxed font-bold block mt-0.5">{dealer.shopAddress || '—'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Locality</span>
                                                <span className="text-slate-800 font-bold block mt-0.5">{dealer.areaLocality || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">Landmark</span>
                                                <span className="text-slate-805 block mt-0.5">{dealer.landmark || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">PIN Code</span>
                                                <span className="text-slate-800 font-mono font-bold block mt-0.5">{dealer.pinCode || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">City</span>
                                                <span className="text-slate-800 font-bold block mt-0.5">{dealer.city || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">State</span>
                                                <span className="text-slate-800 font-bold block mt-0.5">{dealer.state || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 uppercase text-[9px] block">District</span>
                                                <span className="text-slate-800 block mt-0.5">{dealer.district || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Notes timeline and add note */}
                            <div className="p-5 border border-slate-200 rounded-2xl space-y-4">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                                    Partner History Timeline / Notes
                                </h4>

                                {/* Notes list */}
                                <div className="space-y-2.5 max-h-[150px] overflow-y-auto">
                                    {!dealer.notes || dealer.notes.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic text-center py-4">No internal notes logged for this dealer.</p>
                                    ) : (
                                        dealer.notes.map((note: string, idx: number) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs font-semibold text-slate-700">
                                                {note}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add new note form */}
                                <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-slate-100">
                                    <input
                                        className={inputCls}
                                        placeholder="Type an internal note / memo for this dealer..."
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={savingNote}
                                        className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer shrink-0"
                                    >
                                        {savingNote ? 'Adding...' : 'Add Note'}
                                    </button>
                                </form>
                            </div>

                        </div>
                    )}

                    {/* TAB 2: ASSIGNED CUSTOMERS */}
                    {activeTab === 'customers' && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-505 uppercase tracking-wider">
                                Assigned Customers ({customers.length})
                            </h3>

                            {loading ? (
                                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                            ) : customers.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                                    No customers assigned to this dealer yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white shadow-xs">
                                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                                        <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200 font-black">
                                            <tr>
                                                <th className="px-4 py-3">Customer Name</th>
                                                <th className="px-4 py-3">Contact</th>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3">Created</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {customers.map((c: any) => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-900 font-bold">{c.name}</td>
                                                    <td className="px-4 py-3">
                                                        <p>{c.phone}</p>
                                                        {c.email && <p className="text-[10px] text-slate-405">{c.email}</p>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                                                            {c.category || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-slate-200 text-slate-700">
                                                            {c.status?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: CLOSED DEALS & REVENUE */}
                    {activeTab === 'deals' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                    Closed Deals & Installed Systems ({deals.length})
                                </h3>
                                <div className="text-xs font-bold text-slate-500">
                                    Total Closed: <span className="font-black text-emerald-600">₹{totalDealValue.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
                            ) : deals.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                                    No closed deals recorded for this dealer yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white shadow-xs">
                                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                                        <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200 font-black">
                                            <tr>
                                                <th className="px-4 py-3">Deal ID</th>
                                                <th className="px-4 py-3">Customer</th>
                                                <th className="px-4 py-3">System / Product</th>
                                                <th className="px-4 py-3 text-right">Deal Value</th>
                                                <th className="px-4 py-3 text-right">Commission (Sep.)</th>
                                                <th className="px-4 py-3 text-right">Fixed Amt (Sep.)</th>
                                                <th className="px-4 py-3 text-center">Payment Status</th>
                                                <th className="px-4 py-3 text-center">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {deals.map((d: any) => {
                                                const commPct = (d.commissionPercentage !== undefined && d.commissionPercentage !== null && d.commissionPercentage > 0)
                                                    ? d.commissionPercentage
                                                    : (dealer.commissionPercentage || 0);
                                                const commVal = (d.commissionAmount !== undefined && d.commissionAmount !== null && d.commissionAmount > 0)
                                                    ? d.commissionAmount
                                                    : (((d.closedAmount || d.finalPrice || d.price || 0) * commPct) / 100);
                                                const fixedVal = d.fixedAmount ?? d.perCustomerAssignmentFee ?? dealer.perCustomerAssignmentFee ?? 0;
                                                const isSettled = Boolean(d.adminSettled);
                                                const isPaid = d.paymentStatus === 'paid' || isSettled;

                                                return (
                                                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-slate-700">#{d.id?.slice(-8) || d.id}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-slate-900 font-bold">{d.customerName || d.clientName || 'Customer'}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">{d.customerPhone || d.clientPhone || '—'}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-bold text-[#0A2342]">{d.productTitle || d.productCategory || d.systemName || d.productName || 'Power System'}</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {d.productType || 'Standard'}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                                            ₹{(d.closedAmount || d.finalPrice || d.price || 0).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                                                            ₹{Math.round(commVal).toLocaleString('en-IN')}
                                                            <span className="text-[9px] text-slate-400 block font-normal">({commPct}%)</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-purple-700">
                                                            ₹{fixedVal.toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isSettled ? (
                                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                                    ✓ Closed & Verified
                                                                </span>
                                                            ) : isPaid ? (
                                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                                                                    Paid (Pending Admin)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-red-100 text-red-800 border border-red-200">
                                                                    ⚠ Unpaid
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {d.invoiceUrl ? (
                                                                <a
                                                                    href={d.invoiceUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition-colors border border-emerald-200"
                                                                >
                                                                    <Download className="h-3 w-3" /> Invoice
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400 text-[10px]">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 5: VERIFICATION DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-505 uppercase tracking-wider border-b border-slate-100 pb-2">
                                Business & legal documentation verification
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* GSTIN Document Info card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Document type</span>
                                            <span className="bg-emerald-100 text-emerald-805 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-200 uppercase tracking-wide">GST registered</span>
                                        </div>
                                        <h4 className="text-sm font-black text-[#0A2342] uppercase tracking-tight flex items-center gap-1.5">
                                            <FileText className="h-4.5 w-4.5 text-emerald-600" /> Goods & Services tax IN
                                        </h4>
                                    </div>
                                    <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono font-black text-base text-slate-800">
                                        <span className="uppercase">{dealer.gstin || 'NOT PROVIDED'}</span>
                                        {dealer.gstin && (
                                            <button
                                                onClick={() => copyToClipboard(dealer.gstin, 'gstin')}
                                                className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-550 font-sans text-xs flex items-center gap-1 transition-colors"
                                            >
                                                {copiedField === 'gstin' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                <span className="text-[10px] font-bold">{copiedField === 'gstin' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* PAN Number Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Document type</span>
                                            <span className="bg-blue-105 text-blue-705 px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-200 uppercase tracking-wide">Income Tax India</span>
                                        </div>
                                        <h4 className="text-sm font-black text-[#0A2342] uppercase tracking-tight flex items-center gap-1.5">
                                            <FileText className="h-4.5 w-4.5 text-blue-600" /> Permanent Account Number
                                        </h4>
                                    </div>
                                    <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-220 flex items-center justify-between font-mono font-black text-base text-slate-800">
                                        <span className="uppercase">{maskValue(dealer.panNumber, showPan, 3)}</span>
                                        <div className="flex items-center gap-2">
                                            {dealer.panNumber && (
                                                <>
                                                    <button
                                                        onClick={() => setShowPan(!showPan)}
                                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                                    >
                                                        {showPan ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(dealer.panNumber, 'pan')}
                                                        className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-550 font-sans text-xs flex items-center gap-1 transition-colors"
                                                    >
                                                        {copiedField === 'pan' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                        <span className="text-[10px] font-bold">{copiedField === 'pan' ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Aadhaar Number Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Document type</span>
                                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-purple-200 uppercase tracking-wide">UIDAI National ID</span>
                                        </div>
                                        <h4 className="text-sm font-black text-[#0A2342] uppercase tracking-tight flex items-center gap-1.5">
                                            <User className="h-4.5 w-4.5 text-purple-650" /> Aadhaar Card Number
                                        </h4>
                                    </div>
                                    <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-220 flex items-center justify-between font-mono font-black text-base text-slate-800">
                                        <span>{maskValue(dealer.aadhaarNumber, showAadhaar, 4)}</span>
                                        <div className="flex items-center gap-2">
                                            {dealer.aadhaarNumber && (
                                                <>
                                                    <button
                                                        onClick={() => setShowAadhaar(!showAadhaar)}
                                                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                                    >
                                                        {showAadhaar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(dealer.aadhaarNumber, 'aadhaar')}
                                                        className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-550 font-sans text-xs flex items-center gap-1 transition-colors"
                                                    >
                                                        {copiedField === 'aadhaar' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                        <span className="text-[10px] font-bold">{copiedField === 'aadhaar' ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Trade License Card */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Document type</span>
                                            <span className="bg-amber-100 text-amber-705 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-200 uppercase tracking-wide">Municipal Authorization</span>
                                        </div>
                                        <h4 className="text-sm font-black text-[#0A2342] uppercase tracking-tight flex items-center gap-1.5">
                                            <FileText className="h-4.5 w-4.5 text-amber-600" /> Business Trade License
                                        </h4>
                                    </div>
                                    <div className="bg-white px-4 py-3.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono font-black text-base text-slate-800">
                                        <span className="uppercase">{dealer.tradeLicense || 'NOT PROVIDED / EXEMPT'}</span>
                                        {dealer.tradeLicense && (
                                            <button
                                                onClick={() => copyToClipboard(dealer.tradeLicense, 'trade')}
                                                className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-550 font-sans text-xs flex items-center gap-1 transition-colors"
                                            >
                                                {copiedField === 'trade' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                <span className="text-[10px] font-bold">{copiedField === 'trade' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Profile/Shop Photo Card */}
                                {dealer.profilePhoto && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:col-span-2 space-y-3">
                                        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Dealer Profile / Storefront Photo</span>
                                        <div className="flex justify-center bg-white p-3 rounded-xl border border-slate-200 max-h-[250px] overflow-hidden">
                                            <img
                                                src={dealer.profilePhoto}
                                                alt="Dealer Storefront / Profile"
                                                className="object-contain rounded-lg max-h-[220px]"
                                                onError={(e) => {
                                                    // Hide on render error
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>

        {showApproveRatesModal && (
            <ApproveDealerCommissionModal
                isOpen={showApproveRatesModal}
                dealer={dealer}
                initialFee={custFeeInput}
                initialPct={commPctInput}
                onClose={() => setShowApproveRatesModal(false)}
                onSaveAndApprove={handleSaveRatesAndApprove}
            />
        )}
        </>
    );
}
