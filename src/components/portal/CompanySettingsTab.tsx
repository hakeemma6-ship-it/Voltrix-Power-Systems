'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Save, Check, AlertCircle } from 'lucide-react';

interface Props {
    onSettingsSaved?: () => void;
}

export default function CompanySettingsTab({ onSettingsSaved }: Props) {
    const [settings, setSettings] = useState<any>({
        companyName: 'Voltrix Power Systems',
        logo: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png',
        address: '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad - 500043',
        phone: '+91 90323 72136 | +91 73867 10160',
        email: 'voltrixpowersystems@gmail.com',
        gstin: '36AEPPI5022R1ZY',
        state: 'Telangana',
        stateCode: '36',
        bankName: 'HDFC Bank',
        accountNumber: '50200088998811',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Voltrix Power Systems',
        branch: 'Gandi Maisamma Branch',
        upiId: 'voltrix@hdfcbank',
        paymentTerms: '50% Advance with order, balance 50% prior to dispatch.',
        deliveryTerms: 'Ex-works Hyderabad. Freight charges extra as applicable.',
        warrantyTerms: '12 months standard warranty against manufacturing defects.',
        returnPolicy: 'Goods once sold cannot be taken back or exchanged.',
        cancellationPolicy: 'Order cancellation requires written approval within 24 hours.',
        authorizedSignatoryName: 'Operations Manager',
        designation: 'Authorized Signatory',
        signatureImage: '/signature.png',
        companyStamp: '/stamp.png'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [err, setErr] = useState('');

    const getHeaders = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('voltrix_auth_token') : '';
        return { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' };
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/settings', { headers: getHeaders() });
                if (res.ok) {
                    const d = await res.json();
                    if (d && d.companyName) {
                        setSettings(d);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setErr('');

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setSuccess(true);
                if (onSettingsSaved) onSettingsSaved();
            } else {
                const d = await res.json();
                setErr(d.error || 'Failed to save settings.');
            }
        } catch {
            setErr('Connection failed.');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full rounded-xl border-2 border-slate-205 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium text-slate-800";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-700" />
                    <h2 className="text-sm font-black uppercase text-[#0A2342] tracking-wider">
                        Company & Business Billing Configuration
                    </h2>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Configure corporate identifiers, bank routing, and print templates.
                </p>
            </div>

            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-650" />
                    <span>Billing & corporate settings configurations saved successfully!</span>
                </div>
            )}

            {err && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{err}</span>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8">

                    {/* Section 1: Corporate Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                            1. Corporate Billing Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Company legal name</label>
                                <input className={inputCls} value={settings.companyName || ''} onChange={e => setSettings({ ...settings, companyName: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">GSTIN Number</label>
                                <input className={inputCls} placeholder="e.g. 36AEPPI5022R1ZY" value={settings.gstin || ''} onChange={e => setSettings({ ...settings, gstin: e.target.value })} required />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Full office Address</label>
                                <input className={inputCls} value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">State</label>
                                    <input className={inputCls} value={settings.state || ''} onChange={e => setSettings({ ...settings, state: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">State Code</label>
                                    <input className={inputCls} value={settings.stateCode || ''} onChange={e => setSettings({ ...settings, stateCode: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Contact Office Phone</label>
                                <input className={inputCls} value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Contact Office Email</label>
                                <input type="email" className={inputCls} value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Company Web URL</label>
                                <input type="url" className={inputCls} value={settings.logo || 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png'} onChange={e => setSettings({ ...settings, logo: e.target.value })} placeholder='https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png' />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Bank details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                            2. Bank Settlement & UPI Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Account Holder Name</label>
                                <input className={inputCls} value={settings.accountHolderName || ''} onChange={e => setSettings({ ...settings, accountHolderName: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Bank Name</label>
                                <input className={inputCls} value={settings.bankName || ''} onChange={e => setSettings({ ...settings, bankName: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Bank Branch</label>
                                <input className={inputCls} value={settings.branch || ''} onChange={e => setSettings({ ...settings, branch: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Account Number</label>
                                <input className={inputCls} value={settings.accountNumber || ''} onChange={e => setSettings({ ...settings, accountNumber: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">IFSC Code</label>
                                <input className={inputCls} value={settings.ifscCode || ''} onChange={e => setSettings({ ...settings, ifscCode: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">UPI VPA ID</label>
                                <input className={inputCls} placeholder="e.g. voltrix@hdfcbank" value={settings.upiId || ''} onChange={e => setSettings({ ...settings, upiId: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Terms & signatory templates */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                            3. default Document Terms & Authorization
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Default Payment Terms</label>
                                <textarea className={`${inputCls} h-20 resize-none`} value={settings.paymentTerms || ''} onChange={e => setSettings({ ...settings, paymentTerms: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Default Delivery & Logistics Terms</label>
                                <textarea className={`${inputCls} h-20 resize-none`} value={settings.deliveryTerms || ''} onChange={e => setSettings({ ...settings, deliveryTerms: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Default Warranty Terms</label>
                                <textarea className={`${inputCls} h-20 resize-none`} value={settings.warrantyTerms || ''} onChange={e => setSettings({ ...settings, warrantyTerms: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Authorized Signatory Name</label>
                                    <input className={inputCls} value={settings.authorizedSignatoryName || ''} onChange={e => setSettings({ ...settings, authorizedSignatoryName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-505 uppercase tracking-wider mb-1">Signatory Designation</label>
                                    <input className={inputCls} value={settings.designation || 'Authorized Signatory'} onChange={e => setSettings({ ...settings, designation: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="h-4.5 w-4.5" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
