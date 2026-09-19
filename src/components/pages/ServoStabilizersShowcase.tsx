/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ServoStabilizersShowcase.tsx
 * Interactive showcase component for Voltrix Servo Stabilizers & CVT products.
 * Features dynamic real-time capacity switching across all 29 variants without page reloads.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2,
  Phone,
  Send,
  X,
  FileText,
  Building,
  Gauge
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/image';
import {
  productDatabase,
  masterConfig,
  MasterProductConfig,
  ProductVariantData,
  getFormattedTitle,
  getProductVariant
} from '../../data/servoProductsData';

interface ServoStabilizersShowcaseProps {
  onNavigate: (hash: string) => void;
  dealerSession?: any;
  customerSession?: any;
  adminSession?: any;
  initialProductId?: string;
  showBreadcrumb?: boolean;
}

export default function ServoStabilizersShowcase({
  onNavigate,
  dealerSession,
  customerSession,
  adminSession,
  initialProductId,
  showBreadcrumb = true
}: ServoStabilizersShowcaseProps) {
  // Active filter tab: 'all' | 'oil-master' | 'air-master' | 'iso-master' | 'cvt-master'
  const [activeFilter, setActiveFilter] = useState<string>(initialProductId || 'all');

  // Track active variant key per product: { 'oil-master': 100, 'air-master': 10, ... }
  const [activeVariants, setActiveVariants] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    Object.keys(masterConfig).forEach(id => {
      initial[id] = masterConfig[id].defaultVariant;
    });
    return initial;
  });

  // Track image loading state per product for smooth visual transition
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  // Track card expansion state for details (specs & features)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'oil-master': true,
    'air-master': true,
    'iso-master': true,
    'cvt-master': true
  });

  // Quote Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<{
    productId: string;
    variantKey: number | string;
    title: string;
    specs: any[];
    image: string;
  } | null>(null);

  const [quoteForm, setQuoteForm] = useState({
    name: customerSession?.name || dealerSession?.name || adminSession?.name || '',
    phone: customerSession?.phone || dealerSession?.phone || adminSession?.phone || '',
    email: customerSession?.email || dealerSession?.email || adminSession?.email || '',
    company: customerSession?.companyName || dealerSession?.companyName || '',
    location: '',
    quantity: 1,
    message: ''
  });

  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);
  const [quoteErrorMsg, setQuoteErrorMsg] = useState<string | null>(null);

  // Handle selecting a capacity variant
  const handleVariantSelect = (productId: string, variantKey: number | string) => {
    setActiveVariants(prev => ({
      ...prev,
      [productId]: variantKey
    }));
    setImageLoading(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const toggleCardExpansion = (productId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleOpenQuoteModal = (productId: string) => {
    const variantKey = activeVariants[productId];
    const data = getProductVariant(productId, variantKey);
    const title = getFormattedTitle(productId, variantKey);
    if (!data) return;

    setQuoteProduct({
      productId,
      variantKey,
      title,
      specs: data.specs,
      image: resolveImageUrl(data.image)
    });
    setQuoteSuccessMsg(null);
    setQuoteErrorMsg(null);
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteProduct) return;
    if (!quoteForm.name || !quoteForm.phone) {
      setQuoteErrorMsg('Please fill in your Contact Name and Phone number.');
      return;
    }

    setIsSubmittingQuote(true);
    setQuoteErrorMsg(null);

    const payload = {
      name: quoteForm.name,
      phone: quoteForm.phone,
      email: quoteForm.email || 'not-provided@voltrixpower.com',
      companyName: quoteForm.company,
      subject: `Quotation Request: ${quoteProduct.title}`,
      message: `${quoteForm.message ? quoteForm.message + '\n\n' : ''}Requested Capacity: ${quoteProduct.variantKey} KVA (${quoteProduct.title})\nQuantity: ${quoteForm.quantity}\nLocation: ${quoteForm.location || 'Not specified'}`,
      location: quoteForm.location || 'India',
      productInterest: quoteProduct.title,
      productCategory: 'Servo Stabilizers'
    };

    try {
      const resp = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await resp.json();
      if (!resp.ok) throw new Error(resData.error || 'Failed to submit quote request.');
      setQuoteSuccessMsg(`Your quotation request has been recorded! Reference Ticket ID: ${resData.id}. An engineer will reach out with technical pricing.`);
      setTimeout(() => {
        setQuoteModalOpen(false);
        setQuoteSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      setQuoteErrorMsg(err.message || 'An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Products to render based on active filter
  const productKeys = useMemo(() => {
    if (activeFilter === 'all') {
      return Object.keys(masterConfig);
    }
    return [activeFilter].filter(k => masterConfig[k]);
  }, [activeFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans text-slate-900" id="servo-stabilizers-container">
      {/* Top Breadcrumb & Actions */}
      {showBreadcrumb && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <button
              onClick={() => onNavigate('#categories')}
              className="text-slate-500 hover:text-brand-green transition-colors bg-transparent border-none cursor-pointer p-0 font-bold"
            >
              Categories
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-[#0A2342] font-black">Servo Stabilizers & Transformer Suite</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('#products')}
              className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Full Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-10 text-left bg-gradient-to-r from-slate-900 via-[#0A2342] to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Gauge className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Voltrix Precision Power Systems</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight">
            Servo Controlled Voltage Stabilizers & Transformers
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Microprocessor-controlled dynamic voltage stabilization for industrial plants, medical diagnostic scanners, data centers, and commercial infrastructure. Choose from 29 certified KVA capacities below with instant real-time specifications and customized quote generation.
          </p>
        </div>

        {/* Live Quick Stats Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Products</p>
            <p className="text-lg sm:text-xl font-extrabold text-white">4 Master Series</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Total Variants</p>
            <p className="text-lg sm:text-xl font-extrabold text-brand-green">29 KVA Ratings</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Capacity Span</p>
            <p className="text-lg sm:text-xl font-extrabold text-white">1 KVA - 500 KVA</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Regulation Speed</p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-400">&gt; 35V to 60V / Sec</p>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills (Sticky Filter) */}
      <div className="sticky top-16 lg:top-14 z-30 bg-white/95 backdrop-blur-md py-3 mb-8 border-y border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full text-left">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-nav-link shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-[#0A2342] text-white border-[#0A2342] shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All Products (29 Variants)
          </button>
          {Object.keys(masterConfig).map(id => {
            const cfg = masterConfig[id];
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                className={`p-nav-link shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-green text-white border-brand-green shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{cfg.baseTitle.split(' ')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 font-mono">
                  {cfg.variants.length > 0 ? `${cfg.variants.length}` : '1'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Products Cards Grid */}
      <div className="space-y-12">
        {productKeys.map(productId => {
          const config = masterConfig[productId];
          const activeVariantKey = activeVariants[productId] || config.defaultVariant;
          const currentData = getProductVariant(productId, activeVariantKey);
          const isExpanded = expandedCards[productId] !== false;

          if (!currentData) return null;

          const activePower = currentData.specs.find(s => s.label === 'Power')?.value || `${activeVariantKey} KVA`;
          const dynamicTitle = `${activePower} ${config.baseTitle}`;
          const currentImgUrl = resolveImageUrl(currentData.image);

          return (
            <div
              key={productId}
              id={productId}
              className="product-card product-category bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-300 shadow-sm transition-all overflow-hidden text-left"
            >
              {/* Product Card Top Bar */}
              <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black uppercase tracking-widest text-brand-green bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                    {config.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ID: {productId}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCardExpansion(productId)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition"
                    title="Toggle details section"
                  >
                    <span>{isExpanded ? 'Collapse Specs' : 'Expand Specs'}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenQuoteModal(productId)}
                    className="pc-quote-btn px-4 py-1.5 rounded-lg bg-brand-green hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Request Quote</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Product Layout: 12-col responsive split */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Image with dynamic update & preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="pc-image relative w-full h-64 sm:h-80 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden flex items-center justify-center p-4 group">
                    <img
                      src={currentImgUrl}
                      alt={dynamicTitle}
                      loading="lazy"
                      onLoad={() => setImageLoading(prev => ({ ...prev, [productId]: false }))}
                      onError={(e) => {
                        setImageLoading(prev => ({ ...prev, [productId]: false }));
                        const target = e.currentTarget;
                        if (!target.src.includes('Oil%20Cooled') && !target.src.includes('Stabilizer')) {
                          target.src = '/Images/Oil Cooled Stabilizer.png';
                        }
                      }}
                      className={`max-h-full max-w-full object-contain transition-all duration-300 group-hover:scale-105 ${
                        imageLoading[productId] ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
                      }`}
                    />

                    {/* Active Capacity Indicator Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold text-[#0A2342] shadow-xs">
                      {activePower}
                    </div>

                    {/* Cooling Badge */}
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {currentData.specs.find(s => s.label === 'Cooling')?.value || 'Active Regulation'}
                    </div>
                  </div>

                  {/* Quick Summary Note */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* Right Column: Dynamic Title, Variant Selector, Specs & Features */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Dynamic Product Title & Subtitle */}
                  <div className="space-y-1.5 border-b border-slate-100 pb-4">
                    <h2 className="pc-title text-xl sm:text-2xl lg:text-3xl font-black text-[#0A2342] uppercase tracking-tight transition-all duration-200">
                      {dynamicTitle}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {config.subtitle}
                    </p>
                  </div>

                  {/* KVA Capacity Selector (The Core Requirement) */}
                  <div className="space-y-2.5 bg-slate-50/90 border border-slate-200/90 p-4 sm:p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-brand-green" />
                        <span>Select KVA Capacity Rating:</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-brand-green">
                        Active: {activePower}
                      </span>
                    </div>

                    {config.variants.length > 0 ? (
                      <div
                        id={config.gridId || undefined}
                        className="variant-grid flex flex-wrap gap-2 pt-1"
                      >
                        {config.variants.map((v) => {
                          const isSelected = String(activeVariantKey) === String(v);
                          return (
                            <button
                              key={String(v)}
                              type="button"
                              onClick={() => handleVariantSelect(productId, v)}
                              className={`variant-btn min-w-[54px] px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer border ${
                                isSelected
                                  ? 'active bg-brand-green text-white border-brand-green shadow-md scale-105 font-black ring-2 ring-emerald-300/50'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {v} <span className="text-[9px] font-sans font-normal opacity-80">kVA</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-brand-green" />
                        <span>Standard 1 KVA Single Configuration</span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Specifications & Features Area */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6 pt-2 overflow-hidden"
                      >
                        {/* Features & Highlights */}
                        <div className="features-list bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-2 border-brand-green pl-2.5 font-sans">
                            Engineered Highlights & Protection
                          </h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 list-none p-0 m-0">
                            {currentData.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Specifications Table */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-l-2 border-brand-green pl-2.5 font-sans">
                              Technical Parameters
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              ISO 9001 / IS Standards
                            </span>
                          </div>

                          <div className="specs-table border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <tbody>
                                {currentData.specs.map((spec, idx) => (
                                  <tr
                                    key={idx}
                                    className={`border-b border-slate-150 transition-colors ${
                                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                                    } hover:bg-emerald-50/50`}
                                  >
                                    <th className="py-2.5 px-4 font-bold text-slate-600 w-2/5 border-r border-slate-150 text-[11.5px]">
                                      {spec.label}
                                    </th>
                                    <td className="py-2.5 px-4 font-semibold text-slate-800 text-[12px]">
                                      {spec.value}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Bottom CTA Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="pc-price text-xs font-mono text-slate-500">
                      Pricing: <strong className="text-slate-900 text-sm">{currentData.price === 'Request Quote' ? 'Custom B2B Quotation' : 'Custom Sized To Order'}</strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenQuoteModal(productId)}
                        className="px-5 py-2.5 rounded-xl bg-[#0A2342] hover:bg-[#123966] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all border-none cursor-pointer flex items-center gap-2"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Request Official Quotation ({activePower})</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote Request Modal */}
      <AnimatePresence>
        {quoteModalOpen && quoteProduct && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="bg-[#0A2342] text-white p-6 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-300">
                    B2B Official Quotation Form
                  </span>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mt-1 text-white">
                    {quoteProduct.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Capacity: <strong>{quoteProduct.variantKey} KVA</strong> &bull; Factory Dispatch Available Across India
                  </p>
                </div>
                <button
                  onClick={() => setQuoteModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border-none cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {quoteSuccessMsg ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-emerald-900 uppercase tracking-tight">Request Received</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{quoteSuccessMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={handleQuoteSubmit} className="space-y-4">
                    {quoteErrorMsg && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                        {quoteErrorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={quoteForm.name}
                          onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                          placeholder="Full Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={quoteForm.phone}
                          onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Email Address</label>
                        <input
                          type="email"
                          value={quoteForm.email}
                          onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                          placeholder="name@company.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Company / Plant Name</label>
                        <input
                          type="text"
                          value={quoteForm.company}
                          onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                          placeholder="e.g. Acme Industries Ltd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Delivery City / State</label>
                        <input
                          type="text"
                          value={quoteForm.location}
                          onChange={(e) => setQuoteForm({ ...quoteForm, location: e.target.value })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                          placeholder="e.g. Hyderabad, Telangana"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={quoteForm.quantity}
                          onChange={(e) => setQuoteForm({ ...quoteForm, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Site Requirements / Technical Notes</label>
                      <textarea
                        rows={3}
                        value={quoteForm.message}
                        onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                        placeholder="Mention any custom input voltage range, bypass requirements, ambient conditions, or urgency..."
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setQuoteModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingQuote}
                        className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer border-none flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{isSubmittingQuote ? 'Submitting...' : 'Send Quotation Request'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
