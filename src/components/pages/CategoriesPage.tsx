/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Layers, ShieldCheck,
  Cpu, Battery, Sun, Zap, CheckCircle2, Wrench,
  Clock, Shield, Heart, Check, Building, FileText,
  User, Mail, Phone, Calendar, AlertCircle, Settings
} from 'lucide-react';
import { Category } from '../../data/categoriesData';
import { resolveImageUrl } from '../../utils/image';

const getCategoryGradient = (slug: string) => {
  switch (slug) {
    case 'amc-services':
      return 'from-teal-600/20 via-teal-600/5 to-transparent';
    case 'solar-panels':
      return 'from-blue-600/20 via-blue-600/5 to-transparent';
    case 'batteries':
      return 'from-emerald-600/20 via-emerald-600/5 to-transparent';
    case 'inverter':
      return 'from-amber-600/20 via-amber-600/5 to-transparent';
    case 'stabilizers':
      return 'from-indigo-600/20 via-indigo-600/5 to-transparent';
    case 'ups':
      return 'from-rose-600/20 via-rose-600/5 to-transparent';
    default:
      return 'from-slate-600/15 via-slate-600/5 to-transparent';
  }
};

interface CategoriesPageProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
}

export default function CategoriesPage({ currentHash, onNavigate }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/categories')
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(err => {
        console.error("Error loading categories:", err);
        setCategories([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // If hash is exactly "#categories" or "#categories/", show the 5 main categories
  const isSubcategoryView = currentHash.startsWith('#categories/');
  const activeSlug = isSubcategoryView ? currentHash.replace('#categories/', '') : null;
  const activeCategory = categories.find(cat => cat.slug === activeSlug);

  if (isSubcategoryView && !isLoading && !activeCategory) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4 font-sans">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-[#0A2342] uppercase tracking-tight">Data Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested category <span className="font-mono font-bold text-slate-700">&quot;{activeSlug}&quot;</span> could not be found in our database.
        </p>
        <button
          onClick={() => onNavigate('#categories')}
          className="px-6 py-2.5 bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer border-none"
        >
          Back to Categories
        </button>
      </div>
    );
  }


  if (isLoading) {
    if (isSubcategoryView) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 font-sans animate-pulse">
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-3 flex-grow text-left">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-200 rounded-lg shrink-0"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <div className="h-12 bg-slate-200 rounded-lg w-full sm:w-48"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="h-40 w-full bg-slate-100 border-b border-slate-100" />
                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-3 text-left">
                    <div className="h-5 bg-slate-200 rounded-lg w-2/3" />
                    <div className="space-y-2 col-span-full">
                      <div className="h-3.5 bg-slate-200 rounded-md w-[90%]" />
                      <div className="h-3.5 bg-slate-200 rounded-md w-[75%]" />
                    </div>
                    <div className="pt-4 border-t border-dashed border-slate-200 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-20" />
                      <div className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                        <div className="h-3 w-28 bg-slate-200 rounded" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="h-9 bg-slate-200 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Master Categories page skeleton loading state
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 font-sans animate-pulse" id="categories-page-loading">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 flex flex-col items-center">
          <div className="h-5 bg-slate-200 rounded-full w-24"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-2/3 sm:w-1/2"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-3xl bg-slate-100 aspect-[3/4] xs:aspect-[10/13] sm:aspect-[4/5] border border-slate-200/60"
            >
              <div className="p-3 xs:p-4 sm:p-6 flex flex-col justify-between h-full text-left">
                <div className="flex justify-between items-start col-span-full">
                  <div className="h-4 sm:h-5 bg-slate-200 rounded-full w-14 sm:w-20" />
                  <div className="h-7 w-7 sm:h-10 sm:w-10 bg-slate-200 rounded-xl" />
                </div>
                <div className="space-y-3 col-span-full">
                  <div className="space-y-2 col-span-full">
                    <div className="h-4 sm:h-6 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-3 sm:h-4 bg-slate-200 rounded-lg w-[85%] hidden xs:block" />
                    <div className="h-3 sm:h-4 bg-slate-200 rounded-lg w-1/2 hidden xs:block" />
                  </div>
                  <div className="pt-2 sm:pt-4 border-t border-slate-200/60 flex items-center justify-between col-span-full">
                    <div className="h-3 bg-slate-200 rounded w-16 sm:w-24" />
                    <div className="h-3 bg-slate-200 rounded w-10 sm:w-14" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Map category icons helper
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'amc-services': return Wrench;
      case 'inverter': return Zap;
      case 'stabilizers': return ShieldCheck;
      case 'ups': return Cpu;
      case 'batteries': return Battery;
      case 'solar-panels': return Sun;
      default: return Layers;
    }
  };

  // Map category images helper to local premium assets
  const getCategoryImage = (slug: string) => {
    switch (slug) {
      case 'amc-services': return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
      case 'inverter': return "https://res.cloudinary.com/a6ppmzjz/image/upload/v1785436657/voltrix_power_systems/category_inverter.png";
      case 'stabilizers': return "https://res.cloudinary.com/a6ppmzjz/image/upload/v1786926912/voltrix_power_systems/category_stabilizer.png";
      case 'ups': return "https://res.cloudinary.com/a6ppmzjz/image/upload/v1786927626/voltrix_power_systems/category_ups.png";
      case 'batteries': return "https://res.cloudinary.com/a6ppmzjz/image/upload/v1785436661/voltrix_power_systems/category_batteries.png";
      case 'solar-panels': return "https://res.cloudinary.com/a6ppmzjz/image/upload/v1786927726/voltrix_power_systems/category_solar_panels.png";
      default: return '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (isSubcategoryView && activeCategory) {
    if (activeCategory.slug === 'amc-services') {
      return (
        <AmcServicesOverview
          activeCategory={activeCategory}
          onNavigate={onNavigate}
        />
      );
    }

    const categoryProducts = activeCategory.products || [];

    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 font-sans" id="subcategory-view-section">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('#categories')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-brand-green transition-colors bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Categories</span>
            </button>
            <div className="flex items-center gap-3">
              {React.createElement(getCategoryIcon(activeCategory.slug), { className: "h-8 w-8 text-brand-green" })}
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#0A2342] sm:text-4xl">
                {activeCategory.name} <span className="text-neutral-500">Portfolio</span>
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {activeCategory.description}
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('#products')}
              className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-blue-900 to-[#0A2342] hover:bg-[#123966] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              <span>View All Products Flat List</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-20 border border-slate-200 rounded-3xl bg-white shadow-xs p-8 max-w-xl mx-auto space-y-3 font-sans">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Data Not Found</h3>
            <p className="text-slate-500 text-xs">
              No products currently found in the database for {activeCategory.name}.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('#categories')}
              className="mt-3 px-5 py-2.5 bg-[#0A2342] hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer border-none"
            >
              Back to Categories
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categoryProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="relative bg-white rounded-2xl border-2  shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col transition-all group"
              >
                {/* Product Image */}
                {product.image && (
                  <div className="h-40 w-full overflow-hidden relative bg-white border-b border-slate-100 z-10 shrink-0">
                    <img
                      src={resolveImageUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('Oil%20Cooled') && !target.src.includes('Stabilizer')) {
                          target.src = 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866584/voltrix_power_systems/Oil_Cooled_Stabilizer.png';
                        }
                      }}
                      className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="p-6 flex-grow flex flex-col justify-between relative z-10">
                  <div>
                    <h3 className="font-sans font-black text-lg text-[#0A2342] mb-2 uppercase tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {product.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="text-[10px] uppercase font-mono font-black text-slate-400 border-b border-dashed border-slate-200 pb-1">
                        Technical Specs Highlight
                      </div>
                      {product.specs && Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-400 font-medium">{key}:</span>
                          <span className="text-[#0a2342] font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => {
                        // Navigate to flat products list and trigger product selection
                        onNavigate(`#products/${product.id}`);
                      }}
                      className="h-9 px-4 w-full bg-brand-green hover:bg-green-100 hover:text-black rounded text-xs font-bold uppercase tracking-wider text-white font-sans cursor-pointer transition-all border-none flex items-center justify-center gap-1.5"
                    >
                      <span>View Specifications</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // RENDER: Master Categories screen showing the 5 options
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 font-sans" id="categories-page-root">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0A2342] sm:text-5xl uppercase">
          Explore Our <span className="text-brand-green">Power Categories</span>
        </h1>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 border border-slate-200 rounded-3xl bg-white shadow-xs p-8 max-w-xl mx-auto space-y-3 font-sans">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Data Not Found</h3>
          <p className="text-slate-500 text-xs">
            No categories currently available in the database.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map((cat) => {
            const CatIcon = getCategoryIcon(cat.slug);
            const catImg = getCategoryImage(cat.slug) || cat.image;
            const imgSrc = catImg && typeof catImg === 'object' && 'src' in (catImg as any) ? (catImg as any).src : (catImg || '');
            const prodCount = (cat.products || []).length;
            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                onClick={() => onNavigate(`#categories/${cat.slug}`)}
                className="group relative overflow-hidden rounded-3xl bg-slate-950 aspect-[3/4] xs:aspect-[10/13] sm:aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-800/80 cursor-pointer animate-fade-in"
              >
                {/* Glow Accent Border */}
                <div className="absolute -inset-px rounded-3xl border border-transparent group-hover:border-emerald-500/25 transition-all duration-300 z-30 pointer-events-none" />

                {/* Background Image Banner */}
                <img
                  src={imgSrc}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-60 group-hover:opacity-75 z-0"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Dynamic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-900/10 z-10 transition-all duration-500" />

                {/* Card Contents */}
                <div className="relative z-20 h-full p-3 xs:p-4 sm:p-6 flex flex-col justify-between text-left">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <span className="text-[7.5px] xs:text-[9.5px] sm:text-xs font-bold text-white tracking-widest uppercase bg-brand-green px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                      {cat.slug === 'amc-services' ? 'Services' : 'Category'}
                    </span>
                    <div className="p-1.5 sm:p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-emerald-450 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <CatIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                  </div>

                  {/* Footer Details Info */}
                  <div>
                    <div className="space-y-1 sm:space-y-2">
                      <h2 className="text-xs xs:text-base sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors duration-300 leading-tight">
                        {cat.name}
                      </h2>
                      <p className="hidden xs:block line-clamp-2 text-[9.5px] sm:text-xs text-slate-300 leading-relaxed font-normal">
                        {cat.description}
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-4 mt-2 sm:mt-4 border-t border-white/10 flex items-center justify-between text-[6.5px] xs:text-[9px] sm:text-xs select-none">
                      <span className="font-mono text-slate-400 font-bold uppercase tracking-wider">
                        {prodCount} <span className="hidden xs:inline">PORTFOLIO</span> SIZES
                      </span>
                      <span className="text-emerald-400 group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-0.5 sm:gap-1 font-black uppercase text-[7px] xs:text-[9px] sm:text-[11px]">
                        <span>SELECT</span>
                        <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 stroke-[2.5]" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

interface AmcServicesOverviewProps {
  activeCategory: Category;
  onNavigate: (hash: string) => void;
}

function AmcServicesOverview({ activeCategory, onNavigate }: AmcServicesOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = (activeCategory.products || []).filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans animate-fade-in" id="amc-overview-section">
      {/* 1. Breadcrumbs & Return */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('#categories')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-brand-green transition-colors bg-transparent border-none cursor-pointer self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Categories</span>
        </button>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 uppercase tracking-widest px-3 py-1 rounded">
          After-Sales Division / Engineering Services
        </span>
      </div>

      {/* 2. Premium Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0A2342] sm:text-5xl uppercase">
          Our Professional <span className="text-brand-green">Services & AMC</span>
        </h1>
        <p className="text-sm text-slate-650 max-w-2xl mx-auto leading-relaxed">
          Voltrix Systems provides premium maintenance, expert repair, and Annual Maintenance Contracts (AMC) to safeguard your power infrastructure. Select from our 14 certified services to book a technician.
        </p>
      </div>

      {/* 3. Services Search Block */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 uppercase tracking-widest px-2.5 py-1 rounded">
            Services Catalog
          </span>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#0A2342] mt-2">
            Available Programs ({activeCategory.products.length} Services)
          </h2>
        </div>
        <div className="w-full md:w-80 shrink-0 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services (e.g. UPS, Inverter, troubleshooting)..."
            className="w-full text-xs bg-white border border-slate-250 focus:border-[#0a2342] text-slate-800 py-3 px-4 rounded-xl font-semibold outline-none transition-all placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* 4. Specialized Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-extrabold text-[#0A2342] uppercase text-sm">No services matched search</h4>
          <p className="text-xs text-slate-400">Try searching for other terms like Battery, Preventive or Support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((product) => (
            <div
              key={product.id}
              onClick={() => onNavigate(`#products/${product.id}`)}
              className="bg-white rounded-3xl border-2 border-slate-105 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-6 sm:p-7 flex flex-col justify-between hover:border-brand-green/30 transition-all duration-300 cursor-pointer group text-left relative overflow-hidden"
            >
              {/* Subtle top brand band indicator */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#0F9D58]/10 to-transparent group-hover:via-[#0F9D58]/60 transition-all duration-300" />

              <div>
                <h3 className="font-sans font-black text-md sm:text-lg text-[#0A2342] mb-3 uppercase tracking-tight group-hover:text-brand-green transition-colors flex items-center justify-between gap-2.5">
                  <span>{product.name}</span>
                  <Wrench className="h-5 w-5 text-slate-350 group-hover:text-[#0F9D58] transition-colors shrink-0" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 h-12 line-clamp-3">
                  {product.description}
                </p>

                <div className="space-y-2 mb-6">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs border-b border-dashed border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-medium">{key}:</span>
                      <span className="text-[#0a2342] font-semibold text-right truncate pl-2">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {product.features.map((feature, fIdx) => (
                    <span key={fIdx} className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2.5 py-0.5 rounded-full leading-none shadow-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-brand-green font-extrabold uppercase select-none">
                <span className="text-[10px] text-slate-400 tracking-wider font-semibold">Service Booking</span>
                <span className="group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1">
                  <span>Book Service</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2]" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
