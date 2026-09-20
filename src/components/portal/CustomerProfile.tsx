'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    User, Mail, Phone, Shield, FileText, CheckCircle2, Clock, ArrowRight,
    ChevronRight, Download, Bell, AlertCircle, Loader2, Building2,
    HelpCircle, Send, Key, Sparkles, LayoutDashboard, MessageSquare, ShoppingCart, Lock, MapPin,
    ArrowLeft, Filter, RefreshCw, ExternalLink, Activity, Truck, LogOut
} from 'lucide-react';
import { useCompanySettings } from '../../context/CompanySettingsContext';

interface Props {
    customerSession: any;
    onLogout: () => void;
    onUpdateSession: (updatedUser: any) => void;
    activeHash?: string;
    onNavigate?: (hash: string) => void;
}

type ViewMode = 'overview' | 'orders' | 'quotations' | 'support' | 'security';

const ORDER_STEPS = ['pending', 'processing', 'assembly', 'testing', 'shipped', 'delivered'];

const ORDER_STEP_LABELS: Record<string, string> = {
    pending: 'Order Received',
    processing: 'Processing',
    assembly: 'In Assembly',
    testing: 'Quality Testing',
    shipped: 'Shipped / In Transit',
    delivered: 'Delivered',
};

const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border border-slate-200 font-semibold',
    processing: 'bg-blue-50 text-blue-800 border border-slate-200 font-semibold',
    assembly: 'bg-indigo-50 text-indigo-800 border border-slate-200 font-semibold',
    testing: 'bg-cyan-50 text-cyan-800 border border-slate-200 font-semibold',
    shipped: 'bg-purple-50 text-purple-800 border border-slate-200 font-semibold',
    delivered: 'bg-emerald-50 text-emerald-800 border border-slate-200 font-semibold',
    cancelled: 'bg-red-50 text-red-800 border border-slate-200 font-semibold line-through',
};

export default function CustomerProfile({ customerSession, onLogout, onUpdateSession, activeHash, onNavigate }: Props) {
    const { settings: companySettings } = useCompanySettings();
    const [currentView, setCurrentView] = useState<ViewMode>('overview');
    const [orders, setOrders] = useState<any[]>([]);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Profile edits
    const [profileForm, setProfileForm] = useState({
        name: customerSession?.name || '',
        phone: customerSession?.phone || '',
        password: '',
        confirmPassword: ''
    });

    // Inquiry form
    const [inquiryForm, setInquiryForm] = useState({
        productInterest: '',
        subject: '',
        message: ''
    });
    const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);
    const [inquiryError, setInquiryError] = useState('');

    // Selected details modal for orders
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Activity filter
    const [activityFilter, setActivityFilter] = useState<'all' | 'orders' | 'quotations' | 'support' | 'security'>('all');

    // Orders tab filter
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

    // Sync activeHash with view mode
    useEffect(() => {
        if (!activeHash) return;
        const cleanHash = activeHash.split('?')[0];
        if (cleanHash === '#orders') setCurrentView('orders');
        else if (cleanHash === '#quotations') setCurrentView('quotations');
        else if (cleanHash === '#support') setCurrentView('support');
        else if (cleanHash === '#security') setCurrentView('security');
        else if (cleanHash === '#profile') setCurrentView('overview');
    }, [activeHash]);

    const handleNavigateToView = (view: ViewMode) => {
        setCurrentView(view);
        if (onNavigate) {
            const targetHash = view === 'overview' ? '#profile' : `#${view}`;
            onNavigate(targetHash);
        }
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getHeaders = useCallback(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
        return {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1800);

        try {
            const headers = getHeaders();

            const clientEmail = customerSession?.email || '';
            const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
            const authSuffix = token ? `?token=${encodeURIComponent(token)}` : '';

            const [dealsRes, inquiryRes, notifRes] = await Promise.all([
                fetch('/api/deals', { headers }).catch(() => null),
                fetch('/api/inquiries', { headers }).catch(() => null),
                clientEmail ? fetch(`/api/customer/notifications?customerEmail=${encodeURIComponent(clientEmail)}`, { headers }).catch(() => null) : null,
            ]);

            if (dealsRes && dealsRes.ok) {
                const dealsData = await dealsRes.json();
                const mappedOrders = dealsData.map((d: any) => ({
                    id: d.id,
                    productName: d.productTitle || d.productType || 'Power System Solution',
                    capacity: d.productType || 'Industrial Specification',
                    price: d.closedAmount || 0,
                    total: d.closedAmount || 0,
                    status: 'delivered',
                    trackingNumber: `VLT-${d.id.slice(-6).toUpperCase()}`,
                    estimatedDelivery: 'Fulfilled & Installed',
                    createdAt: d.closedAt || d.createdAt || new Date().toISOString(),
                    dealerName: d.dealerCompanyName,
                    dealerPhone: d.dealerPhone,
                    notes: d.description || `Delivered and verified by ${d.dealerCompanyName || 'Authorized Partner'}.`,
                    invoiceNumber: d.invoiceNumber || '',
                    invoiceUrl: d.invoiceUrl ? `${d.invoiceUrl}${authSuffix}` : '',
                    invoiceName: d.invoiceName,
                }));
                setOrders(mappedOrders);

                // Mapped invoices as purchase documents (replaces quotations)
                const mappedInvoices = dealsData.map((d: any) => ({
                    id: d.id,
                    productName: d.productTitle || d.productType || 'Equipment Purchase',
                    capacity: d.productType || 'Standard',
                    phase: '3-Phase / 1-Phase',
                    cooling: 'Certified Spec',
                    quantity: 1,
                    total: d.closedAmount || 0,
                    status: d.invoiceUrl ? 'Invoice Issued' : 'Fulfilled',
                    invoiceNumber: d.invoiceNumber || '',
                    invoiceUrl: d.invoiceUrl ? `${d.invoiceUrl}${authSuffix}` : '',
                    invoiceName: d.invoiceName,
                    createdAt: d.closedAt || d.createdAt || new Date().toISOString()
                }));
                setQuotations(mappedInvoices);
            }
            if (inquiryRes && inquiryRes.ok) setInquiries(await inquiryRes.json());
            if (notifRes && notifRes.ok) {
                const notifs = await notifRes.json();
                if (Array.isArray(notifs)) setNotifications(notifs);
            }
        } catch (e) {
            console.error('Error fetching customer dashboard data:', e);
        } finally {
            clearTimeout(timer);
            setIsLoading(false);
        }
    }, [getHeaders, customerSession?.email]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Keep profileForm sync with customerSession prop updates
    useEffect(() => {
        if (customerSession) {
            setProfileForm(prev => ({
                ...prev,
                name: customerSession.name || '',
                phone: customerSession.phone || ''
            }));
        }
    }, [customerSession]);

    // Profile save
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess(false);

        if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
            setProfileError('Passwords do not match');
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await fetch('/api/customer/profile', {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: profileForm.name,
                    phone: profileForm.phone,
                    password: profileForm.password || undefined
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setProfileSuccess(true);
                setProfileForm(f => ({ ...f, password: '', confirmPassword: '' }));
                onUpdateSession(data.user);
            } else {
                setProfileError(data.error || 'Failed to update profile.');
            }
        } catch (err) {
            setProfileError('Connection error.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Inquiry submit
    const handleNewInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInquiryError('');
        setInquirySuccess(false);
        setIsInquirySubmitting(true);

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: customerSession?.name || 'Valued Client',
                    email: customerSession?.email || '',
                    phone: customerSession?.phone || '',
                    productInterest: inquiryForm.productInterest,
                    subject: inquiryForm.subject || `Product Inquiry: ${inquiryForm.productInterest}`,
                    message: inquiryForm.message
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setInquirySuccess(true);
                setInquiryForm({ productInterest: '', subject: '', message: '' });
                const inqRes = await fetch('/api/inquiries', { headers: getHeaders() });
                if (inqRes && inqRes.ok) setInquiries(await inqRes.json());
            } else {
                setInquiryError(data.error || 'Failed to submit inquiry.');
            }
        } catch (err) {
            setInquiryError('Connection failed.');
        } finally {
            setIsInquirySubmitting(false);
        }
    };

    // Safe session getters
    const clientName = customerSession?.name || 'Valued Client';
    const clientEmail = customerSession?.email || '';
    const clientCategory = customerSession?.category || 'General Tier';

    // Calculate aggregated Recent Activities
    const recentActivities = useMemo(() => {
        const list: Array<{
            id: string;
            type: 'orders' | 'quotations' | 'support' | 'security';
            title: string;
            description: string;
            timestamp: Date;
            statusTag?: string;
            statusColor?: string;
            rawItem?: any;
            actionLabel?: string;
            onAction?: () => void;
        }> = [];

        // Add Orders activities
        orders.forEach(o => {
            list.push({
                id: `order-${o.id}`,
                type: 'orders',
                title: `Order Update: ${o.productName || 'Power Equipment'}`,
                description: `Order #${o.id} is currently at status: ${ORDER_STEP_LABELS[o.status?.toLowerCase()] || o.status}. Amount: ₹${o.price?.toLocaleString('en-IN') || 0}`,
                timestamp: new Date(o.updatedAt || o.createdAt || Date.now()),
                statusTag: ORDER_STEP_LABELS[o.status?.toLowerCase()] || o.status,
                statusColor: STATUS_COLOR[o.status?.toLowerCase()] || 'bg-slate-50 text-slate-700 border border-slate-200',
                rawItem: o,
                actionLabel: 'View Order Details',
                onAction: () => {
                    setSelectedOrder(o);
                }
            });
        });

        // Add Quotations activities
        quotations.forEach(q => {
            list.push({
                id: `quote-${q.id}`,
                type: 'quotations',
                title: `Quotation Issued: ${q.productName || 'Engineering Blueprint'}`,
                description: `Estimate #${q.id} with total value ₹${q.total?.toLocaleString('en-IN') || 0}. Valid until ${q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'N/A'}.`,
                timestamp: new Date(q.createdAt || Date.now()),
                statusTag: q.status || 'Active Quote',
                statusColor: q.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border border-slate-200' : 'bg-blue-50 text-blue-800 border border-slate-200',
                rawItem: q,
                actionLabel: 'View Details',
                onAction: () => handleNavigateToView('support')
            });
        });

        // Add Inquiries activities
        inquiries.forEach(inq => {
            list.push({
                id: `inq-${inq.id}`,
                type: 'support',
                title: `Support Ticket: ${inq.subject}`,
                description: `Technical request filed for ${inq.productInterest || 'General Inquiry'}. Message: ${inq.message?.substring(0, 80)}...`,
                timestamp: new Date(inq.createdAt || Date.now()),
                statusTag: inq.status?.toUpperCase() || 'NEW',
                statusColor: inq.status === 'resolved' ? 'bg-emerald-50 text-emerald-800 border border-slate-200' : 'bg-amber-50 text-amber-800 border border-slate-200',
                rawItem: inq,
                actionLabel: 'View Support Desk',
                onAction: () => handleNavigateToView('support')
            });
        });

        // Add Notifications
        notifications.forEach(n => {
            list.push({
                id: `notif-${n.id}`,
                type: 'orders',
                title: `Notification: ${n.message?.substring(0, 45)}...`,
                description: n.message,
                timestamp: new Date(n.createdAt || Date.now()),
                statusTag: 'ALERT',
                statusColor: 'bg-purple-50 text-purple-800 border border-slate-200',
                rawItem: n,
                actionLabel: 'View Orders',
                onAction: () => handleNavigateToView('orders')
            });
        });

        // Add Security activity
        list.push({
            id: `security-session`,
            type: 'security',
            title: `Portal Session Active`,
            description: `Logged in securely as ${clientName} (${clientEmail}). Session tokens verified.`,
            timestamp: new Date(),
            statusTag: 'SECURE',
            statusColor: 'bg-emerald-50 text-emerald-800 border border-slate-200',
            actionLabel: 'Manage Security',
            onAction: () => handleNavigateToView('security')
        });

        // Sort descending by timestamp
        return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [orders, quotations, inquiries, notifications, clientName, clientEmail]);

    const filteredActivities = useMemo(() => {
        if (activityFilter === 'all') return recentActivities;
        return recentActivities.filter(act => act.type === activityFilter);
    }, [recentActivities, activityFilter]);

    const latestOrder = useMemo(() => {
        if (orders.length === 0) return null;
        return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [orders]);

    const latestQuotation = useMemo(() => {
        if (quotations.length === 0) return null;
        return [...quotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [quotations]);

    const filteredOrdersList = useMemo(() => {
        if (orderStatusFilter === 'all') return orders;
        return orders.filter(o => o.status?.toLowerCase() === orderStatusFilter.toLowerCase());
    }, [orders, orderStatusFilter]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] font-sans bg-[#f8fafc]">
                <div className="p-5 bg-white border border-slate-200 rounded-lg flex flex-col items-center shadow-xs">
                    <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mb-2" />
                    <p className="text-slate-500 text-[10px] font-semibold tracking-wider uppercase">
                        Loading Portal Space...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] py-5 px-2.5 sm:px-5 font-sans text-slate-800 selection:bg-emerald-600 selection:text-white mb-20">
            <div className="max-w-5xl mx-auto space-y-5">

                {/* 1. Header Banner (Shown ONLY on Overview Dashboard) */}
                {currentView === 'overview' && (
                    <div className="relative rounded-xl bg-gradient-to-r from-slate-950 via-[#0A2342] to-slate-900 text-white p-4 sm:p-5 overflow-hidden border border-slate-800">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[9px] tracking-wide uppercase">
                                    <Sparkles className="h-2.5 w-2.5 text-emerald-400" /> Customer Profile
                                </div>
                                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                                    Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">{clientName}</span>
                                </h1>
                                <p className="text-[11px] sm:text-xs text-slate-300 font-normal max-w-lg leading-normal">
                                    Monitor power equipment fulfillments, review engineering blueprints & quotations, connect with technical support, and update your security dossier.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Back Navigation Bar when in Sub-Pages */}
                {currentView !== 'overview' && (
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-2.5 sm:p-3 rounded-lg">
                        <button
                            onClick={() => handleNavigateToView('overview')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all cursor-pointer border border-slate-200"
                        >
                            <ArrowLeft className="h-3 w-3" /> Back to Overview
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                <span className="text-slate-400">Profile</span>
                                <ChevronRight className="h-2.5 w-2.5 text-slate-300" />
                                <span className="text-emerald-600 font-semibold">/{currentView}</span>
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-all text-[11px] font-semibold uppercase tracking-wide border border-red-200 cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* MAIN OVERVIEW PAGE VIEW */}
                {currentView === 'overview' && (
                    <div className="space-y-5 animate-fade-in">

                        {/* SECTION 1: THE 4 RECTANGULAR BOX CARDS (MICRO-TYPOGRAPHY & EXECUTIVE PROPORTIONS) */}
                        <div>
                            {/* 2 Columns on Mobile (grid-cols-2), 4 Columns on Desktop (lg:grid-cols-4) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">

                                {/* RECTANGULAR BOX 1: ORDERS */}
                                <div
                                    onClick={() => handleNavigateToView('orders')}
                                    className="group relative bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-1 flex-wrap xs:flex-nowrap">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-xs flex items-center justify-center font-semibold shrink-0 group-hover:scale-105 transition-transform">
                                                <ShoppingCart className="h-4 w-4" />
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-wider bg-white/90 text-emerald-800 border border-emerald-200 shrink-0">
                                                {orders.length} Records
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-[11px] sm:text-xs font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase tracking-wide">
                                                ORDERS
                                            </h3>
                                            <p className="text-[10px] text-emerald-800/80 font-normal mt-0.5 line-clamp-2">
                                                Fulfillments & tracking.
                                            </p>
                                        </div>

                                        {latestOrder ? (
                                            <div className="p-1.5 bg-white/90 rounded border border-emerald-200/80 text-[10px]">
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block truncate">Latest Status</span>
                                                <span className="font-semibold text-slate-800 truncate block text-[10px]">{latestOrder.productName}</span>
                                                <span className="inline-block mt-0.5 px-1 py-0.2 text-[8px] font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase truncate">
                                                    {ORDER_STEP_LABELS[latestOrder.status?.toLowerCase()] || latestOrder.status}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="p-1.5 bg-white/90 rounded border border-emerald-200/80 text-[10px] text-slate-400 italic font-normal">
                                                No active orders
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-emerald-200/60 mt-2 flex items-center justify-between text-[10px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                                        <span className="truncate">View Details →</span>
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                    </div>
                                </div>

                                {/* RECTANGULAR BOX 2: QUOTATION */}
                                <div
                                    onClick={() => handleNavigateToView('quotations')}
                                    className="group relative bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-lg p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-1 flex-wrap xs:flex-nowrap">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs flex items-center justify-center font-semibold shrink-0 group-hover:scale-105 transition-transform">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-wider bg-white/90 text-blue-800 border border-blue-200 shrink-0">
                                                {quotations.length} Active
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-[11px] sm:text-xs font-bold text-blue-950 group-hover:text-blue-700 transition-colors uppercase tracking-wide">
                                                QUOTATION
                                            </h3>
                                            <p className="text-[10px] text-blue-800/80 font-normal mt-0.5 line-clamp-2">
                                                Blueprints & PDF estimates.
                                            </p>
                                        </div>

                                        {latestQuotation ? (
                                            <div className="p-1.5 bg-white/90 rounded border border-blue-200/80 text-[10px]">
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block truncate">Recent Quote</span>
                                                <span className="font-semibold text-slate-800 truncate block text-[10px]">{latestQuotation.productName}</span>
                                                <span className="font-bold text-blue-700 block mt-0.5 text-[10px]">₹{latestQuotation.total?.toLocaleString('en-IN')}</span>
                                            </div>
                                        ) : (
                                            <div className="p-1.5 bg-white/90 rounded border border-blue-200/80 text-[10px] text-slate-400 italic font-normal">
                                                No quotes on record
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-blue-200/60 mt-2 flex items-center justify-between text-[10px] font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                                        <span className="truncate">View Details →</span>
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                    </div>
                                </div>

                                {/* RECTANGULAR BOX 3: SUPPORT */}
                                <div
                                    onClick={() => handleNavigateToView('support')}
                                    className="group relative bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-lg p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-1 flex-wrap xs:flex-nowrap">
                                            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white shadow-xs flex items-center justify-center font-semibold shrink-0 group-hover:scale-105 transition-transform">
                                                <HelpCircle className="h-4 w-4" />
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-wider bg-white/90 text-amber-800 border border-amber-200 shrink-0">
                                                {inquiries.length} Tickets
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-[11px] sm:text-xs font-bold text-amber-950 group-hover:text-amber-700 transition-colors uppercase tracking-wide">
                                                SUPPORT
                                            </h3>
                                            <p className="text-[10px] text-amber-800/80 font-normal mt-0.5 line-clamp-2">
                                                Helpdesk & partner contact.
                                            </p>
                                        </div>

                                        <div className="p-1.5 bg-white/90 rounded border border-amber-200/80 text-[10px]">
                                            <span className="text-[8.5px] font-medium uppercase text-slate-400 block truncate">Support Desk</span>
                                            <span className="font-semibold text-slate-800 truncate block text-[10px]">
                                                {customerSession?.assignedDealers && customerSession.assignedDealers.length > 0
                                                    ? customerSession.assignedDealers[0].name
                                                    : 'Voltrix Technical Desk'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-amber-200/60 mt-2 flex items-center justify-between text-[10px] font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                                        <span className="truncate">View Details →</span>
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                    </div>
                                </div>

                                {/* RECTANGULAR BOX 4: SECURITY */}
                                <div
                                    onClick={() => handleNavigateToView('security')}
                                    className="group relative bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200 rounded-lg p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-1 flex-wrap xs:flex-nowrap">
                                            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white shadow-xs flex items-center justify-center font-semibold shrink-0 group-hover:scale-105 transition-transform">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold uppercase tracking-wider bg-white/90 text-purple-800 border border-purple-200 shrink-0">
                                                Protected
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-[11px] sm:text-xs font-bold text-purple-950 group-hover:text-purple-700 transition-colors uppercase tracking-wide">
                                                SECURITY
                                            </h3>
                                            <p className="text-[10px] text-purple-800/80 font-normal mt-0.5 line-clamp-2">
                                                Password & profile dossier.
                                            </p>
                                        </div>

                                        <div className="p-1.5 bg-white/90 rounded border border-purple-200/80 text-[10px]">
                                            <span className="text-[8.5px] font-medium uppercase text-slate-400 block truncate">Account Status</span>
                                            <span className="font-semibold text-emerald-700 block text-[10px] truncate">Verified Active</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-purple-200/60 mt-2 flex items-center justify-between text-[10px] font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                                        <span className="truncate">View Details →</span>
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* SECTION 2: RECENT ACTIVITY TIMELINE */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="h-3.5 w-3.5 text-emerald-600" />
                                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Recent Activity Timeline</h2>
                                    </div>
                                    <p className="text-slate-500 text-[11px] font-normal mt-0.5">
                                        Chronological feed of your orders, engineering quotes, support inquiries, and portal events.
                                    </p>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg self-start sm:self-center overflow-x-auto max-w-full border border-slate-200">
                                    <button
                                        onClick={() => setActivityFilter('all')}
                                        className={`px-2.5 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${activityFilter === 'all' ? 'bg-[#0A2342] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        All ({recentActivities.length})
                                    </button>
                                    <button
                                        onClick={() => setActivityFilter('orders')}
                                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${activityFilter === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => setActivityFilter('quotations')}
                                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${activityFilter === 'quotations' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Quotation
                                    </button>
                                    <button
                                        onClick={() => setActivityFilter('support')}
                                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${activityFilter === 'support' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Support
                                    </button>
                                    <button
                                        onClick={() => setActivityFilter('security')}
                                        className={`px-2 py-1 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${activityFilter === 'security' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        Security
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Timeline Feed Items */}
                            <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto pr-1.5 sm:pr-2.5 space-y-3 custom-scrollbar">
                                {filteredActivities.length === 0 ? (
                                    <div className="py-6 text-center text-slate-400">
                                        <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-30 text-slate-400" />
                                        <p className="text-[11px] font-semibold text-slate-600">No activity recorded for this category.</p>
                                    </div>
                                ) : (
                                    <div className="relative pl-4 sm:pl-6 space-y-3 before:absolute before:left-1.5 sm:before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                        {filteredActivities.map((act) => (
                                            <div key={act.id} className="relative group">
                                                {/* Dot Indicator */}
                                                <div className={`absolute -left-4 sm:-left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center z-10 ${act.type === 'orders' ? 'bg-emerald-500' :
                                                    act.type === 'quotations' ? 'bg-blue-600' :
                                                        act.type === 'support' ? 'bg-amber-500' : 'bg-purple-600'
                                                    }`}></div>

                                                <div className="bg-slate-50/60 hover:bg-white border border-slate-200 p-2.5 sm:p-3 rounded-lg transition-all space-y-1.5">
                                                    <div className="flex items-start justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-semibold uppercase tracking-wide ${act.statusColor || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                                    {act.type.toUpperCase()} • {act.statusTag}
                                                                </span>
                                                                <span className="text-[9.5px] font-normal text-slate-400">
                                                                    {act.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {act.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-semibold text-slate-900 text-[11px] sm:text-xs">{act.title}</h4>
                                                            <p className="text-[11px] text-slate-600 font-normal leading-snug">{act.description}</p>
                                                        </div>

                                                        {act.actionLabel && act.onAction && (
                                                            <button
                                                                onClick={act.onAction}
                                                                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-all cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-0.5"
                                                            >
                                                                {act.actionLabel} <ChevronRight className="h-2.5 w-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 3: LOG OUT ACTION BANNER (PLACED RIGHT AFTER TIMELINE) */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-red-50/40 via-white to-slate-50 pb-20">
                            <div className="flex items-center gap-3 text-center sm:text-left">
                                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                                    <LogOut className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900">Sign Out of Customer Portal</h3>
                                    <p className="text-[10.5px] text-slate-500 font-normal">Safely terminate your active portal session on this device.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-xs active:scale-98"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span>Log Out</span>
                            </button>
                        </div>

                    </div>
                )}

                {/* DEDICATED SUB-PAGE 1: ORDERS PAGE (/orders) */}
                {currentView === 'orders' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Header */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] uppercase tracking-wide mb-0.5">
                                    <ShoppingCart className="h-3 w-3" /> Dedicated Component Page (/orders)
                                </div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Orders & Logistics Management</h2>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Track real-time assembly, quality testing, and dispatch milestones for all your Voltrix equipment purchases.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="px-2.5 py-1 bg-emerald-50 border border-slate-200 rounded-lg text-center">
                                    <span className="text-[8.5px] font-semibold text-emerald-600 uppercase block">Total Orders</span>
                                    <span className="text-sm font-bold text-slate-900">{orders.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-0.5">
                                <Filter className="h-2.5 w-2.5" /> Filter:
                            </span>
                            {['all', 'pending', 'processing', 'testing', 'shipped', 'delivered'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setOrderStatusFilter(st)}
                                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer shrink-0 ${orderStatusFilter === st ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {st === 'all' ? 'All Orders' : ORDER_STEP_LABELS[st] || st}
                                </button>
                            ))}
                        </div>

                        {/* Orders List */}
                        {filteredOrdersList.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
                                <ShoppingCart className="h-8 w-8 mx-auto mb-1.5 opacity-25" />
                                <p className="text-[11px] font-semibold text-slate-700">No orders match this status.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredOrdersList.map(o => (
                                    <div
                                        key={o.id}
                                        className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-all space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2.5 flex-wrap sm:flex-nowrap border-b border-slate-100 pb-2.5">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="font-bold text-slate-900 text-xs">{o.productName}</h3>
                                                    <span className={`px-2 py-0.2 rounded-full text-[8.5px] font-semibold uppercase tracking-wide ${STATUS_COLOR[o.status?.toLowerCase()] || 'bg-slate-100 border border-slate-200'}`}>
                                                        {ORDER_STEP_LABELS[o.status?.toLowerCase()] || o.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    Order ID: #{o.id} • Quotation Ref: #{o.quotationId || 'Direct'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                <button
                                                    onClick={() => setSelectedOrder(o)}
                                                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer border border-slate-200"
                                                >
                                                    View Specs & Tracking
                                                </button>


                                            </div>
                                        </div>

                                        {/* Horizontal Fulfillment Timeline with Vehicle Icon */}
                                        <div className="space-y-2 bg-slate-50/70 border border-slate-200 p-3 sm:p-4 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                                    <Truck className="h-3.5 w-3.5 text-emerald-600" /> Fulfillment Timeline
                                                </span>
                                                <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                                                    {ORDER_STEP_LABELS[o.status?.toLowerCase()] || o.status}
                                                </span>
                                            </div>

                                            <div className="relative pt-4 pb-2 px-3 sm:px-5">
                                                {/* Base track line */}
                                                <div className="absolute top-7 left-6 right-6 h-1 bg-slate-200 rounded-full -translate-y-1/2"></div>

                                                {/* Filled active track line */}
                                                {(() => {
                                                    const currentIdx = ORDER_STEPS.indexOf(o.status?.toLowerCase()) >= 0
                                                        ? ORDER_STEPS.indexOf(o.status?.toLowerCase())
                                                        : 0;
                                                    const percent = (currentIdx / (ORDER_STEPS.length - 1)) * 100;
                                                    return (
                                                        <div
                                                            className="absolute top-7 left-6 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full -translate-y-1/2 transition-all duration-500"
                                                            style={{ width: `calc(${percent}% * 0.88)` }}
                                                        ></div>
                                                    );
                                                })()}

                                                {/* Milestone nodes */}
                                                <div className="relative flex items-center justify-between z-10">
                                                    {ORDER_STEPS.map((step, idx) => {
                                                        const currentIdx = ORDER_STEPS.indexOf(o.status?.toLowerCase());
                                                        const isDone = currentIdx >= idx;
                                                        const isCurrent = currentIdx === idx;

                                                        return (
                                                            <div key={step} className="flex flex-col items-center group">
                                                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent
                                                                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm'
                                                                    : isDone
                                                                        ? 'bg-emerald-500 text-white border-2 border-white'
                                                                        : 'bg-white text-slate-400 border-2 border-slate-200'
                                                                    }`}>
                                                                    {isCurrent ? (
                                                                        <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                                                                    ) : isDone ? (
                                                                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                    ) : (
                                                                        <span className="text-[9px] font-bold text-slate-400">{idx + 1}</span>
                                                                    )}
                                                                </div>

                                                                <span className={`text-[8.5px] sm:text-[9.5px] font-semibold mt-1.5 text-center leading-tight max-w-[60px] sm:max-w-[75px] ${isCurrent ? 'text-emerald-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                                                                    }`}>
                                                                    {ORDER_STEP_LABELS[step]}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* DEDICATED SUB-PAGE 2: QUOTATION PAGE (/quotations) */}
                {currentView === 'quotations' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Header */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-1 text-blue-600 font-semibold text-[11px] uppercase tracking-wide mb-0.5">
                                    <FileText className="h-3 w-3" /> Dedicated Component Page (/quotations)
                                </div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Engineering Quotations Hub</h2>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Review official power solution pricing estimates, technical specifications, and export PDF blueprints directly.
                                </p>
                            </div>

                            <div className="px-2.5 py-1 bg-blue-50 border border-slate-200 rounded-lg text-center">
                                <span className="text-[8.5px] font-semibold text-blue-600 uppercase block">Active Quotes</span>
                                <span className="text-sm font-bold text-slate-900">{quotations.length}</span>
                            </div>
                        </div>

                        {/* Quotations List */}
                        {quotations.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
                                <FileText className="h-8 w-8 mx-auto mb-1.5 opacity-25" />
                                <p className="text-[11px] font-semibold text-slate-700">No engineering quotations on record.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {quotations.map(q => (
                                    <div
                                        key={q.id}
                                        className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-slate-300 transition-all space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2.5 flex-wrap sm:flex-nowrap border-b border-slate-100 pb-2.5">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="font-bold text-slate-900 text-xs">{q.productName}</h3>
                                                    <span className="px-2 py-0.2 rounded-full text-[8.5px] font-semibold uppercase bg-blue-50 text-blue-800 border border-slate-200">
                                                        {q.status || 'Active'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    Quotation ID: #{q.id} • {q.invoiceNumber ? `Invoice: #${q.invoiceNumber} • ` : ''}Issued: {new Date(q.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>


                                        </div>

                                        {/* Specs Table Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50/70 p-2.5 rounded-lg text-[10px] border border-slate-200">
                                            <div>
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block">Capacity Rating</span>
                                                <span className="font-semibold text-slate-900">{q.capacity || 'Standard'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block">Phase & Cooling</span>
                                                <span className="font-semibold text-slate-900">{q.phase} • {q.cooling}</span>
                                            </div>
                                            <div>
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block">Quantity</span>
                                                <span className="font-semibold text-slate-900">{q.quantity || 1} Nos</span>
                                            </div>
                                            <div>
                                                <span className="text-[8.5px] font-medium uppercase text-slate-400 block">Grand Total</span>
                                                <span className="font-bold text-emerald-700 text-xs">₹{q.total?.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* DEDICATED SUB-PAGE 3: SUPPORT PAGE (/support) */}
                {currentView === 'support' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Header */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px] uppercase tracking-wide mb-0.5">
                                    <HelpCircle className="h-3 w-3" /> Dedicated Component Page (/support)
                                </div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Technical Support & Executive Contacts</h2>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Direct access to Voltrix admin hotlines, technical support emails, and corporate engineering desk contacts.
                                </p>
                            </div>

                            <div className="px-2.5 py-1 bg-amber-50 border border-slate-200 rounded-lg text-center">
                                <span className="text-[8.5px] font-semibold text-amber-600 uppercase block">Assigned Support Desk</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {customerSession?.assignedDealers && customerSession.assignedDealers.length > 0
                                        ? customerSession.assignedDealers[0].name
                                        : 'Voltrix Technical Desk'}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info Cards (Replaces Form) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* Card 1: Admin Hotlines */}
                            <div className="bg-white border border-amber-200/80 rounded-xl p-4 sm:p-5 space-y-3 bg-gradient-to-b from-amber-50/40 via-white to-white">
                                <div className="flex items-center gap-2 border-b border-amber-100 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Admin Direct Hotlines</h3>
                                        <p className="text-[10px] text-slate-500 font-normal">Immediate telephone assistance</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-1">
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                        <span className="text-[8.5px] font-bold text-amber-700 uppercase tracking-wider block">Primary Admin Hotline</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">+91 90323 72136</span>
                                            <a
                                                href="tel:+919032372136"
                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer no-underline shrink-0"
                                            >
                                                <Phone className="h-3 w-3" /> Call
                                            </a>
                                        </div>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                        <span className="text-[8.5px] font-bold text-amber-700 uppercase tracking-wider block">Secondary Support Line</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">+91 73867 10160</span>
                                            <a
                                                href="tel:+917386710160"
                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer no-underline shrink-0"
                                            >
                                                <Phone className="h-3 w-3" /> Call
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Official Email Addresses */}
                            <div className="bg-white border border-blue-200/80 rounded-xl p-4 sm:p-5 space-y-3 bg-gradient-to-b from-blue-50/40 via-white to-white">
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Official Email Desk</h3>
                                        <p className="text-[10px] text-slate-500 font-normal">Blueprints & technical support</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-1">
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                        <span className="text-[8.5px] font-bold text-blue-700 uppercase tracking-wider block">Primary Admin Email</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-[11px] truncate" title="voltrixpowersystems@gmail.com">voltrixpowersystems@gmail.com</span>
                                            <a
                                                href="mailto:voltrixpowersystems@gmail.com"
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer no-underline shrink-0"
                                            >
                                                <Mail className="h-3 w-3" /> Mail
                                            </a>
                                        </div>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                        <span className="text-[8.5px] font-bold text-blue-700 uppercase tracking-wider block">Technical Support Desk</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-[11px] truncate" title="voltrixpowersystems@gmail.com">voltrixpowersystems@gmail.com</span>
                                            <a
                                                href="mailto:voltrixpowersystems@gmail.com"
                                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer no-underline shrink-0"
                                            >
                                                <Mail className="h-3 w-3" /> Mail
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Assigned Partner & Office HQ Location */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 md:col-span-2 lg:col-span-1 mb-20">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-slate-200 flex items-center justify-center font-bold shrink-0">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Corporate HQ Location</h3>
                                        <p className="text-[10px] text-slate-500 font-normal">Registered headquarters</p>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                                    <span className="font-bold text-slate-900 block text-xs">{companySettings?.companyName || 'FORTUNE TRADERS'}</span>
                                    <p className="text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                                        {companySettings?.address || '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad, Telangana – 500043'}
                                    </p>
                                    <span className="text-[9px] font-mono text-emerald-700 font-bold block pt-1">
                                        GSTIN: {companySettings?.gstin || '36AEPPI5022R1ZY'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* DEDICATED SUB-PAGE 4: SECURITY PAGE (/security) */}
                {currentView === 'security' && (
                    <div className="space-y-5 animate-fade-in">
                        {/* Header */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-1 text-purple-600 font-semibold text-[11px] uppercase tracking-wide mb-0.5">
                                    <Shield className="h-3 w-3" /> Dedicated Component Page (/security)
                                </div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Security & Account Dossier</h2>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                    Manage personal profile details, update authorization password, and inspect account security dossier.
                                </p>
                            </div>

                            <div className="px-2.5 py-1 bg-purple-50 border border-slate-200 rounded-lg text-center">
                                <span className="text-[8.5px] font-semibold text-purple-600 uppercase block">Security Level</span>
                                <span className="text-sm font-bold text-slate-900">Protected</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Security Audit dossier */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 text-[11px] text-slate-700">
                                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                                    Customer Details
                                </h3>

                                <div className="space-y-2.5">
                                    <div>
                                        <span className="text-[8.5px] font-medium text-slate-400 uppercase block mb-0.5">Authorization Level</span>
                                        <div className="flex items-center gap-1 text-slate-900 font-semibold text-[11px]">
                                            <Lock className="h-3 w-3 text-emerald-600" /> Authorized Voltrix Client ID
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-medium text-slate-400 uppercase block mb-0.5">Tier Status</span>
                                        <span className="text-emerald-700 font-bold uppercase text-[11px]">{clientCategory}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8.5px] font-medium text-slate-400 uppercase block mb-0.5">System Account ID</span>
                                        <span className="font-mono text-slate-600 select-all font-semibold break-all text-[10.5px] block">{customerSession?.id || customerSession?._id || 'N/A'}</span>
                                    </div>
                                    {customerSession?.createdAt && (
                                        <div>
                                            <span className="text-[8.5px] font-medium text-slate-400 uppercase block mb-0.5">Account Registered</span>
                                            <span>{new Date(customerSession.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile edit form */}
                            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 mb-20">
                                <form onSubmit={handleSaveProfile} className="space-y-3 text-[11px] font-medium">
                                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                                        Personal Profile Information
                                    </h3>

                                    {profileSuccess && (
                                        <div className="p-2.5 bg-emerald-50 border border-slate-200 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span>Profile contact details and password credentials updated successfully!</span>
                                        </div>
                                    )}

                                    {profileError && (
                                        <div className="p-2.5 bg-red-50 border border-slate-200 text-red-800 rounded-lg text-[11px] font-medium">
                                            {profileError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Full Client Name</label>
                                            <input
                                                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-[11px] font-normal focus:outline-none focus:border-purple-500"
                                                value={profileForm.name}
                                                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Mobile Telephone</label>
                                            <input
                                                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-[11px] font-normal focus:outline-none focus:border-purple-500"
                                                value={profileForm.phone}
                                                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Email Identifier (Read-only)</label>
                                            <input
                                                className="w-full rounded-md border border-slate-200 bg-slate-100 text-slate-500 px-2.5 py-1.5 text-[11px] font-normal cursor-not-allowed"
                                                value={clientEmail}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pt-2 pb-1">
                                        Security Password Credentials (Leave blank to keep unchanged)
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">New Security Password</label>
                                            <input
                                                type="password"
                                                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-[11px] font-normal focus:outline-none focus:border-purple-500"
                                                placeholder="••••••••"
                                                value={profileForm.password}
                                                onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Confirm New Password</label>
                                            <input
                                                type="password"
                                                className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-[11px] font-normal focus:outline-none focus:border-purple-500"
                                                placeholder="••••••••"
                                                value={profileForm.confirmPassword}
                                                onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] rounded-md transition-all flex items-center justify-center gap-1 border-none cursor-pointer"
                                        >
                                            {isSavingProfile ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin text-white" /> Saving Updates...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="h-3 w-3 text-white" /> Save Security Credentials
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Detailed Order Modal Window */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-3 overflow-y-auto">
                        <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col my-4 border border-slate-200 animate-scale-up">
                            {/* Header */}
                            <header className="px-4 py-3 bg-[#0A2342] text-white flex items-center justify-between shrink-0">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-bold text-xs sm:text-sm text-white">Order Logistics Specs</h3>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-semibold uppercase tracking-wide ${STATUS_COLOR[selectedOrder.status?.toLowerCase()] || 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                            {ORDER_STEP_LABELS[selectedOrder.status?.toLowerCase()] || selectedOrder.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-[10px] font-normal mt-0.5 leading-none">
                                        Voltrix Industrial Fulfillment & Tracking
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="h-7 w-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer border-none text-white text-sm font-bold"
                                >
                                    ×
                                </button>
                            </header>

                            {/* Content */}
                            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-grow max-h-[70vh] text-[11px] text-slate-700">
                                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 flex-wrap gap-1.5">
                                    <div>
                                        <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                                            Product Order ID
                                        </span>
                                        <p className="font-mono font-bold text-[#0A2342] text-xs flex items-center gap-1">
                                            <span>#{selectedOrder.id}</span>
                                            {selectedOrder.quotationId && (
                                                <span className="font-sans text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.2 rounded font-semibold">
                                                    Quote ref: #{selectedOrder.quotationId}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                                            Fulfillment Partner
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-700 block">
                                            {selectedOrder.dealerCompanyName || 'Voltrix Direct Store'}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Track */}
                                {selectedOrder.status?.toLowerCase() !== 'cancelled' ? (
                                    <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Truck className="h-4 w-4 text-emerald-600" />
                                                Fulfillment Logistics Progress
                                            </p>
                                            <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                                                {ORDER_STEP_LABELS[selectedOrder.status?.toLowerCase()] || selectedOrder.status}
                                            </span>
                                        </div>

                                        <div className="relative pt-4 pb-2 px-3 sm:px-5">
                                            {/* Base track line */}
                                            <div className="absolute top-7 left-6 right-6 h-1 bg-slate-200 rounded-full -translate-y-1/2"></div>

                                            {/* Filled active track line */}
                                            {(() => {
                                                const currentIdx = ORDER_STEPS.indexOf(selectedOrder.status?.toLowerCase()) >= 0
                                                    ? ORDER_STEPS.indexOf(selectedOrder.status?.toLowerCase())
                                                    : 0;
                                                const percent = (currentIdx / (ORDER_STEPS.length - 1)) * 100;
                                                return (
                                                    <div
                                                        className="absolute top-7 left-6 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full -translate-y-1/2 transition-all duration-500"
                                                        style={{ width: `calc(${percent}% * 0.88)` }}
                                                    ></div>
                                                );
                                            })()}

                                            {/* Milestone nodes */}
                                            <div className="relative flex items-center justify-between z-10">
                                                {ORDER_STEPS.map((step, idx) => {
                                                    const currentIdx = ORDER_STEPS.indexOf(selectedOrder.status?.toLowerCase());
                                                    const isDone = currentIdx >= idx;
                                                    const isCurrent = currentIdx === idx;

                                                    return (
                                                        <div key={step} className="flex flex-col items-center group">
                                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent
                                                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm'
                                                                : isDone
                                                                    ? 'bg-emerald-500 text-white border-2 border-white'
                                                                    : 'bg-white text-slate-400 border-2 border-slate-200'
                                                                }`}>
                                                                {isCurrent ? (
                                                                    <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                                                                ) : isDone ? (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-slate-400">{idx + 1}</span>
                                                                )}
                                                            </div>

                                                            <span className={`text-[8.5px] sm:text-[9.5px] font-semibold mt-1.5 text-center leading-tight max-w-[60px] sm:max-w-[75px] ${isCurrent ? 'text-emerald-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                                                                }`}>
                                                                {ORDER_STEP_LABELS[step]}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5 text-[11px]">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                                        <span>This order has been cancelled and is no longer tracking.</span>
                                    </div>
                                )}

                                {/* Specs Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Equipment Name</span>
                                        <span className="font-bold text-slate-900 leading-tight block">{selectedOrder.productName}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Load Rating</span>
                                        <span className="font-semibold text-slate-900 block">{selectedOrder.capacity || 'Standard Specification'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Quantity Ordered</span>
                                        <span className="font-semibold text-slate-900 block">{selectedOrder.quantity || 1} Nos</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Total Bill Invoice</span>
                                        <span className="font-bold text-emerald-700 block">
                                            ₹{selectedOrder.price?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Tracking Code</span>
                                        <span className="font-mono font-bold text-blue-600 block">{selectedOrder.trackingNumber || 'Pending dispatch'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Est. Delivery</span>
                                        <span className="font-semibold text-slate-900 block">{selectedOrder.estimatedDelivery || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-medium uppercase text-[8.5px] block mb-0.5">Ordered Date</span>
                                        <span className="font-semibold text-slate-900 block">
                                            {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Delivery Notes */}
                                {selectedOrder.notes && (
                                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                                        <span className="font-medium text-slate-400 uppercase text-[8.5px] block mb-0.5">Customer & Tech Notes</span>
                                        <p className="text-slate-600 italic leading-relaxed font-normal">{selectedOrder.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex items-center justify-between">
                                {selectedOrder.invoiceUrl ? (
                                    <a
                                        href={selectedOrder.invoiceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10.5px] transition-colors inline-flex items-center gap-1.5 no-underline shadow-xs cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Download Invoice ({selectedOrder.invoiceName || 'PDF'})</span>
                                    </a>
                                ) : (
                                    <div className="text-slate-400 text-[10.5px] font-normal italic">
                                        Invoice handled by assigned dealer ({selectedOrder.dealerName || 'Partner Desk'})
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold text-[10.5px] transition-colors cursor-pointer border-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* LOGOUT CONFIRMATION MODAL */}
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                                    <LogOut className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Confirm Sign Out</h3>
                                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">Voltrix Client Portal Session</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 font-normal leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                Are you sure you want to log out? You will need to sign in again to access your fulfillments, quotes, and security dossier.
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutModal(false);
                                        onLogout();
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border-none shadow-xs"
                                >
                                    Yes, Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
