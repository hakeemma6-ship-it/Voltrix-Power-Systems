'use client';
/**
 * DealerPortal — Clean tabbed dealer panel.
 *
 * Tabs:
 *  1. Dashboard   — Stats overview: customers, deals, commission
 *  2. My Customers — Assigned customers with full lifecycle
 *  3. Deal Closures — Record closed deals & track commission
 *  4. AI Assistant — AI helper
 *  5. Profile — Edit dealer profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, User, LogOut, Plus, Search,
  Zap, X, Phone, Mail, ClipboardList,
  CheckCircle2, Building2, ArrowRight, Sparkles,
  LayoutDashboard, TrendingUp, DollarSign, Activity, ArrowUpRight,
  RefreshCw, Check, IndianRupee, BadgeIndianRupee, Handshake,
  Upload, Download, Eye, FileText, Hash, Calendar
} from 'lucide-react';
import CustomerDetailModal from './CustomerDetailModal';
import DealerAiAssistant from './DealerAiAssistant';
import { matchesCustomerSearch, formatPurchaseDate } from '@/utils/customerSearch';

interface Props {
  dealerSession: any;
  onLoginSuccess: (dealer: any) => void;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'customers' | 'deals' | 'profile' | 'ai';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_discussion: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
};

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
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button key={page} onClick={() => onPageChange(page)} className={`h-8 min-w-8 px-2 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-emerald-500 text-white shadow-sm' : 'border-2 border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{page}</button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
      </div>
    </div>
  );
}

// ─── DEALER DASHBOARD TAB ─────────────────────────────────────────────────────────

function DealerDashboardTab({
  dealerSession,
  setActiveTab,
}: {
  dealerSession: any;
  setActiveTab: (tab: Tab) => void;
}) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { Authorization: token ? `Bearer ${token}` : '' };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dealerId = dealerSession?.dealerId || dealerSession?.id;
      const [cRes, dRes] = await Promise.all([
        fetch('/api/customers', { headers }),
        fetch(`/api/deals?dealerId=${dealerId}`, { headers }),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (dRes.ok) setDeals(await dRes.json());
    } catch { }
    finally { setLoading(false); }
  }, [dealerSession]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalClosedAmount = deals.reduce((acc, d) => acc + (d.closedAmount || 0), 0);
  const totalCommission = deals.reduce((acc, d) => acc + (d.commissionAmount || 0), 0);
  const completedCustomers = customers.filter(c => c.status === 'completed').length;
  const activeCustomers = customers.filter(c => c.status !== 'completed').length;

  // Monthly deals trend (last 6 months)
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({ monthName: months[d.getMonth()], year: d.getFullYear(), monthNum: d.getMonth(), amount: 0, count: 0 });
    }
    deals.forEach(deal => {
      if (!deal.closedAt) return;
      const dDate = new Date(deal.closedAt);
      if (isNaN(dDate.getTime())) return;
      const idx = last6.findIndex(m => m.monthNum === dDate.getMonth() && m.year === dDate.getFullYear());
      if (idx !== -1) { last6[idx].amount += (deal.closedAmount || 0); last6[idx].count += 1; }
    });
    return last6;
  })();
  const maxAmount = Math.max(...monthlyData.map(m => m.amount), 10000);

  const hotLeads = customers.filter(c => ['new', 'assigned'].includes(c.status)).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border-2 border-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <SectionHeader title="Dashboard Overview" action={
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <RefreshCw className="h-3 w-3" /><span>Refresh</span>
        </button>
      } />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Deal Value</p>
            <p className="text-2xl font-black text-[#0A2342]">₹{totalClosedAmount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{deals.length} deal{deals.length !== 1 ? 's' : ''} closed</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-blue-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('customers')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Customers</p>
            <p className="text-2xl font-black text-[#0A2342]">{customers.length}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{activeCustomers} active · {completedCustomers} closed</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-amber-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('deals')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Commission</p>
            <p className="text-2xl font-black text-[#0A2342]">₹{totalCommission.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{dealerSession?.commissionPercentage || 0}% commission rate</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <BadgeIndianRupee className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-purple-200 transition-all shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('profile')}>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Status</p>
            <p className="text-lg font-black text-[#0A2342] uppercase">{dealerSession?.status || 'Active'}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Update profile & docs</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Deal Volume Bar Chart */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-[#0A2342] uppercase text-sm">Monthly Deal Volume</h3>
              <p className="text-[10px] text-slate-400 font-bold">Your closed deal trend (last 6 months)</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="h-[200px] w-full flex items-end pt-4 select-none">
            {monthlyData.map((d, index) => {
              const pct = (d.amount / maxAmount) * 75;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group px-1 relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] font-bold px-1.5 py-1 rounded mb-1 shadow-sm absolute -translate-y-16 pointer-events-none z-10 whitespace-nowrap">
                    ₹{d.amount.toLocaleString('en-IN')} ({d.count})
                  </div>
                  <div style={{ height: `${Math.max(pct, 4)}%` }} className="w-full max-w-[28px] bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all shadow-xs" />
                  <span className="text-[10px] text-slate-500 font-bold mt-2 truncate w-full text-center">{d.monthName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#0A2342] uppercase text-sm">Hot Leads</h3>
                <p className="text-[10px] text-slate-400 font-bold">Assigned customers awaiting contact</p>
              </div>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {hotLeads.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  All assigned customers are in discussion or completed.
                </div>
              ) : hotLeads.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-150 group hover:border-[#10B981] transition-all">
                  <div>
                    <p className="font-bold text-xs text-slate-800">{l.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{l.phone} • {l.category || 'General interest'}</p>
                  </div>
                  <button onClick={() => setActiveTab('customers')} className="px-3 py-1 bg-white border border-slate-200 group-hover:bg-[#10B981] group-hover:text-white group-hover:border-transparent transition-colors text-[10px] font-bold text-slate-700 rounded-xl flex items-center gap-1 shadow-xs">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('customers')} className="w-full mt-4 text-center py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-[#0A2342] transition-colors border border-slate-200 flex items-center justify-center gap-1">
            Browse My Customers <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MY CUSTOMERS TAB ─────────────────────────────────────────────────────────────

function MyCustomersTab({ dealerSession }: { dealerSession: any }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { Authorization: token ? `Bearer ${token}` : '' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers', { headers });
      if (res.ok) setCustomers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c => matchesCustomerSearch(c, search));

  return (
    <div>
      <SectionHeader title="My Customers" count={customers.length} />
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
              <div key={c.id} onClick={() => setSelectedCustomer(c)} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-grow min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-[#0A2342] text-sm group-hover:text-emerald-700 transition-colors">{c.name}</p>
                        <Badge status={c.status} />
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 font-medium">
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

                      {c.notes && <p className="text-xs text-slate-400 mt-2 italic line-clamp-2">{c.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span>View</span><ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}

      {selectedCustomer && (
        <CustomerDetailModal customer={selectedCustomer} userRole="dealer" session={dealerSession} onClose={() => setSelectedCustomer(null)} onUpdate={load} />
      )}
    </div>
  );
}

// ─── DEAL CLOSURES TAB ────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  'UPS Systems',
  'Servo Stabilizers',
  'Solar Inverters',
  'Battery Systems',
  'Online UPS',
  'Hybrid Solar',
  'Industrial Stabilizers',
  'Other'
];

function DealClosuresTab({ dealerSession }: { dealerSession: any }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [page, setPage] = useState(1);
  const [payingDealId, setPayingDealId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerId: '',
    closedAmount: '',
    productTitle: '',
    productType: 'UPS Systems',
    description: '',
    invoiceNumber: '',
  });

  const [invoiceFile, setInvoiceFile] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { Authorization: token ? `Bearer ${token}` : '' };
  const dealerId = dealerSession?.dealerId || dealerSession?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`/api/deals?dealerId=${dealerId}`, { headers }),
        fetch('/api/customers', { headers }),
      ]);
      if (dRes.ok) setDeals(await dRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
    } finally { setLoading(false); }
  }, [dealerId]);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErr('File size exceeds 15MB. Please choose a smaller document.');
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
      setErr('');
    };
    reader.onerror = () => {
      setErr('Failed to read document. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const removeInvoiceFile = () => {
    setInvoiceFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!form.customerId || !form.closedAmount) { setErr('Customer and closed amount are required.'); return; }
    if (!form.productTitle.trim()) { setErr('Product title is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          dealerId,
          customerId: form.customerId,
          closedAmount: parseFloat(form.closedAmount),
          productTitle: form.productTitle.trim(),
          productType: form.productType,
          description: form.description.trim(),
          invoiceNumber: form.invoiceNumber.trim(),
          invoiceUrl: invoiceFile?.dataUrl || '',
          invoiceName: invoiceFile?.name || '',
          invoiceType: invoiceFile?.type || '',
          invoiceSize: invoiceFile?.size || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        setForm({ customerId: '', closedAmount: '', productTitle: '', productType: 'UPS Systems', description: '', invoiceNumber: '' });
        setInvoiceFile(null);
        setSuccessMsg(`Deal recorded! Commission: ₹${data.commissionAmount?.toLocaleString('en-IN') || 0}`);
        setTimeout(() => setSuccessMsg(''), 5000);
        load();
      } else {
        const d = await res.json();
        setErr(d.error || 'Failed to record deal.');
      }
    } catch { setErr('Connection failed.'); }
    finally { setSaving(false); }
  };

  const commissionRate = dealerSession?.commissionPercentage || 0;
  const perCustomerFee = dealerSession?.perCustomerAssignmentFee || 0;
  const totalClosedAmount = deals.reduce((acc, d) => acc + (d.closedAmount || 0), 0);
  const totalCommission = deals.reduce((acc, d) => acc + (d.commissionAmount || 0), 0);
  const totalFixedAmount = deals.reduce((acc, d) => acc + (d.fixedAmount ?? d.perCustomerAssignmentFee ?? perCustomerFee), 0);
  const totalAdminDue = deals.reduce((acc, d) => {
    const comm = d.commissionAmount || 0;
    const fixed = d.fixedAmount ?? d.perCustomerAssignmentFee ?? perCustomerFee;
    return acc + (d.totalAdminDue ?? (comm + fixed));
  }, 0);

  const paidDeals = deals.filter(d => d.paymentStatus === 'paid' || d.adminSettled);
  const totalPaid = paidDeals.reduce((acc, d) => {
    const comm = d.commissionAmount || 0;
    const fixed = d.fixedAmount ?? d.perCustomerAssignmentFee ?? perCustomerFee;
    return acc + (d.totalAdminDue ?? (comm + fixed));
  }, 0);
  const totalPending = totalAdminDue - totalPaid;

  const handleMarkPaid = async (dealId: string) => {
    setPayingDealId(dealId);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });
      if (res.ok) {
        setSuccessMsg('✓ Payment marked as PAID! Admin will verify payment and close the deal.');
        setTimeout(() => setSuccessMsg(''), 6000);
        load();
      }
    } catch { /* silent */ }
    finally { setPayingDealId(null); }
  };

  const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium";

  return (
    <div>
      <SectionHeader
        title="Deal Closures & Commission"
        count={deals.length}
        action={
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">
            <Plus className="h-4 w-4" />Record Deal
          </button>
        }
      />

      {/* Financial Summary Banner: Deal Value, Commission, Fixed Amount & Admin Due */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Deal Value</p>
          <p className="text-lg font-black text-emerald-800 mt-1 font-mono">₹{totalClosedAmount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{deals.length} closed deals</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Commission ({commissionRate}%)</p>
          <p className="text-lg font-black text-amber-800 mt-1 font-mono">₹{totalCommission.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">from sales value</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Fixed Amount (Admin Set)</p>
          <p className="text-lg font-black text-purple-800 mt-1 font-mono">₹{totalFixedAmount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-purple-600 mt-0.5">₹{perCustomerFee}/deal</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Total Due to Admin</p>
          <p className="text-lg font-black text-blue-900 mt-1 font-mono">₹{totalAdminDue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Comm + Fixed Amt</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid to Admin</p>
          <p className="text-lg font-black text-emerald-900 mt-1 font-mono">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{paidDeals.length} settled/paid</p>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-2xs ${totalPending > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${totalPending > 0 ? 'text-red-700' : 'text-slate-500'}`}>Pending Payment</p>
          <p className={`text-lg font-black mt-1 font-mono ${totalPending > 0 ? 'text-red-800' : 'text-slate-500'}`}>₹{totalPending.toLocaleString('en-IN')}</p>
          <p className={`text-[10px] mt-0.5 ${totalPending > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{totalPending > 0 ? '⚠ Pay admin now' : 'All clear ✓'}</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />{successMsg}
        </div>
      )}

      {/* Record Deal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-[#0A2342] uppercase text-base flex items-center gap-2">
                <Handshake className="h-5 w-5 text-emerald-600" /> Record Closed Deal
              </h3>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Customer *</label>
                <select className={inputCls} value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                  <option value="">Select assigned customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Deal Value (₹) *</label>
                  <input type="number" min={1} step="any" className={inputCls} placeholder="e.g. 75000" value={form.closedAmount} onChange={e => setForm(f => ({ ...f, closedAmount: e.target.value }))} required />
                  {commissionRate > 0 && form.closedAmount && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1">
                      → Commission ({commissionRate}%): ₹{((parseFloat(form.closedAmount) * commissionRate) / 100).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Product Type *</label>
                  <select className={inputCls} value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))} required>
                    {PRODUCT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Title of Product *</label>
                <input className={inputCls} placeholder="e.g. Voltrix 10kVA Online UPS (3-Phase)" value={form.productTitle} onChange={e => setForm(f => ({ ...f, productTitle: e.target.value }))} required />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-emerald-600" />
                    Invoice Number
                  </span>
                  <span className="text-slate-400 font-normal text-[9px]">Optional · Tax Invoice No.</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">#</span>
                  <input className={`${inputCls} pl-8 font-mono`} placeholder="e.g. INV-2026-0042 or VTX/26/108" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Description (optional)</label>
                <textarea className={`${inputCls} h-20 resize-none`} placeholder="Deal scope, warranties, battery specifications..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Invoice Document Upload */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    Invoice Document (PDF, JPG, PNG, DOC, etc.)
                  </span>
                  <span className="text-slate-400 font-normal text-[9px]">Optional</span>
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
                        PDF, JPG, PNG, DOC, DOCX, or any file up to 15MB
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
                        <p className="text-xs font-bold text-[#0A2342] truncate max-w-[200px] sm:max-w-xs">{invoiceFile.name}</p>
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

              {err && <p className="text-red-600 text-xs font-semibold">{err}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 shadow-sm cursor-pointer">
                  {saving ? 'Recording...' : 'Record Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">No deals recorded yet.</p>
          <p className="text-xs mt-1">Record a closed deal to track your commission earnings.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {deals.slice((page - 1) * 10, page * 10).map(deal => (
              <div key={deal.id} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-black text-[#0A2342] text-sm">{deal.customerName || 'Customer'}</p>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full uppercase border border-blue-100">
                        {deal.productType || deal.productCategory || 'General'}
                      </span>
                      {deal.invoiceNumber && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                          Inv #{deal.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-xs">
                        {deal.productTitle || deal.productCategory || 'Closed Deal'}
                      </span>
                    </div>

                    {(() => {
                      const dealComm = deal.commissionAmount || 0;
                      const dealFixed = deal.fixedAmount ?? deal.perCustomerAssignmentFee ?? perCustomerFee;
                      const dealTotalDue = deal.totalAdminDue ?? (dealComm + dealFixed);
                      return (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
                          {deal.customerPhone && <span className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" />{deal.customerPhone}</span>}
                          <span className="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md">Deal: ₹{deal.closedAmount?.toLocaleString('en-IN')}</span>
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Commission ({deal.commissionPercentage}%): ₹{dealComm.toLocaleString('en-IN')}</span>
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">Fixed Amount: ₹{dealFixed.toLocaleString('en-IN')}</span>
                          <span className="font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">Total to Admin: ₹{dealTotalDue.toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })()}

                    {(deal.description || deal.notes) && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 mt-2 italic">
                        {deal.description || deal.notes}
                      </p>
                    )}

                    {/* Invoice Document Box */}
                    {deal.invoiceUrl && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 mt-2 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-2xs shrink-0">
                            {deal.invoiceName?.split('.').pop()?.slice(0, 4) || 'DOC'}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Invoice Attached
                            </span>
                            <p className="text-xs font-bold text-[#0A2342] truncate max-w-[200px] sm:max-w-xs mt-0.5">
                              {deal.invoiceName || 'Invoice Document'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`${deal.invoiceUrl}?view=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
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

                    <p className="text-[10px] text-slate-400 mt-1">
                      Closed: {new Date(deal.closedAt || deal.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {deal.paidAt && <span className="ml-2 text-blue-600 font-medium">| Marked Paid: {new Date(deal.paidAt).toLocaleDateString('en-IN')}</span>}
                      {deal.settledAt && <span className="ml-2 text-emerald-600 font-bold">| Admin Verified & Closed: {new Date(deal.settledAt).toLocaleDateString('en-IN')}</span>}
                    </p>
                  </div>
                  {/* Payment Status & Action */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {deal.adminSettled ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-xl border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Deal Closed & Verified by Admin
                      </span>
                    ) : deal.paymentStatus === 'paid' ? (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-black rounded-xl border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                        <Check className="h-4 w-4 text-blue-600" /> Payment Sent — Awaiting Admin Verification
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => handleMarkPaid(deal.id)}
                          disabled={payingDealId === deal.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white text-xs font-black rounded-xl border border-emerald-500 flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                          {payingDealId === deal.id ? (
                            <><span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Recording Payment...</>
                          ) : (
                            <><CheckCircle2 className="h-4 w-4" />PAID — Mark as Paid</>
                          )}
                        </button>
                        <p className="text-[10px] text-red-600 font-bold tracking-tight">
                          ⚠ Unpaid — Admin will follow up if unpaid
                        </p>
                      </div>
                    )}
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                      ID: #{deal.id?.slice(-8) || deal.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalItems={deals.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── DEALER PROFILE TAB ────────────────────────────────────────────────────────────

function ProfileTab({ dealerSession }: { dealerSession: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
  const headers = { Authorization: token ? `Bearer ${token}` : '' };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dealerId = dealerSession.dealerId || dealerSession.id;
        const res = await fetch(`/api/dealers/${dealerId}`, { headers });
        if (res.ok) setProfile(await res.json());
        else setErr('Could not load profile from server.');
      } catch { setErr('Failed to load profile.'); }
      finally { setLoading(false); }
    })();
  }, [dealerSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setErr('');
    try {
      const dealerId = dealerSession.dealerId || dealerSession.id;
      const res = await fetch(`/api/dealers/${dealerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSuccess(true); setProfile(await res.json()); setIsEditing(false);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await res.json(); setErr(data.error || 'Failed to save profile.');
      }
    } catch { setErr('Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-xl border-2 border-slate-205 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium text-slate-800 transition-colors";

  if (loading) return <div className="space-y-6">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;
  if (!profile) return <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center text-xs font-bold">Error loading profile. Please try logging in again.</div>;

  if (!isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#0A2342] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-white/5">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-emerald-500 flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0">
                {(profile.companyName || profile.name)?.charAt(0)?.toUpperCase()}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight truncate max-w-[300px] sm:max-w-none">{profile.companyName || 'Not Set'}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${profile.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {profile.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Partner ID: <span className="font-mono text-emerald-400 font-bold">{profile.id}</span></p>
                {profile.commissionPercentage > 0 && (
                  <p className="text-xs text-amber-300 font-bold">Commission: {profile.commissionPercentage}% · ₹{profile.perCustomerAssignmentFee || 0} per assignment</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0">
              Update Profile Details
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" /><span>Profile changes saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Contact Details</h3>
            <div className="space-y-3.5 text-xs text-slate-700 font-medium">
              <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Contact Person</span><span className="text-sm font-bold text-slate-800">{profile.name || '—'}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Primary Phone</span><span className="text-slate-800 font-mono font-bold">{profile.phone || '—'}</span></div>
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">WhatsApp</span><span className="text-slate-800 font-mono font-bold">{profile.whatsappPhone || '—'}</span></div>
              </div>
              <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Email Address</span><span className="text-slate-800 font-bold break-all">{profile.email || '—'}</span></div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Business Details</h3>
            <div className="space-y-3.5 text-xs text-slate-700 font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">GSTIN</span><span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block uppercase mt-0.5">{profile.gstin || '—'}</span></div>
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">PAN</span><span className="text-xs font-mono font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block uppercase mt-0.5">{profile.panNumber || '—'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">City / State</span><span className="text-slate-800 font-bold">{[profile.city, profile.state].filter(Boolean).join(', ') || '—'}</span></div>
                <div><span className="font-bold text-slate-400 uppercase text-[9px] block">Business Type</span><span className="text-slate-800 font-bold">{profile.businessType || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
      <SectionHeader title="Update Profile" />
      {err && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold">{err}</div>}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Personal & Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Contact Person</label><input className={inputCls} value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} required /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email (Read-only)</label><input className={`${inputCls} bg-slate-100 text-slate-400 cursor-not-allowed`} value={profile.email || ''} readOnly disabled /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Primary Phone</label><input className={inputCls} value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} required /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">WhatsApp Phone</label><input className={inputCls} value={profile.whatsappPhone || ''} onChange={e => setProfile({ ...profile, whatsappPhone: e.target.value })} /></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Business Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Company Name</label><input className={inputCls} value={profile.companyName || ''} onChange={e => setProfile({ ...profile, companyName: e.target.value })} required /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Business Type</label>
              <select className={inputCls} value={profile.businessType || ''} onChange={e => setProfile({ ...profile, businessType: e.target.value })}>
                <option value="">Select type</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Distributor">Distributor</option>
                <option value="Retailer">Retailer</option>
                <option value="RegionalSupplier">Regional Supplier</option>
              </select>
            </div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">GSTIN</label><input className={inputCls} value={profile.gstin || ''} onChange={e => setProfile({ ...profile, gstin: e.target.value })} /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">PAN Number</label><input className={inputCls} value={profile.panNumber || ''} onChange={e => setProfile({ ...profile, panNumber: e.target.value })} /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">City</label><input className={inputCls} value={profile.city || ''} onChange={e => setProfile({ ...profile, city: e.target.value })} required /></div>
            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">State</label><input className={inputCls} value={profile.state || ''} onChange={e => setProfile({ ...profile, state: e.target.value })} required /></div>
            <div className="sm:col-span-2"><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shop / Office Address</label><textarea className={`${inputCls} h-20 resize-none`} value={profile.shopAddress || ''} onChange={e => setProfile({ ...profile, shopAddress: e.target.value })} placeholder="Complete address..." /></div>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-100 pt-6">
          <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
          <button type="submit" disabled={saving} className="flex-[2] py-3 bg-[#10B981] hover:bg-[#0D9488] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── MAIN DEALER PORTAL ────────────────────────────────────────────────────────────

const DEALER_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'My Customers', icon: Users },
  { id: 'deals', label: 'Deal Closures', icon: Handshake },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function DealerPortal({ dealerSession, onLoginSuccess, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Top bar */}
      <header className={`flex items-center justify-between px-6 py-4 bg-[#0A2342] border-b border-white/10 shrink-0 gap-4 ${activeTab === 'ai' ? 'hidden md:flex' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm uppercase tracking-tight leading-none">Dealer Portal</p>
            <p className="text-slate-400 text-xs font-medium">{dealerSession?.companyName || dealerSession?.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer">
          <LogOut className="h-4 w-4" />Logout
        </button>
      </header>

      <div className="flex flex-grow min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-56 bg-white border-r border-slate-200 flex-col py-4 gap-1 shrink-0">
          {DEALER_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className="h-4 w-4 shrink-0" /><span>{tab.label}</span>
              </button>
            );
          })}

          {/* Dealer info */}
          <div className="mt-auto mx-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-xs font-black text-slate-900 truncate">{dealerSession?.companyName || dealerSession?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{dealerSession?.email}</p>
            {dealerSession?.commissionPercentage > 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">Commission: {dealerSession.commissionPercentage}%</p>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className={`flex-grow min-h-0 relative ${activeTab === 'ai' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-4 md:p-6 pb-20 md:pb-6'}`}>
          {activeTab === 'dashboard' && <DealerDashboardTab dealerSession={dealerSession} setActiveTab={setActiveTab} />}
          {activeTab === 'customers' && <MyCustomersTab dealerSession={dealerSession} />}
          {activeTab === 'deals' && <DealClosuresTab dealerSession={dealerSession} />}
          {activeTab === 'profile' && <ProfileTab dealerSession={dealerSession} />}
          {activeTab === 'ai' && <DealerAiAssistant dealerSession={dealerSession} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className={`md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2 shrink-0 ${activeTab === 'ai' ? 'hidden' : ''}`}>
        {DEALER_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all cursor-pointer ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
