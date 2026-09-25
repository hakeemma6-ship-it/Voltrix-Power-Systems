'use client';
/**
 * CustomerDetailModal — Unified Customer Modal.
 * Displays Customer Details, Assigned Dealer, Inquiry Info, and Closed Deals.
 * Features a dedicated "Close Deal" sub-section for recording deal value, product title,
 * product type, description, and invoice document attachment (PDF, JPG, PNG, DOC, etc.),
 * all visible to both dealers and admins.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, User, Phone, Mail, ClipboardList, Calendar,
  Building2, Key, ArrowRight, ShieldCheck, CheckCircle2,
  Trash2, Handshake, Check, IndianRupee, Package, FileText,
  Tag, Sparkles, Loader2, Plus, ChevronDown, ChevronUp, AlertCircle,
  Upload, Download, Eye, ExternalLink, File, Hash, Send, UserCheck
} from 'lucide-react';
import type { Customer } from '@/types';
import { formatPurchaseDate } from '@/utils/customerSearch';

interface Props {
  customer: Customer | any;
  userRole: 'dealer' | 'admin';
  session: any;
  dealers?: any[]; // Passed if admin role to allow reassignment
  onClose: () => void;
  onUpdate: () => void;
}

type ModalTab = 'details' | 'deals';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_discussion: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
};

const PRODUCT_TYPES = [
  'UPS Systems',
  'Servo Stabilizers',
  'Solar Inverters',
  'Battery Systems',
  'Online UPS',
  'Hybrid Solar',
  'Industrial Servo Stabilizers',
  'Other'
];

export default function CustomerDetailModal({ customer, userRole, session, dealers = [], onClose, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [deals, setDeals] = useState<any[]>([]);
  const [inquiry, setInquiry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin assign state
  const [assigningDealer, setAssigningDealer] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState(customer.assignedDealerId || '');
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(customer.assignedDealerName || null);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [acceptingLead, setAcceptingLead] = useState(false);

  // Credentials generation / activation link
  const [genPassResult, setGenPassResult] = useState<{ email?: string; message?: string } | null>(null);

  // Email update
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailToUpdate, setEmailToUpdate] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Deal Closure Sub-section state
  const [showCloseDealForm, setShowCloseDealForm] = useState(false);
  const [closingDeal, setClosingDeal] = useState(false);
  const [dealError, setDealError] = useState('');
  const [dealSuccess, setDealSuccess] = useState<any | null>(null);

  const [dealForm, setDealForm] = useState({
    closedAmount: '',
    productTitle: '',
    productType: customer.category || 'UPS Systems',
    description: '',
    invoiceNumber: '',
  });

  // Invoice Document upload state
  const [invoiceFile, setInvoiceFile] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, iRes] = await Promise.all([
        fetch('/api/deals', { headers }),
        fetch('/api/inquiries', { headers }),
      ]);
      if (dRes.ok) {
        const allDeals = await dRes.json();
        setDeals(allDeals.filter((d: any) => d.customerId === customer.id || d.customerPhone === customer.phone));
      }
      if (iRes.ok) {
        const allInquiries = await iRes.json();
        const found = allInquiries.find((inq: any) => inq.linkedCustomerId === customer.id || inq.phone === customer.phone || (customer.email && inq.email === customer.email));
        setInquiry(found || null);
      }
    } catch { }
    finally { setLoading(false); }
  }, [customer]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async (dealerIdToAssign?: string) => {
    const dealerId = dealerIdToAssign || selectedDealerId;
    if (!dealerId) return;
    setAssigningDealer(true);
    const targetDealer = approvedDealers.find(d => d.id === dealerId);
    const resolvedDealerName = targetDealer?.companyName || targetDealer?.name || 'Dealer';

    // 1. Instant optimistic update
    customer.assignedDealerId = dealerId;
    customer.assignedDealerName = resolvedDealerName;
    customer.status = 'assigned';
    setAssignmentSuccess(resolvedDealerName);

    // 2. Show instant confirmation Toast
    setToast({
      title: 'CUSTOMER ASSIGNED',
      message: `Customer "${customer.name}" has been successfully assigned to ${resolvedDealerName}. Dealer notified via WhatsApp.`,
      type: 'success'
    });

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'assign', dealerId }),
      });
      if (res.ok) {
        onUpdate();
        await loadData();
      } else {
        const d = await res.json();
        setToast({
          title: 'ASSIGNMENT FAILED',
          message: d.error || 'Failed to assign dealer.',
          type: 'error'
        });
      }
    } catch {
      setToast({
        title: 'NETWORK ERROR',
        message: 'Network error while assigning dealer.',
        type: 'error'
      });
    } finally {
      setAssigningDealer(false);
    }
  };

  const handleAcceptLead = async () => {
    setAcceptingLead(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'accept_lead' }),
      });
      if (res.ok) {
        onUpdate();
        await loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to accept lead.');
      }
    } catch {
      alert('Network error accepting lead.');
    } finally {
      setAcceptingLead(false);
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'send_activation' }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenPassResult({ email: data.email || customer.email, message: data.message });
        onUpdate();
      } else {
        alert(data.error || 'Failed to send activation link.');
      }
    } catch { alert('Network error.'); }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToUpdate) return;
    setUpdatingEmail(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ email: emailToUpdate.trim() }),
      });
      if (res.ok) {
        setShowEmailForm(false);
        onUpdate();
        handleGeneratePassword();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update email.');
      }
    } catch { alert('Network error.'); }
    finally { setUpdatingEmail(false); }
  };

  const handleDeleteCustomer = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await fetch(`/api/customers/${customer.id}`, { method: 'DELETE', headers });
      onUpdate();
      onClose();
    } catch { }
  };

  // Handle Invoice File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setDealError('Invoice file size exceeds 15MB. Please choose a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceFile({
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
      });
      setDealError('');
    };
    reader.onerror = () => {
      setDealError('Failed to read document. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const removeInvoiceFile = () => {
    setInvoiceFile(null);
  };

  // Close Deal Handler
  const handleCloseDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealError('');

    const parsedAmount = parseFloat(dealForm.closedAmount);
    if (!dealForm.closedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setDealError('Please enter a valid closing deal value.');
      return;
    }
    if (!dealForm.productTitle.trim()) {
      setDealError('Please enter the title of the product.');
      return;
    }
    if (!dealForm.productType.trim()) {
      setDealError('Please select or specify the product type.');
      return;
    }

    const dealerIdToUse = userRole === 'dealer'
      ? (session?.dealerId || session?.id)
      : (selectedDealerId || customer.assignedDealerId || (dealers.length > 0 ? dealers[0].id : ''));

    if (!dealerIdToUse) {
      setDealError('No dealer assigned to record this deal. Please assign a dealer first.');
      return;
    }

    setClosingDeal(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dealerId: dealerIdToUse,
          customerId: customer.id,
          closedAmount: parsedAmount,
          productTitle: dealForm.productTitle.trim(),
          productType: dealForm.productType.trim(),
          description: dealForm.description.trim(),
          invoiceNumber: dealForm.invoiceNumber.trim(),
          invoiceUrl: invoiceFile?.dataUrl || '',
          invoiceName: invoiceFile?.name || '',
          invoiceType: invoiceFile?.type || '',
          invoiceSize: invoiceFile?.size || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDealSuccess(data);
        setDealForm({
          closedAmount: '',
          productTitle: '',
          productType: customer.category || 'UPS Systems',
          description: '',
          invoiceNumber: '',
        });
        setInvoiceFile(null);
        setShowCloseDealForm(false);
        await loadData();
        onUpdate();
        setTimeout(() => setDealSuccess(null), 8000);
      } else {
        setDealError(data.error || 'Failed to record deal closure.');
      }
    } catch {
      setDealError('Network error while closing deal.');
    } finally {
      setClosingDeal(false);
    }
  };

  const approvedDealers = dealers.filter(d => d.status === 'approved');
  const commissionPercentage = userRole === 'dealer' ? (session?.commissionPercentage || 0) : 0;
  const estimatedCommission = dealForm.closedAmount && !isNaN(parseFloat(dealForm.closedAmount))
    ? ((parseFloat(dealForm.closedAmount) * commissionPercentage) / 100).toFixed(2)
    : '0.00';

  const inputCls = "w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-emerald-500 font-medium transition-colors shadow-2xs";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[999999] max-w-md w-full bg-[#0A2342] text-white border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 animate-slide-in">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">{toast.title}</p>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-semibold">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A2342] text-white p-6 relative flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-xl text-white shadow-md">
              {customer.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase tracking-tight">{customer.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLOR[customer.status] || 'bg-slate-100 text-slate-700'}`}>
                  {customer.status?.replace(/_/g, ' ')}
                </span>
                {deals.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Deal Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-3 mt-0.5">
                <span>Phone: <strong className="font-mono text-emerald-400">{customer.phone}</strong></span>
                {customer.email && <span>Email: <strong className="text-slate-200">{customer.email}</strong></span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'details' ? 'border-emerald-500 text-emerald-700 bg-white shadow-xs' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <User className="h-4 w-4" />Customer Details
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'deals' ? 'border-emerald-500 text-emerald-700 bg-white shadow-xs' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Handshake className="h-4 w-4" />Closed Deals ({deals.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Global Deal Success Banner */}
          {dealSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 shadow-xs animate-fade-in">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-black text-emerald-900 text-sm">Deal Recorded Successfully!</p>
                <p className="text-emerald-700 mt-0.5">
                  <strong>{dealSuccess.productTitle}</strong> ({dealSuccess.productType}) closed for{' '}
                  <strong>₹{dealSuccess.closedAmount?.toLocaleString('en-IN')}</strong>.
                  {dealSuccess.commissionAmount > 0 && (
                    <span className="font-bold text-amber-800 ml-1">
                      Commission: ₹{dealSuccess.commissionAmount?.toLocaleString('en-IN')} ({dealSuccess.commissionPercentage}%)
                    </span>
                  )}
                  {dealSuccess.invoiceUrl && (
                    <span className="block text-emerald-800 mt-1 font-semibold">
                      ✓ Invoice document attached: {dealSuccess.invoiceName || 'Attached file'}
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => setDealSuccess(null)} className="text-emerald-600 hover:text-emerald-900 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Activation Link Result Banner */}
              {genPassResult && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Activation Link Dispatched via WhatsApp!</span>
                  </div>
                  <div className="text-xs space-y-1 bg-white p-3 rounded-xl border border-emerald-100 text-slate-700">
                    <p><strong>Customer:</strong> {customer.name} ({genPassResult.email || customer.phone})</p>
                    <p className="text-slate-500">A cryptographically secure, one-time activation link (valid for 1 week) has been sent to the customer&apos;s WhatsApp number. The customer will set their own password upon opening the link.</p>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Customer Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Full Name</span><span className="font-bold text-slate-800">{customer.name}</span></div>
                  <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Phone Number</span><span className="font-bold font-mono text-slate-800">{customer.phone}</span></div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Email Address</span>
                    {customer.email ? (
                      <span className="font-bold text-slate-800">{customer.email}</span>
                    ) : (
                      <button onClick={() => { setEmailToUpdate(''); setShowEmailForm(true); }} className="text-emerald-600 hover:underline font-bold text-xs">
                        + Add Email for Login Credentials
                      </button>
                    )}
                  </div>
                  <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Product Interest</span><span className="font-bold text-slate-800">{customer.category || 'General'}</span></div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Invoice Number</span>
                    {(customer.invoiceNumber || (deals.length > 0 && deals[0].invoiceNumber)) ? (
                      <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5 text-emerald-600" />
                        #{customer.invoiceNumber || deals[0].invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Not issued yet</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Purchase Date</span>
                    {(customer.purchaseDate || (deals.length > 0 && (deals[0].closedAt || deals[0].createdAt))) ? (
                      <span className="font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        {formatPurchaseDate(customer.purchaseDate || deals[0].closedAt || deals[0].createdAt)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Pending purchase</span>
                    )}
                  </div>
                </div>
                {customer.notes && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">Customer Notes</span>
                    <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">{customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Add Email Form Modal/Box */}
              {showEmailForm && (
                <form onSubmit={handleUpdateEmail} className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-800">Add Customer Email Address</p>
                  <input
                    type="email"
                    required
                    placeholder="customer@email.com"
                    value={emailToUpdate}
                    onChange={e => setEmailToUpdate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl bg-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowEmailForm(false)} className="px-3 py-1.5 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200">Cancel</button>
                    <button type="submit" disabled={updatingEmail} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600">
                      {updatingEmail ? 'Saving...' : 'Save & Send Activation Link'}
                    </button>
                  </div>
                </form>
              )}

              {/* ─── DEAL CLOSURE SUB-SECTION ─── */}
              {userRole === 'dealer' && (
                <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border-2 border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-[#0A2342] uppercase tracking-wider flex items-center gap-1.5">
                          Deal Closure Sub-Section
                          {customer.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">Closed</span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">Record final deal value, product title, type, description, and invoice</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCloseDealForm(!showCloseDealForm)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      {showCloseDealForm ? (
                        <>Hide Form <ChevronUp className="h-3.5 w-3.5" /></>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          {deals.length > 0 ? 'Close Another Deal' : 'Close This Deal'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Form toggle body */}
                  {showCloseDealForm ? (
                    <form onSubmit={handleCloseDeal} className="mt-4 space-y-4 animate-fade-in">
                      {dealError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{dealError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Closing Deal Value */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Closing Deal Value (₹) *</span>
                            {commissionPercentage > 0 && (
                              <span className="text-emerald-600 font-bold text-[9px]">
                                {commissionPercentage}% Comm. (₹{estimatedCommission})
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              required
                              min="1"
                              step="any"
                              placeholder="e.g. 75000"
                              value={dealForm.closedAmount}
                              onChange={e => setDealForm(p => ({ ...p, closedAmount: e.target.value }))}
                              className={`${inputCls} pl-7 font-mono font-bold text-slate-800`}
                            />
                          </div>
                        </div>

                        {/* Product Type */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                            Product Type *
                          </label>
                          <select
                            value={dealForm.productType}
                            onChange={e => setDealForm(p => ({ ...p, productType: e.target.value }))}
                            className={inputCls}
                            required
                          >
                            {PRODUCT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        {/* Title of Product */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                            Title of Product *
                          </label>
                          <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Voltrix 10kVA Online UPS (3-Phase with 16 Battery Rack)"
                              value={dealForm.productTitle}
                              onChange={e => setDealForm(p => ({ ...p, productTitle: e.target.value }))}
                              className={`${inputCls} pl-9`}
                            />
                          </div>
                        </div>

                        {/* Invoice Number */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Hash className="h-3.5 w-3.5 text-emerald-600" />
                              Invoice Number
                            </span>
                            <span className="text-slate-400 font-normal text-[9px]">Optional · Tax Invoice / Bill No.</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">#</span>
                            <input
                              type="text"
                              placeholder="e.g. INV-2026-0042 or VTX/26/108"
                              value={dealForm.invoiceNumber}
                              onChange={e => setDealForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                              className={`${inputCls} pl-8 font-mono text-slate-800`}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                            Description / Deal Specifications
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Provide specifications, warranty terms, installation location, or any customer notes regarding this closure..."
                            value={dealForm.description}
                            onChange={e => setDealForm(p => ({ ...p, description: e.target.value }))}
                            className={`${inputCls} resize-none`}
                          />
                        </div>

                        {/* Invoice Document Upload */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-emerald-600" />
                              Invoice Document (PDF, JPG, PNG, DOC, etc.)
                            </span>
                            <span className="text-slate-400 font-normal text-[9px]">Optional · All formats accepted</span>
                          </label>

                          {!invoiceFile ? (
                            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/60 hover:bg-emerald-50/30 transition-all group">
                              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors shadow-2xs">
                                <Upload className="h-4 w-4" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                                  Click to attach invoice document or drag & drop here
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  PDF, JPG, JPEG, PNG, DOC, DOCX, or any format up to 15MB
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*"
                                onChange={handleFileChange}
                              />
                            </label>
                          ) : (
                            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px] uppercase">
                                  {invoiceFile.name.split('.').pop()?.slice(0, 4) || 'FILE'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#0A2342] truncate max-w-[240px] sm:max-w-md">{invoiceFile.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    {(invoiceFile.size / 1024).toFixed(1)} KB · Ready to save with deal
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={removeInvoiceFile}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2.5 justify-end pt-2 border-t border-emerald-100">
                        <button
                          type="button"
                          onClick={() => setShowCloseDealForm(false)}
                          className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={closingDeal}
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {closingDeal ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Saving Deal...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Submit & Close Deal</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500">
                      {deals.length > 0 ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100 flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-[#0A2342] block text-xs">
                              {deals[0].productTitle || deals[0].productCategory || 'Closed Deal'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Type: {deals[0].productType || deals[0].productCategory || 'General'} · Closed: {new Date(deals[0].closedAt).toLocaleDateString('en-IN')}
                              {deals[0].invoiceNumber && ` · Inv: #${deals[0].invoiceNumber}`}
                            </span>
                            {deals[0].invoiceUrl && (
                              <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">
                                📎 Invoice: {deals[0].invoiceName || 'Attached Document'}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-sm text-emerald-700 font-mono">
                            ₹{deals[0].closedAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <p className="italic text-slate-400">Click &quot;Close This Deal&quot; to enter product title, value, type, description, and invoice document.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Closed Deal Summary for Admin (or dealer when deal exists) */}
              {userRole === 'admin' && deals.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Handshake className="h-4 w-4 text-emerald-600" /> Latest Closed Deal Details
                    </h3>
                    <button
                      onClick={() => setActiveTab('deals')}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      View All ({deals.length}) <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-sm text-[#0A2342]">{deals[0].productTitle || 'Closed Deal'}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                            {deals[0].productType || deals[0].productCategory || 'General'}
                          </span>
                          {deals[0].invoiceNumber && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Inv #{deals[0].invoiceNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Dealer: <strong className="text-slate-800">{deals[0].dealerCompanyName}</strong></p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-emerald-700 font-mono">₹{deals[0].closedAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-bold text-amber-700">Commission: ₹{deals[0].commissionAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {deals[0].description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed">
                        {deals[0].description}
                      </p>
                    )}

                    {/* Invoice Document Box in Admin Summary */}
                    {deals[0].invoiceUrl && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-2xs shrink-0">
                            {deals[0].invoiceName?.split('.').pop()?.slice(0, 4) || 'DOC'}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Invoice Document
                            </span>
                            <p className="text-xs font-bold text-[#0A2342] truncate max-w-[200px] sm:max-w-xs mt-0.5">
                              {deals[0].invoiceName || 'Attached Document'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`${deals[0].invoiceUrl}?view=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </a>
                          <a
                            href={`${deals[0].invoiceUrl}?download=1`}
                            download={deals[0].invoiceName || 'invoice_document'}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {userRole === 'dealer' && (customer.status === 'assigned' || customer.status === 'new') && (
                  <button
                    onClick={handleAcceptLead}
                    disabled={acceptingLead}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {acceptingLead ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Accepting Lead...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Accept Lead & Start Discussion</span>
                      </>
                    )}
                  </button>
                )}

                {userRole === 'dealer' && customer.status === 'in_discussion' && (
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>Lead Accepted — Discussion In Progress</span>
                  </div>
                )}

                {userRole === 'admin' && (
                  <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dealer Assignment</p>
                      {(assignmentSuccess || customer.assignedDealerName) && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>CUSTOMER ASSIGNED: {assignmentSuccess || customer.assignedDealerName}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedDealerId}
                        onChange={e => {
                          setSelectedDealerId(e.target.value);
                          if (e.target.value) handleAssign(e.target.value);
                        }}
                        className="flex-1 text-xs border-2 border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 bg-white font-bold text-slate-800 focus:outline-none transition-colors"
                      >
                        <option value="">Select dealer to assign in 1 click...</option>
                        {approvedDealers.map(d => (
                          <option key={d.id} value={d.id}>{d.companyName} ({d.city})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign()}
                        disabled={assigningDealer || !selectedDealerId}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        {assigningDealer ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Assigning...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span>Assign</span>
                          </>
                        )}
                      </button>
                    </div>

                    {assignmentSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-black uppercase tracking-wider text-emerald-800">Customer Assigned Successfully!</p>
                          <p className="text-[11px] text-emerald-700 font-medium">Assigned to {assignmentSuccess}. WhatsApp alert dispatched to dealer.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {customer.email && !genPassResult && (
                  <button onClick={handleGeneratePassword} className="px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer">
                    <Send className="h-4 w-4" />Send Activation Link (WhatsApp)
                  </button>
                )}

                {userRole === 'admin' && (
                  <button onClick={handleDeleteCustomer} className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5 ml-auto cursor-pointer">
                    <Trash2 className="h-4 w-4" />Delete Customer
                  </button>
                )}
              </div>

              {/* Linked Inquiry info */}
              {inquiry && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Linked Inquiry</h3>
                  <p className="text-xs font-bold text-[#0A2342]">{inquiry.subject}</p>
                  <p className="text-xs text-slate-600">{inquiry.message}</p>
                  <p className="text-[10px] text-slate-400">Received: {new Date(inquiry.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEALS */}
          {activeTab === 'deals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Closed Deals History</h3>
                  <p className="text-[11px] text-slate-500">Full records of closed deal values, products, descriptions, and invoices</p>
                </div>
                {userRole === 'dealer' && (
                  <button
                    onClick={() => {
                      setActiveTab('details');
                      setShowCloseDealForm(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Close New Deal
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
              ) : deals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Handshake className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-xs">No deals recorded for this customer yet.</p>
                  {userRole === 'dealer' && (
                    <button
                      onClick={() => {
                        setActiveTab('details');
                        setShowCloseDealForm(true);
                      }}
                      className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Close Deal Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {deals.map(deal => (
                    <div key={deal.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all space-y-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Package className="h-3.5 w-3.5" />
                            </span>
                            <h4 className="font-black text-sm text-[#0A2342]">
                              {deal.productTitle || deal.productCategory || 'Closed Deal'}
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                              {deal.productType || deal.productCategory || 'General'}
                            </span>
                            {deal.invoiceNumber && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                                Inv #{deal.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Dealer: <strong className="text-slate-800">{deal.dealerCompanyName}</strong>
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs">
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Commission ({deal.commissionPercentage}%): ₹{(deal.commissionAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Fixed Amount: ₹{(deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? 0).toLocaleString('en-IN')}
                            </span>
                            <span className="font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Total Admin Share: ₹{(deal.totalAdminDue ?? ((deal.commissionAmount || 0) + (deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? 0))).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="mt-1.5">
                            {deal.adminSettled ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Deal Closed & Verified by Admin
                              </span>
                            ) : deal.paymentStatus === 'paid' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                                Payment Sent — Awaiting Admin
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-red-100 text-red-800 border border-red-200">
                                ⚠ Payment Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Deal Value</span>
                          <p className="text-lg font-black text-emerald-700 font-mono">
                            ₹{deal.closedAmount?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Description / Deal Details Box */}
                      {(deal.description || deal.notes) && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Deal Description / Scope</span>
                            <p>{deal.description || deal.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Invoice Document Box */}
                      {deal.invoiceUrl && (
                        <div className="bg-white p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-2xs shrink-0">
                              {deal.invoiceName?.split('.').pop()?.slice(0, 4) || 'DOC'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Invoice Document
                              </span>
                              <p className="text-xs font-bold text-[#0A2342] truncate max-w-[200px] sm:max-w-xs mt-0.5">
                                {deal.invoiceName || 'Invoice Document'}
                              </p>
                              {deal.invoiceSize > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  {(deal.invoiceSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={`${deal.invoiceUrl}?view=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </a>
                            <a
                              href={`${deal.invoiceUrl}?download=1`}
                              download={deal.invoiceName || 'invoice_document'}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 font-medium">
                        <span>Deal ID: <code className="font-mono text-slate-500">{deal.id}</code></span>
                        <span>Closed On: {new Date(deal.closedAt || deal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
