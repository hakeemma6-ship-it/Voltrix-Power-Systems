'use client';
/**
 * AdminPanel — Full admin management panel.
 * Single-page tabbed interface replacing the old 235KB monolith.
 *
 * Tabs:
 *  1. Customers — Add manually / view all / assign to dealer
 *  2. Inquiries — Public form submissions, assign to dealer
 *  3. Dealers   — View registrations, approve with commission settings / suspend / reactivate
 *  4. Deals     — Deal closures and commission tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, Building2, Receipt,
  LogOut, Plus, Check, X, AlertTriangle, RefreshCw,
  Search, Zap, ChevronDown, Phone, Mail, MapPin, Calendar,
  ArrowRight, Eye, Ban, RotateCcw, Key, ClipboardList, Bell,
  Printer, LayoutDashboard, TrendingUp, DollarSign, Activity,
  Award, ArrowUpRight, Sparkles, Settings, Package, Handshake, BadgeIndianRupee, Download,
  IndianRupee, CheckCircle2, Clock, MessageSquare
} from 'lucide-react';
import CustomerDetailModal from '../portal/CustomerDetailModal';
import CompanySettingsTab from '../portal/CompanySettingsTab';
import ProductsTab from './ProductsTab';
import DealerDetailModal from '../portal/DealerDetailModal';
import DealerAiAssistant from '../portal/DealerAiAssistant';
import { matchesCustomerSearch, formatPurchaseDate } from '@/utils/customerSearch';

interface Props {
  adminSession: any;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'customers' | 'inquiries' | 'dealers' | 'deals' | 'products' | 'settings' | 'ai';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_discussion: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PRODUCT_CATEGORIES = ['UPS Systems', 'Servo Stabilizers', 'Solar Inverters', 'Battery Systems', 'Online UPS', 'Hybrid Solar', 'Industrial Stabilizers', 'Other'];

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[status?.toLowerCase()] || 'bg-slate-100 text-slate-500'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function SectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-black text-[#0A2342] uppercase tracking-tight">{title}</h2>
        {count !== undefined && (
          <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
      <p className="text-xs text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
        <span className="font-bold text-slate-800">{endItem}</span> of{' '}
        <span className="font-bold text-slate-800">{totalItems}</span> entries
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-8 min-w-8 px-2 rounded-lg text-xs font-black transition-all ${currentPage === page
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {page}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────────────────────

function CustomersTab({ dealers }: { dealers: any[] }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignDealer, setAssignDealer] = useState('');
  const [genPassResult, setGenPassResult] = useState<{ email?: string; name?: string; message?: string } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedCustomerForEmailUpdate, setSelectedCustomerForEmailUpdate] = useState<any | null>(null);
  const [emailToUpdate, setEmailToUpdate] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', email: '', category: '', notes: '', invoiceNumber: '', purchaseDate: '', generateCredentials: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers', { headers });
      if (res.ok) setCustomers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approvedDealers = dealers.filter(d => d.status === 'approved');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!form.name || !form.phone) { setErr('Name and Phone are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/customers', { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to add customer.'); }
      else { setCustomers(prev => [data, ...prev]); setShowAddForm(false); setForm({ name: '', phone: '', email: '', category: '', notes: '', invoiceNumber: '', purchaseDate: '', generateCredentials: false }); }
    } finally { setSaving(false); }
  };

  const handleAssign = async (customerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!assignDealer) return;
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ action: 'assign', dealerId: assignDealer }),
      });
      if (res.ok) { await load(); setAssigning(null); setAssignDealer(''); }
    } catch { }
  };

  const handleGeneratePassword = async (customerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const customer = customers.find(cust => cust.id === customerId);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ action: 'send_activation' }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenPassResult({
          email: data.email || customer?.email || '',
          name: customer ? customer.name : 'Customer',
          message: data.message || '1-week secure activation link sent via WhatsApp.'
        });
        await load();
      }
      else alert(data.error || 'Failed to send activation link.');
    } catch { }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForEmailUpdate || !emailToUpdate) return;
    setUpdatingEmail(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomerForEmailUpdate.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ email: emailToUpdate.trim() }),
      });
      if (res.ok) {
        await load();
        // Automatically trigger activation link dispatch after saving the email!
        const targetId = selectedCustomerForEmailUpdate.id;
        const targetName = selectedCustomerForEmailUpdate.name;
        setSelectedCustomerForEmailUpdate(null);
        setEmailToUpdate('');

        // Dispatch activation link instantly after setting email
        const genRes = await fetch(`/api/customers/${targetId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ action: 'send_activation' }),
        });
        const genData = await genRes.json();
        if (genRes.ok) {
          setGenPassResult({
            email: genData.email || emailToUpdate.trim(),
            name: targetName,
            message: genData.message || '1-week secure activation link sent via WhatsApp.'
          });
          await load();
        } else {
          alert(genData.error || 'Email saved, but failed to send activation link automatically.');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update email.');
      }
    } catch {
      alert('Network error updating email.');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE', headers });
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const filtered = customers.filter(c => matchesCustomerSearch(c, search));

  const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium placeholder:text-slate-400";

  return (
    <div>
      <SectionHeader
        title="Customers"
        count={customers.length}
        action={
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />Add Customer
          </button>
        }
      />

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#0A2342] uppercase text-base">Add New Customer</h3>
              <button onClick={() => setShowAddForm(false)} className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Name *</label>
                  <input className={inputCls} placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Phone *</label>
                  <input className={inputCls} placeholder="+91 98000 00000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email (optional)</label>
                  <input type="email" className={inputCls} placeholder="customer@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Invoice Number (optional)</label>
                  <input className={inputCls} placeholder="e.g. INV-2026-001" value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Purchase Date (optional)</label>
                  <input type="date" className={inputCls} value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Product Category</label>
                  <select className={inputCls} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Notes</label>
                  <textarea className={`${inputCls} h-20 resize-none`} placeholder="Any special requirements, existing products, etc." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input type="checkbox" className="w-4 h-4 text-emerald-500 rounded border-slate-300" checked={form.generateCredentials} onChange={e => setForm(p => ({ ...p, generateCredentials: e.target.checked }))} />
                    <span className="text-xs font-bold text-slate-600">Send 1-Week Activation Link via WhatsApp</span>
                  </label>
                </div>
              </div>
              {err && <p className="text-red-600 text-xs font-semibold">{err}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                  {saving ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activation Link Dispatched Modal */}
      {genPassResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center bg-white">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="font-black text-[#0A2342] text-base mb-2">Activation Link Dispatched</h3>
            <p className="text-slate-500 text-xs mb-4">A cryptographically secure, one-time activation link valid for 1 week was sent to {genPassResult.name || 'the customer'} via WhatsApp.</p>
            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-200 mb-4 animate-fade-in">
              <div><span className="text-xs font-bold text-slate-500 uppercase">Customer:</span> <span className="text-sm font-bold text-slate-900">{genPassResult.name}</span></div>
              {genPassResult.email && <div><span className="text-xs font-bold text-slate-500 uppercase">Email:</span> <span className="text-sm font-mono font-bold text-slate-900">{genPassResult.email}</span></div>}
              <div><span className="text-xs font-bold text-slate-500 uppercase">Account Status:</span> <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">PENDING</span></div>
              <p className="text-[11px] text-slate-500 pt-1">The customer can open the HTTPS link anytime within 7 days to set their confidential password.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setGenPassResult(null)} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors">
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Email Modal */}
      {selectedCustomerForEmailUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center bg-white">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="font-black text-[#0A2342] text-sm uppercase mb-2">Email Required</h3>
            <p className="text-slate-500 text-xs mb-4">An email address is required to create credentials for {selectedCustomerForEmailUpdate.name}.</p>
            <form onSubmit={handleUpdateEmail} className="space-y-4 text-left">
              <input
                type="email"
                required
                className={inputCls}
                placeholder="customer@email.com"
                value={emailToUpdate}
                onChange={e => setEmailToUpdate(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedCustomerForEmailUpdate(null)} className="flex-grow py-2.5 rounded-xl border-2 border-slate-200 text-slate-650 text-xs font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={updatingEmail} className="flex-grow py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                  {updatingEmail ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 font-medium placeholder:text-slate-400" placeholder="Search by Customer Name, Mobile No., Invoice No., or Purchase Date..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No customers found.</p>
          <p className="text-xs mt-1">Try searching by Customer Name, Mobile No., Invoice No., or Purchase Date.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.slice((page - 1) * 10, page * 10).map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-grow min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-[#0A2342] text-sm group-hover:text-emerald-700 transition-colors">{c.name}</p>
                        <Badge status={c.status} />
                        {c.source === 'inquiry' && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">From Inquiry</span>}
                        {c.source === 'manual' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">Manual Customer</span>}
                        {c.hasLogin && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">Has Login</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                        {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                        {c.category && <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{c.category}</span>}
                      </div>

                      {/* Invoice No. & Purchase Date Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        {c.invoiceNumber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Inv #{c.invoiceNumber}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-medium">
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span>Inv: Not issued</span>
                          </span>
                        )}

                        {c.purchaseDate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span>Purchased: {formatPurchaseDate(c.purchaseDate)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-medium">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>Not purchased</span>
                          </span>
                        )}
                      </div>

                      {c.assignedDealers && c.assignedDealers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="text-xs text-slate-500 font-bold mr-1">Dealers:</span>
                          {c.assignedDealers.map((ad: any) => (
                            <span key={ad.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                              {ad.name}
                            </span>
                          ))}
                        </div>
                      ) : c.assignedDealerName ? (
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                          <Check className="h-3 w-3" />Assigned to: {c.assignedDealerName}
                        </p>
                      ) : null}
                      {c.notes && <p className="text-xs text-slate-400 mt-1 italic">{c.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span>Manage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}

      {/* Customer Detail Lifecycle Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          userRole="admin"
          session={{ name: 'Admin' }}
          dealers={dealers}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}

// ─── INQUIRIES TAB ────────────────────────────────────────────────────────────

function InquiriesTab({ dealers, onInquiriesChange }: { dealers: any[]; onInquiriesChange?: () => void }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignDealer, setAssignDealer] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inquiries', { headers });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approvedDealers = dealers.filter(d => d.status === 'approved');

  const handleAssign = async (inquiryId: string) => {
    if (!assignDealer) return;
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/assign`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ dealerId: assignDealer }),
      });
      if (res.ok) {
        await load();
        setAssigning(null);
        setAssignDealer('');
        onInquiriesChange?.();
      }
      else { const d = await res.json(); alert(d.error || 'Failed to assign.'); }
    } catch { }
  };

  const filtered = inquiries.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.phone?.includes(search) ||
    i.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader
        title="Inquiries"
        count={inquiries.filter(i => i.status === 'new').length > 0 ? inquiries.filter(i => i.status === 'new').length : inquiries.length}
        action={
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
            <RefreshCw className="h-3 w-3" />Refresh
          </button>
        }
      />
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 font-medium" placeholder="Search inquiries..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No inquiries yet.</p>
          <p className="text-xs mt-1">Inquiries submitted through the website form will appear here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.slice((page - 1) * 10, page * 10).map(inq => (
              <div key={inq.id} className={`bg-white border-2 rounded-2xl p-5 hover:shadow-sm transition-all ${inq.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-[#0A2342] text-sm">{inq.name}</p>
                      <Badge status={inq.status} />
                      {inq.status === 'new' && !inq.isSeenByAdmin && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="New, unseen" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium mb-2">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{inq.phone}</span>
                      {inq.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{inq.email}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(inq.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">{inq.subject}</p>
                    {inq.message && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{inq.message}</p>}
                    {inq.productInterest && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-emerald-600 font-bold">Interested in: {inq.productInterest}</p>
                        {inq.productCategory && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                            {inq.productCategory}
                          </span>
                        )}
                      </div>
                    )}
                    {inq.assignedDealerName && (
                      <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" />Assigned to: {inq.assignedDealerName}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {assigning === inq.id ? (
                      <div className="flex flex-col gap-2">
                        <select value={assignDealer} onChange={e => setAssignDealer(e.target.value)} className="text-xs border-2 border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500">
                          <option value="">Select dealer</option>
                          {approvedDealers.map(d => <option key={d.id} value={d.id}>{d.companyName}</option>)}
                        </select>
                        <div className="flex gap-1">
                          <button onClick={() => handleAssign(inq.id)} className="flex-1 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">Assign</button>
                          <button onClick={() => setAssigning(null)} className="px-2 py-1 bg-slate-100 rounded-lg text-xs"><X className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAssigning(inq.id); setAssignDealer(inq.assignedDealerId || ''); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {inq.assignedDealerId ? 'Reassign' : 'Assign Dealer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── DEALERS TAB ─────────────────────────────────────────────────────────────

function DealersTab({ dealers, onDealersChange }: { dealers: any[]; onDealersChange: () => void }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [actioning, setActioning] = useState<string | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<any | null>(null);
  // Commission settings per dealer: pct (closed deals %), fee (fixed ₹ per assigned customer)
  const [commissionInputs, setCommissionInputs] = useState<Record<string, { pct: string; fee: string }>>({});
  const [savedFeedbacks, setSavedFeedbacks] = useState<Record<string, boolean>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  // Synchronize inputs whenever dealers list updates
  useEffect(() => {
    setCommissionInputs(prev => {
      const next = { ...prev };
      dealers.forEach(d => {
        if (!next[d.id]) {
          next[d.id] = {
            pct: d.commissionPercentage !== undefined && d.commissionPercentage !== null ? String(d.commissionPercentage) : '',
            fee: d.perCustomerAssignmentFee !== undefined && d.perCustomerAssignmentFee !== null ? String(d.perCustomerAssignmentFee) : '',
          };
        }
      });
      return next;
    });
  }, [dealers]);

  const handleSaveRates = async (dealerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActioning(dealerId);
    try {
      const dRecord = dealers.find(d => d.id === dealerId);
      const ci = commissionInputs[dealerId];
      const pctVal = ci?.pct !== undefined && ci.pct !== '' ? parseFloat(ci.pct) : (dRecord?.commissionPercentage ?? 0);
      const feeVal = ci?.fee !== undefined && ci.fee !== '' ? parseFloat(ci.fee) : (dRecord?.perCustomerAssignmentFee ?? 0);

      const res = await fetch(`/api/dealers/${dealerId}/commission`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          commissionPercentage: pctVal,
          perCustomerAssignmentFee: feeVal,
        }),
      });
      if (res.ok) {
        setSavedFeedbacks(prev => ({ ...prev, [dealerId]: true }));
        setTimeout(() => {
          setSavedFeedbacks(prev => ({ ...prev, [dealerId]: false }));
        }, 2000);
        onDealersChange();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update commission rates.');
      }
    } catch {
      alert('Error updating commission rates.');
    } finally {
      setActioning(null);
    }
  };

  const doAction = async (dealerId: string, action: string) => {
    setActioning(dealerId);
    try {
      const body: any = { action };
      if (action === 'approve') {
        const dRecord = dealers.find(d => d.id === dealerId);
        const ci = commissionInputs[dealerId];
        body.commissionPercentage = ci?.pct !== undefined && ci.pct !== '' ? parseFloat(ci.pct) : (dRecord?.commissionPercentage ?? 0);
        body.perCustomerAssignmentFee = ci?.fee !== undefined && ci.fee !== '' ? parseFloat(ci.fee) : (dRecord?.perCustomerAssignmentFee ?? 0);
      }
      const res = await fetch(`/api/dealers/${dealerId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify(body),
      });
      if (res.ok) onDealersChange();
      else { const d = await res.json(); alert(d.error || 'Action failed.'); }
    } finally { setActioning(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dealer?')) return;
    await fetch(`/api/dealers/${id}`, { method: 'DELETE', headers });
    onDealersChange();
  };

  const filtered = dealers.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pending = dealers.filter(d => d.status === 'pending').length;

  return (
    <div>
      <SectionHeader
        title="Dealers"
        count={pending > 0 ? pending : dealers.length}
        action={
          pending > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold">
              <Bell className="h-3 w-3" />{pending} Pending Approval
            </span>
          ) : undefined
        }
      />
      <div className="flex gap-3 mb-5">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 font-medium" placeholder="Search dealers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No dealers found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.slice((page - 1) * 10, page * 10).map(d => (
              <div
                key={d.id}
                onClick={() => setSelectedDealer(d)}
                className={`bg-white border-2 rounded-2xl p-5 hover:shadow-md cursor-pointer hover:border-emerald-500 transition-all ${d.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-[#0A2342] text-sm">{d.companyName}</p>
                      <Badge status={d.status} />
                      {d.status === 'pending' && !d.isSeenByAdmin && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                      {(d.perCustomerAssignmentFee !== undefined || d.commissionPercentage !== undefined) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span>₹{d.perCustomerAssignmentFee ?? 0}/customer</span>
                          <span>•</span>
                          <span>{d.commissionPercentage ?? 0}% closed deals</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mb-1">{d.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{d.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</span>
                      {d.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.city}{d.state ? `, ${d.state}` : ''}</span>}
                    </div>
                    {d.businessType && <p className="text-xs text-slate-400 mt-1">{d.businessType} {d.yearsOfExperience ? `• ${d.yearsOfExperience}yr exp.` : ''}</p>}
                    {d.interestedProducts?.length > 0 && <p className="text-xs text-blue-600 font-medium mt-1">Products: {d.interestedProducts.slice(0, 3).join(', ')}{d.interestedProducts.length > 3 ? '...' : ''}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">Registered: {new Date(d.registeredAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {d.status === 'pending' && (
                      <div className="space-y-1.5">
                        <button disabled={actioning === d.id} onClick={() => doAction(d.id, 'approve')} className="w-full flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer">
                          <Check className="h-3.5 w-3.5" />Approve Dealer
                        </button>
                        <button disabled={actioning === d.id} onClick={() => handleDelete(d.id)} className="w-full flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 border-2 border-red-100 disabled:opacity-50 transition-colors cursor-pointer">
                          <X className="h-3.5 w-3.5" />Reject
                        </button>
                      </div>
                    )}
                    {d.status === 'approved' && (
                      <button disabled={actioning === d.id} onClick={() => doAction(d.id, 'suspend')} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border-2 border-red-100 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer">
                        <Ban className="h-3 w-3" />Suspend
                      </button>
                    )}
                    {d.status === 'suspended' && (
                      <button disabled={actioning === d.id} onClick={() => doAction(d.id, 'reactivate')} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border-2 border-emerald-100 text-xs font-bold hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer">
                        <RotateCcw className="h-3 w-3" />Reactivate
                      </button>
                    )}
                  </div>
                </div>

                {/* 2 Input Fields: Fixed Commission per Customer + Closed Deals Commission % */}
                <div
                  className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                      <BadgeIndianRupee className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#0A2342] uppercase tracking-wider">Commission Settings</p>
                      <p className="text-[10px] text-slate-500 font-medium">Customer assignment fixed fee & closed deal commission</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Input 1: Fixed commission on every customer assigned */}
                    <div className="flex items-center gap-1.5 bg-white border-2 border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:border-emerald-500 transition-all">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="5, 10, 15..."
                        title="Fixed rate per assigned customer"
                        className="w-24 text-xs font-bold text-slate-800 bg-transparent focus:outline-none font-mono"
                        value={commissionInputs[d.id]?.fee ?? (d.perCustomerAssignmentFee !== undefined ? String(d.perCustomerAssignmentFee) : '')}
                        onChange={e => {
                          const val = e.target.value;
                          setCommissionInputs(prev => ({
                            ...prev,
                            [d.id]: {
                              pct: prev[d.id]?.pct ?? (d.commissionPercentage !== undefined ? String(d.commissionPercentage) : ''),
                              fee: val
                            }
                          }));
                        }}
                      />
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">/ customer</span>
                    </div>

                    {/* Input 2: Commission on closed deals */}
                    <div className="flex items-center gap-1.5 bg-white border-2 border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:border-emerald-500 transition-all">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        placeholder="10, 15..."
                        title="Commission percentage on closed deals"
                        className="w-20 text-xs font-bold text-slate-800 bg-transparent focus:outline-none font-mono text-right"
                        value={commissionInputs[d.id]?.pct ?? (d.commissionPercentage !== undefined ? String(d.commissionPercentage) : '')}
                        onChange={e => {
                          const val = e.target.value;
                          setCommissionInputs(prev => ({
                            ...prev,
                            [d.id]: {
                              fee: prev[d.id]?.fee ?? (d.perCustomerAssignmentFee !== undefined ? String(d.perCustomerAssignmentFee) : ''),
                              pct: val
                            }
                          }));
                        }}
                      />
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">% on deals</span>
                    </div>

                    {/* Save button */}
                    <button
                      disabled={actioning === d.id}
                      onClick={(e) => handleSaveRates(d.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        savedFeedbacks[d.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0A2342] hover:bg-[#123966] text-white disabled:opacity-50'
                      }`}
                    >
                      {savedFeedbacks[d.id] ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : actioning === d.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Save Rates</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}

      {selectedDealer && (
        <DealerDetailModal
          dealer={selectedDealer}
          onClose={() => setSelectedDealer(null)}
          onUpdate={() => {
            onDealersChange();
            const updated = dealers.find(x => x.id === selectedDealer.id);
            if (updated) {
              setSelectedDealer(updated);
            } else {
              setSelectedDealer(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

function DashboardTab({
  dealers,
  onDealersChange,
  setActiveTab
}: {
  dealers: any[];
  onDealersChange: () => void;
  setActiveTab: (tab: Tab) => void;
}) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, iRes, dRes] = await Promise.all([
        fetch('/api/customers', { headers }),
        fetch('/api/inquiries', { headers }),
        fetch('/api/deals', { headers }),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (iRes.ok) setInquiries(await iRes.json());
      if (dRes.ok) setDeals(await dRes.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalDealAmount = deals.reduce((acc, d) => acc + (d.closedAmount || 0), 0);
  const totalCommission = deals.reduce((acc, d) => acc + (d.commissionAmount || 0), 0);
  const totalCustomerFees = dealers.reduce((acc, d) => {
    const assignedCount = customers.filter(c =>
      c.assignedDealerId === d.id ||
      (c.assignedDealers || []).some((ad: any) => ad.id === d.id)
    ).length;
    return acc + (assignedCount * (d.perCustomerAssignmentFee || 0));
  }, 0);

  const pendingDealers = dealers.filter(d => d.status === 'pending');
  const approvedDealers = dealers.filter(d => d.status === 'approved');
  const unassignedInquiries = inquiries.filter(i => !i.assignedDealerId && i.status === 'new');

  // Monthly deal trend (last 6 months)
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        monthName: months[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        amount: 0,
        count: 0
      });
    }

    deals.forEach(d => {
      if (!d.closedAt) return;
      const dDate = new Date(d.closedAt);
      if (isNaN(dDate.getTime())) return;
      const idx = last6Months.findIndex(m => m.monthNum === dDate.getMonth() && m.year === dDate.getFullYear());
      if (idx !== -1) {
        last6Months[idx].amount += (d.closedAmount || 0);
        last6Months[idx].count += 1;
      }
    });
    return last6Months;
  })();

  const maxAmount = Math.max(...monthlyData.map(m => m.amount), 10000);

  // Top performing dealers by deal volume
  const dealerContributions = (() => {
    const map: Record<string, { name: string; amount: number; count: number }> = {};
    deals.forEach(d => {
      if (!d.dealerId) return;
      const name = d.dealerCompanyName || 'Unknown Dealer';
      if (!map[d.dealerId]) {
        map[d.dealerId] = { name, amount: 0, count: 0 };
      }
      map[d.dealerId].amount += (d.closedAmount || 0);
      map[d.dealerId].count += 1;
    });

    dealers.filter(d => d.status === 'approved').forEach(d => {
      if (!map[d.id]) {
        map[d.id] = { name: d.companyName || d.name, amount: 0, count: 0 };
      }
    });

    return Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[#FFFFFF] border-2 border-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-72 bg-[#FFFFFF] border-2 border-slate-100 rounded-3xl animate-pulse" />
          <div className="h-72 bg-[#FFFFFF] border-2 border-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <SectionHeader
        title="Dashboard"
        action={
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Stats</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Deal Value */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('deals')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Deal Value</p>
            <p className="text-2xl font-black text-[#0A2342]">₹{totalDealAmount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{deals.length} deals closed</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Commission Owed */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-amber-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('deals')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Owed</p>
            <p className="text-2xl font-black text-amber-700">₹{totalCommission.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Across all dealers</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <BadgeIndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Active Dealers */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-blue-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('dealers')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dealers</p>
            <p className="text-2xl font-black text-[#0A2342]">{approvedDealers.length}</p>
            <p className="text-[10px] text-amber-600 font-bold inline-flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {pendingDealers.length} pending
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-purple-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('inquiries')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inquiries</p>
            <p className="text-2xl font-black text-[#0A2342]">{inquiries.length}</p>
            <p className="text-[10px] text-purple-650 font-bold">
              {unassignedInquiries.length} unassigned leads
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Bell className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Stats Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Deal Value Trend */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-[#0A2342] uppercase text-sm">Monthly Deal Value Trend</h3>
              <p className="text-[10px] text-slate-400 font-bold">Closed deal volume (last 6 months)</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="h-[220px] w-full flex items-end pt-4 select-none">
            {monthlyData.map((d, index) => {
              const pct = (d.amount / maxAmount) * 75;
              const heightStr = `${Math.max(pct, 4)}%`;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group px-1 relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] font-bold px-1.5 py-1 rounded mb-1 shadow-sm absolute -translate-y-16 pointer-events-none z-10">
                    ₹{d.amount.toLocaleString('en-IN')} ({d.count} deals)
                  </div>
                  <div style={{ height: heightStr }} className="w-full max-w-[28px] bg-[#10B981] hover:bg-emerald-600 rounded-t-lg transition-all shadow-xs relative" />
                  <span className="text-[10px] text-slate-500 font-bold mt-2 truncate w-full text-center">
                    {d.monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Dealers */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#0A2342] uppercase text-sm">Top Dealers by Deal Value</h3>
                <p className="text-[10px] text-slate-400 font-bold">Ranked by closed deal volume</p>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>

            <div className="space-y-3">
              {dealerContributions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No dealer closures recorded yet.</p>
              ) : (
                dealerContributions.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                        {d.name}
                      </span>
                      <span className="text-emerald-700 font-mono font-black">₹{d.amount.toLocaleString('en-IN')} ({d.count} deals)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.max((d.amount / (dealerContributions[0]?.amount || 1)) * 100, 5)}%` }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dealers')}
            className="w-full mt-4 text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-[#0A2342] transition-colors border border-slate-200 flex items-center justify-center gap-1"
          >
            Manage All Dealers
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row - Action Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Dealer Signups */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#0A2342] uppercase text-sm">Pending Dealer Approvals</h3>
                <p className="text-[10px] text-slate-400 font-bold">New dealer registrations waiting for review</p>
              </div>
              {pendingDealers.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold font-mono">
                  {pendingDealers.length} Pending
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {pendingDealers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Check className="h-8 w-8 text-emerald-500 bg-emerald-50 rounded-full p-1.5" />
                  <p className="font-bold text-slate-700">All set!</p>
                  <p className="text-[10px] text-slate-400">No dealer applications pending review.</p>
                </div>
              ) : (
                pendingDealers.map(d => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0A2342] text-xs">{d.companyName}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{d.name} • {d.city || 'No Location'}</p>
                    </div>
                    <button onClick={() => setActiveTab('dealers')} className="px-3 py-1 bg-amber-500 text-white rounded-xl text-[10px] font-bold hover:bg-amber-600 transition-colors cursor-pointer">
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => setActiveTab('dealers')} className="w-full mt-4 text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-[#0A2342] transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer">
            Manage Dealers <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Unassigned inquiries */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#0A2342] uppercase text-sm">Unassigned Inquiries</h3>
                <p className="text-[10px] text-slate-400 font-bold">New customer messages waiting for dealer assignment</p>
              </div>
              {unassignedInquiries.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold font-mono">
                  {unassignedInquiries.length} New
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {unassignedInquiries.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Check className="h-8 w-8 text-emerald-500 bg-emerald-50 rounded-full p-1.5" />
                  <p className="font-bold text-slate-700">Pure efficiency!</p>
                  <p className="text-[10px] text-slate-400">All customer inquiries have been assigned.</p>
                </div>
              ) : (
                unassignedInquiries.map(inq => (
                  <div key={inq.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0A2342] text-xs">{inq.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold line-clamp-1 italic">"{inq.subject}"</p>
                    </div>
                    <button onClick={() => setActiveTab('inquiries')} className="px-3 py-1 bg-blue-500 text-white rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-colors cursor-pointer">
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <button onClick={() => setActiveTab('inquiries')} className="w-full mt-4 text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-[#0A2342] transition-colors border border-slate-200 flex items-center justify-center gap-1 cursor-pointer">
            Manage Inquiries <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DEAL CLOSURES TAB ──────────────────────────────────────────────────

function AdminDealClosuresTab() {
  const [deals, setDeals] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [settlingDealId, setSettlingDealId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState<'deals' | 'dealers' | 'customers'>('deals');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid_by_dealer' | 'closed'>('all');
  const [contactDeal, setContactDeal] = useState<any | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, dlRes, cRes] = await Promise.all([
        fetch('/api/deals', { headers }),
        fetch('/api/dealers', { headers }),
        fetch('/api/customers', { headers }),
      ]);
      if (dRes.ok) setDeals(await dRes.json());
      if (dlRes.ok) setDealers(await dlRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Admin action: Verify payment and officially mark deal closed
  const handleVerifyAndClose = async (dealId: string) => {
    setSettlingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ adminSettled: true, dealStatus: 'closed', paymentStatus: 'paid' }),
      });
      if (res.ok) {
        setSuccessMsg('✓ Payment verified! Deal marked as officially CLOSED.');
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      }
    } catch { /* silent */ }
    finally { setSettlingDealId(null); }
  };

  // Admin action: Flag payment as not received / revert to unpaid
  const handleMarkUnpaid = async (dealId: string) => {
    setSettlingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ paymentStatus: 'pending', adminSettled: false, dealStatus: 'pending_payment' }),
      });
      if (res.ok) {
        setSuccessMsg('Payment marked as UNPAID. Dealer has been notified.');
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      }
    } catch { /* silent */ }
    finally { setSettlingDealId(null); }
  };

  // Admin action: Manually mark deal as paid (received offline)
  const handleManualMarkPaid = async (dealId: string) => {
    setSettlingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });
      if (res.ok) {
        setSuccessMsg('Payment marked as PAID. Click "Verify & Close" to settle.');
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      }
    } catch { /* silent */ }
    finally { setSettlingDealId(null); }
  };

  // Admin action: Revert settlement
  const handleRevertSettlement = async (dealId: string) => {
    setSettlingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ adminSettled: false }),
      });
      if (res.ok) {
        setSuccessMsg('Settlement reverted.');
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      }
    } catch { /* silent */ }
    finally { setSettlingDealId(null); }
  };

  // ─── FINANCIAL CALCULATIONS ──────────────────────────────────────────────────
  // 1. Per Dealer Summary (Commission + Admin-Set Fixed Amount)
  const dealerSummaries = dealers.map(dl => {
    const dId = dl.id || dl._id;
    const dlDeals = deals.filter(d => d.dealerId === dId);
    const dlCustomers = customers.filter(c =>
      c.assignedDealerId === dId ||
      (c.assignedDealers || []).some((ad: any) => ad.id === dId)
    );

    const commRate = dl.commissionPercentage || 0;
    const fixedRate = dl.perCustomerAssignmentFee || 0;

    const totalDealAmount = dlDeals.reduce((s, d) => s + (d.closedAmount || 0), 0);
    const totalCommission = dlDeals.reduce((s, d) => s + (d.commissionAmount || 0), 0);
    const totalFixedAmount = dlDeals.length > 0
      ? dlDeals.reduce((s, d) => s + (d.fixedAmount ?? d.perCustomerAssignmentFee ?? fixedRate), 0)
      : (dlCustomers.length * fixedRate);
    const totalAdminDue = totalCommission + totalFixedAmount;

    const paidDeals = dlDeals.filter(d => d.paymentStatus === 'paid' || d.adminSettled);
    const totalPaid = paidDeals.reduce((s, d) => {
      const c = d.commissionAmount || 0;
      const f = d.fixedAmount ?? d.perCustomerAssignmentFee ?? fixedRate;
      return s + (d.totalAdminDue ?? (c + f));
    }, 0);
    const totalPending = Math.max(0, totalAdminDue - totalPaid);

    return {
      dealerId: dId,
      companyName: dl.companyName || dl.name || 'Dealer',
      phone: dl.phone || '',
      email: dl.email || '',
      city: dl.city || '',
      commRate,
      fixedRate,
      dealsCount: dlDeals.length,
      customersCount: dlCustomers.length,
      totalDealAmount,
      totalCommission,
      totalFixedAmount,
      totalAdminDue,
      totalPaid,
      totalPending,
      hasPending: totalPending > 0,
    };
  });

  // 2. Grand Totals across all closed deals
  const grandDealValue = deals.reduce((acc, d) => acc + (d.closedAmount || 0), 0);
  const grandCommission = deals.reduce((acc, d) => acc + (d.commissionAmount || 0), 0);
  const grandFixedAmount = deals.reduce((acc, d) => {
    const dl = dealers.find(x => x.id === d.dealerId || x._id === d.dealerId);
    return acc + (d.fixedAmount ?? d.perCustomerAssignmentFee ?? dl?.perCustomerAssignmentFee ?? 0);
  }, 0);
  const grandTotalRevenue = grandCommission + grandFixedAmount;

  const paidDealsList = deals.filter(d => d.paymentStatus === 'paid' || d.adminSettled);
  const grandPaid = paidDealsList.reduce((acc, d) => {
    const dl = dealers.find(x => x.id === d.dealerId || x._id === d.dealerId);
    const comm = d.commissionAmount || 0;
    const fixed = d.fixedAmount ?? d.perCustomerAssignmentFee ?? dl?.perCustomerAssignmentFee ?? 0;
    return acc + (d.totalAdminDue ?? (comm + fixed));
  }, 0);
  const grandPending = Math.max(0, grandTotalRevenue - grandPaid);

  // 3. Filtered Deals
  const filteredDeals = deals.filter(d => {
    // Status Filter
    if (statusFilter === 'unpaid' && (d.paymentStatus === 'paid' || d.adminSettled)) return false;
    if (statusFilter === 'paid_by_dealer' && (d.paymentStatus !== 'paid' || d.adminSettled)) return false;
    if (statusFilter === 'closed' && !d.adminSettled) return false;

    // Search Query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.dealerCompanyName?.toLowerCase().includes(q) ||
      d.customerName?.toLowerCase().includes(q) ||
      d.productTitle?.toLowerCase().includes(q) ||
      d.productType?.toLowerCase().includes(q) ||
      d.invoiceNumber?.toLowerCase().includes(q) ||
      d.customerPhone?.includes(q) ||
      d.dealerPhone?.includes(q)
    );
  });

  // 4. Per Customer Breakdown
  const customerBreakdowns = customers.map(c => {
    const cId = c.id || c._id;
    const cDeals = deals.filter(d => d.customerId === cId || (c.phone && d.customerPhone === c.phone));
    const dl = dealers.find(d => d.id === c.assignedDealerId || d._id === c.assignedDealerId);

    const dealValue = cDeals.reduce((s, d) => s + (d.closedAmount || 0), 0);
    const commAmount = cDeals.reduce((s, d) => s + (d.commissionAmount || 0), 0);
    const fixedAmount = cDeals.reduce((s, d) => s + (d.fixedAmount ?? d.perCustomerAssignmentFee ?? dl?.perCustomerAssignmentFee ?? 0), 0);
    const totalAdminShare = commAmount + fixedAmount;

    let dealStatusText = 'No Deal Closed';
    if (cDeals.length > 0) {
      if (cDeals.every(d => d.adminSettled)) dealStatusText = 'Closed & Verified';
      else if (cDeals.some(d => d.paymentStatus === 'paid')) dealStatusText = 'Paid by Dealer (Awaiting Admin)';
      else dealStatusText = 'Payment Pending';
    }

    return {
      customerId: cId,
      name: c.name || 'Customer',
      phone: c.phone || '',
      category: c.category || 'General',
      dealerName: dl?.companyName || c.assignedDealerName || (cDeals[0]?.dealerCompanyName) || 'Unassigned',
      dealerId: dl?.id || c.assignedDealerId,
      dealerPhone: dl?.phone || '',
      dealsCount: cDeals.length,
      dealValue,
      commAmount,
      fixedAmount,
      totalAdminShare,
      status: dealStatusText,
    };
  });

  return (
    <div>
      <SectionHeader
        title="Deal Closures & Commission Management"
        count={deals.length}
        action={
          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />{successMsg}
              </span>
            )}
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-slate-200">
              <RefreshCw className="h-3.5 w-3.5" />Refresh
            </button>
          </div>
        }
      />

      {/* ─── GRAND TOTALS METRIC CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Deal Value</p>
          <p className="text-lg font-black text-emerald-900 mt-1 font-mono">₹{grandDealValue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{deals.length} closed deals</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Deals Commission</p>
          <p className="text-lg font-black text-amber-900 mt-1 font-mono">₹{grandCommission.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Calculated separately</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Fixed Amount (Admin Set)</p>
          <p className="text-lg font-black text-purple-900 mt-1 font-mono">₹{grandFixedAmount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-purple-600 mt-0.5">Calculated separately</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Total Admin Share</p>
          <p className="text-lg font-black text-blue-900 mt-1 font-mono">₹{grandTotalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Comm + Fixed Amount</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid / Settled</p>
          <p className="text-lg font-black text-emerald-900 mt-1 font-mono">₹{grandPaid.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{paidDealsList.length} deals paid</p>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-2xs ${grandPending > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${grandPending > 0 ? 'text-red-700' : 'text-slate-500'}`}>Pending Payment</p>
          <p className={`text-lg font-black mt-1 font-mono ${grandPending > 0 ? 'text-red-800' : 'text-slate-500'}`}>₹{grandPending.toLocaleString('en-IN')}</p>
          <p className={`text-[10px] mt-0.5 ${grandPending > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
            {grandPending > 0 ? '⚠ Contact dealers' : 'All clear ✓'}
          </p>
        </div>
      </div>

      {/* ─── SUB-NAVIGATION VIEW MODES ─── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('deals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'deals' ? 'bg-[#0A2342] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Closed Deals & Verification ({deals.length})
          </button>
          <button
            onClick={() => setViewMode('dealers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'dealers' ? 'bg-[#0A2342] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            By Dealer Breakdown ({dealers.length})
          </button>
          <button
            onClick={() => setViewMode('customers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'customers' ? 'bg-[#0A2342] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            By Customer Breakdown ({customers.length})
          </button>
        </div>

        {viewMode === 'deals' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-bold">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'paid_by_dealer', label: '⚡ Awaiting Verification' },
              { id: 'unpaid', label: '⚠ Unpaid' },
              { id: 'closed', label: '✓ Closed' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => { setStatusFilter(f.id as any); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === f.id ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 font-medium"
          placeholder="Search by dealer, customer, product title, invoice number, or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* ─── VIEW 1: CLOSED DEALS & VERIFICATION ─── */}
      {viewMode === 'deals' && (
        <>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <Handshake className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No matching deals found.</p>
              <p className="text-xs mt-1">Try adjusting your search query or status filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeals.slice((page - 1) * 10, page * 10).map(deal => {
                const dl = dealers.find(x => x.id === deal.dealerId || x._id === deal.dealerId);
                const dealComm = deal.commissionAmount || 0;
                const dealFixed = deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? dl?.perCustomerAssignmentFee ?? 0;
                const dealTotalDue = deal.totalAdminDue ?? (dealComm + dealFixed);
                const isPaid = deal.paymentStatus === 'paid';
                const isSettled = Boolean(deal.adminSettled);

                return (
                  <div key={deal.id} className={`bg-white border-2 rounded-2xl p-5 hover:shadow-sm transition-all space-y-3 ${isSettled ? 'border-emerald-200' : isPaid ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-grow">
                        {/* Dealer -> Customer header */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-black text-[#0A2342] text-xs bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-500" />
                            {deal.dealerCompanyName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">→</span>
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <Users className="h-3 w-3 text-slate-500" />
                            {deal.customerName}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase border border-blue-100">
                            {deal.productType || deal.productCategory || 'General'}
                          </span>
                          {deal.invoiceNumber && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200 font-mono">
                              Inv #{deal.invoiceNumber}
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-emerald-600 shrink-0" />
                          <h4 className="font-black text-sm text-[#0A2342]">
                            {deal.productTitle || deal.productCategory || 'Power System'}
                          </h4>
                        </div>

                        {/* 4 Financial Items (Customer deal value, Commission separately, Fixed amount separately, Total Admin Share) */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium mt-2">
                          <span className="font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                            Customer Value: ₹{deal.closedAmount?.toLocaleString('en-IN')}
                          </span>
                          <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono">
                            Commission ({deal.commissionPercentage}%): ₹{dealComm.toLocaleString('en-IN')}
                          </span>
                          <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-mono">
                            Fixed Amount (Admin Set): ₹{dealFixed.toLocaleString('en-IN')}
                          </span>
                          <span className="font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                            Total Admin Share: ₹{dealTotalDue.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Payment State Badges */}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Deal Closed & Payment Verified
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full border border-blue-300 animate-pulse">
                              <BadgeIndianRupee className="h-3.5 w-3.5 text-blue-600" /> Dealer Marked as PAID — Awaiting Admin Check
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-black rounded-full border border-red-200">
                              ⚠ Commission & Fixed Amount Pending from Dealer
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {(deal.description || deal.notes) && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[9px] block">Description / Scope</span>
                              <p>{deal.description || deal.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Invoice document */}
                        {deal.invoiceUrl && (
                          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 mt-2 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-2xs shrink-0">
                                {deal.invoiceName?.split('.').pop()?.slice(0, 4) || 'DOC'}
                              </div>
                              <span className="text-xs font-bold text-[#0A2342] truncate max-w-[200px] sm:max-w-xs">
                                {deal.invoiceName || 'Invoice Document'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a href={`${deal.invoiceUrl}?view=1`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors">
                                <Eye className="h-3 w-3" /> View
                              </a>
                              <a href={`${deal.invoiceUrl}?download=1`} download={deal.invoiceName || 'invoice'} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors">
                                <Download className="h-3 w-3" /> Download
                              </a>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 mt-2">
                          Closed: {new Date(deal.closedAt || deal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {deal.paidAt && <span className="ml-2 text-blue-600 font-medium">| Marked Paid: {new Date(deal.paidAt).toLocaleDateString('en-IN')}</span>}
                          {deal.settledAt && <span className="ml-2 text-emerald-600 font-bold">| Closed by Admin: {new Date(deal.settledAt).toLocaleDateString('en-IN')}</span>}
                        </p>
                      </div>

                      {/* ─── ACTION BUTTONS FOR ADMIN ─── */}
                      <div className="flex flex-col items-end gap-2 text-right shrink-0">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Admin Due</span>
                          <p className="text-xl font-black text-blue-900 font-mono">₹{dealTotalDue.toLocaleString('en-IN')}</p>
                          <span className="text-[10px] text-slate-500 font-medium">Comm ₹{dealComm} + Fixed ₹{dealFixed}</span>
                        </div>

                        {/* CASE 1: Dealer marked as PAID → Admin checks and closes deal */}
                        {!isSettled && isPaid && (
                          <div className="flex flex-col items-end gap-1.5 mt-1">
                            <button
                              onClick={() => handleVerifyAndClose(deal.id)}
                              disabled={settlingDealId === deal.id}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                              title="Confirm payment receipt and mark deal officially closed"
                            >
                              {settlingDealId === deal.id ? (
                                <><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
                              ) : (
                                <><CheckCircle2 className="h-4 w-4" />Verify & Mark Deal Closed</>
                              )}
                            </button>
                            <button
                              onClick={() => handleMarkUnpaid(deal.id)}
                              disabled={settlingDealId === deal.id}
                              className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Payment was not received from dealer"
                            >
                              Payment Not Received
                            </button>
                          </div>
                        )}

                        {/* CASE 2: Dealer has NOT paid → Admin contacts dealer or manually marks paid */}
                        {!isSettled && !isPaid && (
                          <div className="flex flex-col items-end gap-1.5 mt-1">
                            <button
                              onClick={() => setContactDeal(deal)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Contact dealer regarding pending payment"
                            >
                              <Phone className="h-3.5 w-3.5" /> Contact Dealer
                            </button>
                            <button
                              onClick={() => handleManualMarkPaid(deal.id)}
                              disabled={settlingDealId === deal.id}
                              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                              title="Mark as paid if received via direct transfer"
                            >
                              Mark as Paid
                            </button>
                          </div>
                        )}

                        {/* CASE 3: Deal is settled/closed → Admin can revert if necessary */}
                        {isSettled && (
                          <button
                            onClick={() => handleRevertSettlement(deal.id)}
                            disabled={settlingDealId === deal.id}
                            className="px-2 py-1 text-[10px] text-slate-400 hover:text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Revert Settlement
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <Pagination currentPage={page} totalItems={filteredDeals.length} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* ─── VIEW 2: BY DEALER FINANCIAL BREAKDOWN ─── */}
      {viewMode === 'dealers' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Financial Summary by Dealer (Fixed Amount & Commission Calculated Separately)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calculated based on Admin-set fixed rates and commission rates for each dealer
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-650">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200 font-black">
                  <tr>
                    <th className="px-4 py-3">Dealer</th>
                    <th className="px-4 py-3 text-center">Admin Set Rates</th>
                    <th className="px-4 py-3 text-center">Deals / Leads</th>
                    <th className="px-4 py-3 text-right">Deal Volume</th>
                    <th className="px-4 py-3 text-right">Commission (Sep.)</th>
                    <th className="px-4 py-3 text-right">Fixed Amount (Sep.)</th>
                    <th className="px-4 py-3 text-right">Total Admin Due</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealerSummaries.map(s => (
                    <tr key={s.dealerId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#0A2342] text-xs">{s.companyName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.phone} {s.city ? `• ${s.city}` : ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          {s.commRate}% Comm
                        </span>
                        <span className="inline-block ml-1 bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                          ₹{s.fixedRate} Fixed
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-700">{s.dealsCount} deals</span>
                        <span className="text-[10px] text-slate-400 block">{s.customersCount} leads</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        ₹{s.totalDealAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                        ₹{s.totalCommission.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-purple-700">
                        ₹{s.totalFixedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-blue-900">
                        ₹{s.totalAdminDue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        ₹{s.totalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-red-700">
                        ₹{s.totalPending.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.hasPending ? (
                          <span className="inline-block px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-bold border border-red-200">
                            ⚠ Pending
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                            ✓ All Paid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.hasPending && s.phone ? (
                          <a
                            href={`https://wa.me/91${s.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${s.companyName}, the pending payment of ₹${s.totalPending.toLocaleString('en-IN')} (Commission + Fixed Amount) is due for closed deals with Voltrix Power Systems. Kindly arrange payment.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" /> WhatsApp
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Grand Total Summary Row */}
                <tfoot className="bg-slate-100/80 font-black border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td className="px-4 py-3 uppercase tracking-wider text-slate-700" colSpan={3}>
                      TOTALS (All {dealers.length} Dealers)
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">
                      ₹{grandDealValue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-800">
                      ₹{grandCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-purple-800">
                      ₹{grandFixedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-900 text-sm">
                      ₹{grandTotalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-800">
                      ₹{grandPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-800">
                      ₹{grandPending.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center" colSpan={2}>
                      <span className="text-[10px] font-bold text-slate-500">Summary</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 3: BY CUSTOMER BREAKDOWN ─── */}
      {viewMode === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Commission & Fixed Amount Breakdown by Customer
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Shows each customer, assigned dealer, closed deal amount, and admin revenue components
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-650">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200 font-black">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Assigned Dealer</th>
                    <th className="px-4 py-3 text-right">Deal Value</th>
                    <th className="px-4 py-3 text-right">Commission (Sep.)</th>
                    <th className="px-4 py-3 text-right">Fixed Amount (Sep.)</th>
                    <th className="px-4 py-3 text-right">Total Admin Share</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerBreakdowns.map(c => (
                    <tr key={c.customerId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#0A2342] text-xs">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 text-xs">{c.dealerName}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        {c.dealValue > 0 ? `₹${c.dealValue.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                        {c.commAmount > 0 ? `₹${c.commAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-purple-700">
                        {c.fixedAmount > 0 ? `₹${c.fixedAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-blue-900">
                        {c.totalAdminShare > 0 ? `₹${c.totalAdminShare.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.status === 'Closed & Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.status.includes('Paid by Dealer') ? 'bg-blue-50 text-blue-700 border-blue-200' : c.status.includes('Pending') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTACT DEALER MODAL ─── */}
      {contactDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-[#0A2342] text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" /> Contact Dealer Regarding Payment
              </h3>
              <button onClick={() => setContactDeal(null)} className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-xs font-black text-[#0A2342]">{contactDeal.dealerCompanyName}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium pt-1">
                <span>Phone: <strong className="text-slate-900 font-mono">{contactDeal.dealerPhone || '—'}</strong></span>
                <span>Customer: <strong className="text-slate-900">{contactDeal.customerName}</strong></span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-xs">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Pending Payment Breakdown</p>
                <div className="flex justify-between font-mono font-bold text-slate-800 mt-1">
                  <span>Commission: ₹{contactDeal.commissionAmount?.toLocaleString('en-IN') || 0}</span>
                  <span>Fixed Amount: ₹{(contactDeal.fixedAmount ?? contactDeal.perCustomerAssignmentFee ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-mono font-black text-blue-900 text-sm mt-1 pt-1 border-t border-slate-200">
                  <span>Total Due to Admin:</span>
                  <span>₹{(contactDeal.totalAdminDue ?? ((contactDeal.commissionAmount || 0) + (contactDeal.fixedAmount ?? contactDeal.perCustomerAssignmentFee ?? 0))).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="space-y-2">
              {contactDeal.dealerPhone && (
                <>
                  <a
                    href={`https://wa.me/91${contactDeal.dealerPhone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${contactDeal.dealerCompanyName}, the payment of ₹${(contactDeal.totalAdminDue ?? ((contactDeal.commissionAmount || 0) + (contactDeal.fixedAmount ?? contactDeal.perCustomerAssignmentFee ?? 0))).toLocaleString('en-IN')} (Commission ₹${contactDeal.commissionAmount || 0} + Fixed Amount ₹${contactDeal.fixedAmount ?? contactDeal.perCustomerAssignmentFee ?? 0}) for deal with ${contactDeal.customerName} is pending. Please make the payment so we can verify and officially close the deal. Thank you, Voltrix Admin.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" /> Send WhatsApp Message
                  </a>
                  <a
                    href={`tel:${contactDeal.dealerPhone}`}
                    className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200 transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Call Dealer ({contactDeal.dealerPhone})
                  </a>
                </>
              )}
              {contactDeal.dealerEmail && (
                <a
                  href={`mailto:${contactDeal.dealerEmail}?subject=${encodeURIComponent(`Pending Payment for Closed Deal #${contactDeal.id.slice(-6).toUpperCase()}`)}&body=${encodeURIComponent(`Hello ${contactDeal.dealerCompanyName},\n\nPlease arrange payment of ₹${(contactDeal.totalAdminDue ?? ((contactDeal.commissionAmount || 0) + (contactDeal.fixedAmount ?? contactDeal.perCustomerAssignmentFee ?? 0))).toLocaleString('en-IN')} for the closed deal with customer ${contactDeal.customerName}.\n\nVoltrix Admin`)}`}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setContactDeal(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = contactDeal.id;
                  setContactDeal(null);
                  handleManualMarkPaid(id);
                }}
                className="flex-1 py-2 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl"
              >
                Mark as Paid Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'inquiries', label: 'Inquiries', icon: Bell },
  { id: 'dealers', label: 'Dealers', icon: Building2 },
  { id: 'deals', label: 'Deal Closures', icon: Handshake },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
];

export default function AdminPanel({ adminSession, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dealers, setDealers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
    return { Authorization: token ? `Bearer ${token}` : '' };
  };

  const loadDealers = useCallback(async () => {
    try {
      const res = await fetch('/api/dealers', { headers: getHeaders() });
      if (res.ok) setDealers(await res.json());
    } catch { }
  }, []);

  const loadInquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/inquiries', { headers: getHeaders() });
      if (res.ok) setInquiries(await res.json());
    } catch { }
  }, []);

  useEffect(() => { 
    loadDealers(); 
    loadInquiries();
  }, [loadDealers, loadInquiries]);

  const pendingDealers = dealers.filter(d => d.status === 'pending').length;
  const newInquiries = inquiries.filter(i => i.status === 'new').length;

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Top bar */}
      <header className={`flex items-center justify-between px-6 py-4 bg-[#0A2342] border-b border-white/10 shrink-0 gap-4 ${activeTab === 'ai' ? 'hidden md:flex' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm uppercase tracking-tight leading-none">VOLTRIX Admin</p>
            <p className="text-slate-400 text-xs font-medium">{adminSession?.name || 'Operations Head'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingDealers > 0 && (
            <button onClick={() => setActiveTab('dealers')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" />
              {pendingDealers} Pending Dealer{pendingDealers > 1 ? 's' : ''}
            </button>
          )}
          {newInquiries > 0 && (
            <button onClick={() => setActiveTab('inquiries')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-colors">
              <Bell className="h-3.5 w-3.5" />
              {newInquiries} New Inquir{newInquiries > 1 ? 'ies' : 'y'}
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors">
            <LogOut className="h-4 w-4" />Logout
          </button>
        </div>
      </header>

      <div className="flex flex-grow min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-56 bg-white border-r border-slate-200 flex-col py-4 gap-1 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.id === 'dealers' && pendingDealers > 0 
              ? pendingDealers 
              : tab.id === 'inquiries' && newInquiries > 0 
                ? newInquiries 
                : 0;
            const badgeBg = tab.id === 'inquiries' ? 'bg-blue-600' : 'bg-amber-500';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-bold transition-all text-left relative ${activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1 rounded-full ${badgeBg} text-white text-[10px] font-black flex items-center justify-center`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className={`flex-grow min-h-0 relative ${activeTab === 'ai' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-4 md:p-6 pb-20 md:pb-6'}`}>
          {activeTab === 'dashboard' && <DashboardTab dealers={dealers} onDealersChange={loadDealers} setActiveTab={setActiveTab} />}
          {activeTab === 'customers' && <CustomersTab dealers={dealers} />}
          {activeTab === 'inquiries' && <InquiriesTab dealers={dealers} onInquiriesChange={loadInquiries} />}
          {activeTab === 'dealers' && <DealersTab dealers={dealers} onDealersChange={loadDealers} />}
          {activeTab === 'deals' && <AdminDealClosuresTab />}
          { activeTab === 'products' && <ProductsTab /> }
          { activeTab === 'settings' && <CompanySettingsTab /> }
          { activeTab === 'ai' && <DealerAiAssistant dealerSession={adminSession} /> }
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-end justify-around pb-3 pt-2 px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.id === 'dealers' && pendingDealers > 0 
              ? pendingDealers 
              : tab.id === 'inquiries' && newInquiries > 0 
                ? newInquiries 
                : 0;
            const badgeBg = tab.id === 'inquiries' ? 'bg-blue-600' : 'bg-amber-500';
            const isActive = activeTab === tab.id;

            if (tab.id === 'ai') {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center justify-center flex-1 transition-all outline-none"
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center
    border transition-all duration-300 transform
    ${isActive
                        ? "bg-gradient-to-br from-[#4285F4] via-[#7B61FF] to-[#EA4335] border-black scale-110 shadow-[0_0_20px_rgba(123,97,255,0.45)]"
                        : "bg-gradient-to-br from-[#4285F4] via-[#7B61FF] to-[#EA4335] border-black scale-100 hover:scale-105 shadow-[0_0_12px_rgba(123,97,255,0.25)]"
                      }`}
                  >
                    <Icon
                      className={`h-6 w-6 transition-all duration-300 ${isActive
                        ? "text-white scale-110"
                        : "text-white/95"
                        }`}
                    />
                  </div>

                  <span className={`text-[8px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500'
                    }`}>{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all ${isActive ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {badge > 0 && (
                    <span className={`absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full ${badgeBg} text-white text-[9px] font-black flex items-center justify-center border border-white`}>
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
