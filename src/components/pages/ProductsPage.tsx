/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, ShieldCheck, ArrowLeft,
  ChevronRight, BadgeInfo, AlertCircle,
  Send, CheckCircle2, SlidersHorizontal,
  Gauge, Zap, X, Lock, User, Mail, Phone, Building, MapPin, Eye, EyeOff, FileText, Sparkles
} from 'lucide-react';
import { SubCategoryProduct, Category } from '../../data/categoriesData';
import { resolveImageUrl } from '../../utils/image';
import {
  masterConfig,
  getProductVariant
} from '../../data/servoProductsData';

const getCategoryGradient = (slug: string) => {
  switch (slug) {
    case 'solar-panels':
      return 'from-blue-600/10 via-blue-600/5 to-transparent';
    case 'batteries':
      return 'from-emerald-600/10 via-emerald-600/5 to-transparent';
    case 'inverter':
      return 'from-amber-600/10 via-amber-600/5 to-transparent';
    case 'stabilizers':
      return 'from-indigo-600/10 via-indigo-600/5 to-transparent';
    case 'ups':
      return 'from-rose-600/10 via-rose-600/5 to-transparent';
    case 'amc-services':
      return 'from-teal-600/10 via-teal-600/5 to-transparent';
    default:
      return 'from-slate-600/10 via-slate-600/5 to-transparent';
  }
};

const COUNTRIES_AND_STATES: Record<string, string[]> = {
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'
  ],
  'Australia': [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
  ]
};

const detectCountryByTimezone = () => {
  if (typeof window === 'undefined') return 'India';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return 'India';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.startsWith('Asia/Delhi') || tz.startsWith('Asia/Kolkata')) {
      return 'India';
    }
    if (tz.startsWith('America/')) {
      return 'United States';
    }
    if (tz.startsWith('Europe/London') || tz.startsWith('Europe/Belfast') || tz.startsWith('Europe/Dublin') || tz.startsWith('GB')) {
      return 'United Kingdom';
    }
    if (tz.startsWith('Australia/')) {
      return 'Australia';
    }
    if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal') || tz.startsWith('America/Edmonton')) {
      return 'Canada';
    }
  } catch (e) {
    console.warn("Timezone detection failed, defaulting to India", e);
  }
  return 'India';
};

interface ProductsPageProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  dealerSession?: any;
  customerSession?: any;
  adminSession?: any;
  onCustomerLogin?: (customer: any) => void;
}

export default function ProductsPage({
  currentHash,
  onNavigate,
  dealerSession,
  customerSession,
  adminSession,
  onCustomerLogin
}: ProductsPageProps) {
  const [currentUser, setCurrentUser] = useState<any>(customerSession || dealerSession || adminSession || null);

  useEffect(() => {
    setCurrentUser(customerSession || dealerSession || adminSession || null);
  }, [customerSession, dealerSession, adminSession]);

  const isLoggedIn = !!currentUser;

  const isProductSelectedByHash = currentHash.includes('#products/') && currentHash !== '#products';
  const queryProductSlug = isProductSelectedByHash ? currentHash.split('#products/')[1] : null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<SubCategoryProduct | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [activeServoVariant, setActiveServoVariant] = useState<number | string | null>(null);

  const [orderForm, setOrderForm] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    quantity: 1,
    capacityRating: '',
    notes: '',
    addressLine1: '',
    addressLine2: '',
    zipcode: '',
    city: '',
    state: '',
    country: 'India'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');

  // Modal & Auth State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState<'none' | 'login' | 'register'>('none');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dealers')
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDealers(data);
          const approved = data.filter((d: any) => d.status === 'approved');
          if (approved.length > 0) {
            setSelectedDealerId(approved[0].id);
          }
        }
      })
      .catch(err => console.error("Error fetching dealers:", err));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Error loading categories:", err))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const allFlattenedProducts = useMemo(() => {
    return categories.reduce<Array<SubCategoryProduct & { parent: Category }>>((acc, cat) => {
      const prods = cat.products || [];
      const productsWithCategory = prods.map(p => ({ ...p, parent: cat }));
      return [...acc, ...productsWithCategory];
    }, []);
  }, [categories]);

  useEffect(() => {
    if (queryProductSlug) {
      const match = allFlattenedProducts.find(p => p.id === queryProductSlug);
      if (match) {
        setSelectedProduct(match);
        setParentCategory(match.parent);
        const isServo = !!masterConfig[match.id];
        const initialVariant = isServo ? masterConfig[match.id].defaultVariant : null;
        setActiveServoVariant(initialVariant);
        const servoVariantData = isServo && initialVariant !== null ? getProductVariant(match.id, initialVariant) : null;
        const initialCapacityRating = servoVariantData?.specs.find(s => s.label === 'Power')?.value ||
          match.specs["Capacity"] || match.specs["Rating"] || match.specs["Power"] || match.specs["Size Range"] || 'Standard Size';

        setOrderForm(prev => ({
          ...prev,
          fullName: dealerSession?.name || customerSession?.name || adminSession?.name || '',
          companyName: dealerSession?.companyName || customerSession?.companyName || adminSession?.companyName || '',
          phone: dealerSession?.phone || customerSession?.phone || adminSession?.phone || '',
          email: dealerSession?.email || customerSession?.email || adminSession?.email || '',
          capacityRating: initialCapacityRating
        }));
        setSubmitSuccess(null);
        setSubmitError(null);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      setSelectedProduct(null);
      setParentCategory(null);
      setActiveServoVariant(null);
    }
  }, [queryProductSlug, allFlattenedProducts, dealerSession, customerSession, adminSession]);

  useEffect(() => {
    // Detect on mount
    const initialCountry = detectCountryByTimezone();
    setOrderForm(prev => ({
      ...prev,
      country: initialCountry,
      state: ''
    }));

    // Next, attempt IP-based detection for more accuracy
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_name) {
          const detected = data.country_name;
          if (COUNTRIES_AND_STATES[detected]) {
            setOrderForm(prev => ({ ...prev, country: detected, state: '' }));
          }
        }
      })
      .catch(err => {
        console.warn("IP-based country detection failed, keeping timezone default", err);
      });
  }, []);

  const executeInquirySubmission = async (tokenOverride?: string, userOverride?: any) => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const addressParts = [
      orderForm.addressLine1,
      orderForm.addressLine2,
      orderForm.city,
      orderForm.state,
      orderForm.country
    ].filter(Boolean);
    const addressStr = addressParts.join(', ') + (orderForm.zipcode ? ` - ${orderForm.zipcode}` : '');

    const effectiveUser = userOverride || currentUser;
    const token = tokenOverride || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const payload = {
      name: orderForm.fullName || effectiveUser?.name || '',
      companyName: orderForm.companyName || effectiveUser?.companyName || '',
      phone: orderForm.phone || effectiveUser?.phone || '',
      email: orderForm.email || effectiveUser?.email || '',
      subject: `Product Inquiry: ${selectedProduct.name}`,
      message: orderForm.notes || "No extra notes provided.",
      location: addressStr,
      addressLine1: orderForm.addressLine1,
      addressLine2: orderForm.addressLine2,
      zipcode: orderForm.zipcode,
      city: orderForm.city,
      state: orderForm.state,
      country: orderForm.country,
      productInterest: selectedProduct.name,
      productCategory: parentCategory?.name || '',
      quantity: orderForm.quantity || 1,
      capacityRating: orderForm.capacityRating || 'Standard Size',
      dealerId: selectedDealerId || undefined
    };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const resp = await fetch('/api/inquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to submit inquiry.");
      }
      const data = await resp.json();
      setSubmitSuccess(data);
      setAuthStep('none');
      setAuthPassword('');
      setAuthConfirmPassword('');
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected network issue occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!orderForm.fullName || !orderForm.phone || !orderForm.email) {
      setSubmitError("Please fill out required fields (Name, Phone & Email).");
      return;
    }
    if (!orderForm.addressLine1 || !orderForm.zipcode || !orderForm.city || !orderForm.state || !orderForm.country) {
      setSubmitError("Please fill out all required address fields.");
      return;
    }
    setSubmitError(null);

    if (isLoggedIn) {
      executeInquirySubmission();
    } else {
      setAuthStep('login');
    }
  };

  const handleAuthAndSubmit = async (mode: 'login' | 'register') => {
    setAuthError(null);
    if (!authPassword) {
      setAuthError("Please enter your password.");
      return;
    }
    if (mode === 'register' && authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    try {
      if (mode === 'register') {
        const addressParts = [
          orderForm.addressLine1,
          orderForm.addressLine2,
          orderForm.city,
          orderForm.state,
          orderForm.country
        ].filter(Boolean);
        const addressStr = addressParts.join(', ') + (orderForm.zipcode ? ` - ${orderForm.zipcode}` : '');

        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'customer',
            name: orderForm.fullName,
            email: orderForm.email,
            phone: orderForm.phone,
            password: authPassword,
            confirmPassword: authConfirmPassword,
            businessName: orderForm.companyName || undefined,
            address: addressStr
          })
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok || !signupData.success) {
          throw new Error(signupData.error || "Failed to create account.");
        }
        if (signupData.token) {
          localStorage.setItem('token', signupData.token);
          localStorage.setItem('role', 'customer');
        }
        const newUser = signupData.user;
        setCurrentUser(newUser);
        if (onCustomerLogin) {
          onCustomerLogin(newUser);
        }
        await executeInquirySubmission(signupData.token, newUser);
      } else {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: orderForm.email || orderForm.phone,
            password: authPassword
          })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok || !loginData.success) {
          throw new Error(loginData.error || "Invalid credentials. If you don't have an account, please switch to 'Create Account'.");
        }
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('role', loginData.user?.role || 'customer');
        }
        const loggedUser = loginData.user;
        setCurrentUser(loggedUser);
        if (loggedUser.role === 'customer' && onCustomerLogin) {
          onCustomerLogin(loggedUser);
        }
        await executeInquirySubmission(loginData.token, loggedUser);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCloseDetails = () => {
    onNavigate('#products');
  };

  const filteredProducts = allFlattenedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.parent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || p.parent.slug === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isServo = selectedProduct ? !!masterConfig[selectedProduct.id] : false;
  const servoCfg = isServo && selectedProduct ? masterConfig[selectedProduct.id] : null;
  const activeVar = activeServoVariant !== null ? activeServoVariant : (servoCfg ? servoCfg.defaultVariant : null);
  const servoData = (isServo && selectedProduct && activeVar !== null) ? getProductVariant(selectedProduct.id, activeVar) : null;

  const displayImage = servoData ? resolveImageUrl(servoData.image) : selectedProduct?.image;
  const displayPower = servoData?.specs.find(s => s.label === 'Power')?.value || (activeVar ? `${activeVar} KVA` : '');
  const displayTitle = (isServo && servoCfg && displayPower)
    ? `${displayPower} ${servoCfg.baseTitle}`
    : (selectedProduct?.name || '');
  const displayFeatures = servoData ? servoData.features : (selectedProduct?.features || []);
  const displaySpecs: Record<string, string> = servoData
    ? Object.fromEntries(servoData.specs.map(s => [s.label, s.value]))
    : (selectedProduct?.specs || {});

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6 lg:px-8 font-sans" id="products-catalog-section">
      <AnimatePresence mode="wait">
        {!selectedProduct ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >

            {/* Premium Search and Filter Panel */}
            <div className="relative bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs text-left">
              <div className="flex">
                {/* Search */}
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-brand-green focus:bg-white rounded-xl text-sm focus:outline-none transition text-slate-800 placeholder-slate-400 font-medium"
                  />
                </div>
                {/* Filter Icon Trigger */}
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`w-16 mx-2 h-11 px-5 flex items-center justify-center gap-2 rounded-xl border transition cursor-pointer font-sans text-xs font-bold uppercase tracking-wider relative ${isFilterDropdownOpen || selectedCategoryFilter !== 'All'
                    ? 'bg-brand-green text-white border-brand-green shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  aria-label="Toggle Filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {selectedCategoryFilter !== 'All' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                  )}
                </button>
              </div>

              {/* Dropdown Options */}
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-4 right-4 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left"
                  >
                    <div className="col-span-full border-b border-slate-100 pb-2 mb-1 flex items-center justify-between font-sans">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Category</span>
                      {selectedCategoryFilter !== 'All' && (
                        <button
                          onClick={() => {
                            setSelectedCategoryFilter('All');
                            setIsFilterDropdownOpen(false);
                          }}
                          className="text-[9px] font-bold text-brand-green hover:underline bg-transparent border-none cursor-pointer"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                    {[
                      { label: "All Products", slug: "All" },
                      { label: "Inverters", slug: "inverter" },
                      { label: "Stabilizers", slug: "stabilizers" },
                      { label: "UPS Systems", slug: "ups" },
                      { label: "Batteries", slug: "batteries" },
                      { label: "Solar Systems", slug: "solar-panels" },
                      { label: "AMC & Services", slug: "amc-services" }
                    ].map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => {
                          setSelectedCategoryFilter(item.slug);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition border text-left cursor-pointer flex items-center justify-between ${selectedCategoryFilter === item.slug
                          ? 'bg-emerald-50 text-brand-green border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                          }`}
                      >
                        <span>{item.label}</span>
                        {selectedCategoryFilter === item.slug && (
                          <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Layout Categorized Products List */}
            {isLoading ? (
              <div className="space-y-14 animate-pulse">
                {[1, 2].map((catIdx) => (
                  <div key={catIdx} className="space-y-6 text-left">
                    {/* Sub-Category Label Skeleton */}
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div className="h-5 bg-slate-205 bg-slate-200 rounded w-32" />
                      <div className="h-4.5 bg-slate-100 rounded w-16" />
                    </div>

                    {/* Display as horizontal scrolling row skeleton */}
                    <div className="flex flex-row overflow-x-auto gap-6 pb-4 pt-1">
                      {[1, 2, 3].map((pIdx) => (
                        <div
                          key={pIdx}
                          className="w-[280px] sm:w-[325px] shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between h-[390px]"
                        >
                          <div className="h-44 w-full bg-slate-100 border-b border-slate-100 animate-pulse" />
                          <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="h-5 bg-slate-200 rounded-lg w-2/3" />
                              <div className="space-y-1.5 pt-1">
                                <div className="h-3 bg-slate-200 rounded w-[90%]" />
                                <div className="h-3 bg-slate-200 rounded w-[75%]" />
                                <div className="h-3 bg-slate-200 rounded w-[60%]" />
                              </div>
                            </div>
                            <div className="pt-2 flex gap-1.5">
                              <div className="h-4 w-12 bg-slate-100 rounded" />
                              <div className="h-4 w-16 bg-slate-100 rounded" />
                            </div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : categories.some(cat => filteredProducts.some(p => p.parent.slug === cat.slug)) ? (
              <div className="space-y-14">
                {categories.map((cat) => {
                  const catProducts = filteredProducts.filter(p => p.parent.slug === cat.slug);
                  if (catProducts.length === 0) return null;

                  return (
                    <div key={cat.slug} className="space-y-6 text-left">
                      {/* Sub-Category Label */}
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                          {cat.name}
                        </h2>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {catProducts.length} {catProducts.length === 1 ? 'Model' : 'Models'}
                        </span>
                      </div>

                      {/* Display as horizontal scrolling row */}
                      <div className="flex flex-row overflow-x-auto gap-6 pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 scroll-padding-x-4">
                        {catProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="w-[280px] sm:w-[325px] shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group select-none hover:-translate-y-0.5 duration-300 snap-start"
                          >
                            <div className="relative h-44 w-full bg-white border-b border-slate-100 z-10 shrink-0 overflow-hidden">
                              {prod.image ? (
                                <img
                                  src={resolveImageUrl(prod.image)}
                                  alt={prod.name}
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.src.includes('Oil%20Cooled') && !target.src.includes('Stabilizer')) {
                                      target.src = '/Images/Oil Cooled Stabilizer.png';
                                    }
                                  }}
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 z-10 relative"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <BadgeInfo className="h-10 w-10" />
                                </div>
                              )}
                            </div>

                            <div className="p-5 flex-grow flex flex-col justify-between relative z-10 space-y-4">
                              <div className="space-y-2">
                                <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight group-hover:text-brand-green transition-colors whitespace-normal">
                                  {prod.name}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 whitespace-normal">
                                  {prod.description}
                                </p>
                              </div>

                              <div className="pt-2 flex flex-wrap gap-1.5">
                                {prod.specs && Object.entries(prod.specs).slice(0, 2).map(([key, val]) => (
                                  <span key={key} className="text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">
                                    {key}: {val}
                                  </span>
                                ))}
                              </div>

                              <div className="pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => onNavigate(`#products/${prod.id}`)}
                                  className="h-10 px-4 w-full bg-slate-900 hover:bg-[#0A2342] text-white hover:bg-brand-green font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] font-sans"
                                >
                                  <span>View Specs & Request</span>
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-slate-200 rounded-2xl bg-slate-50">
                <BadgeInfo className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Products Found</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Try adjusting filters or search query.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Return action */}
            <div className="text-left">
              <button
                onClick={handleCloseDetails}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-500 hover:text-brand-green transition bg-transparent border-none cursor-pointer font-sans"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
                <span>Return to Catalog</span>
              </button>
            </div>

            {/* Split Grid - On PC (lg:), image & highlights on left (col-span-5), specs, details & quote button on right (col-span-7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
              {/* Left Column: Product Image & Highlights */}
              <div className="lg:col-span-5 space-y-6">
                {displayImage && (
                  <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-white border border-slate-200 relative aspect-square shadow-xs p-6 flex items-center justify-center group">
                    <img
                      src={displayImage}
                      alt={displayTitle}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('Oil%20Cooled') && !target.src.includes('Stabilizer')) {
                          target.src = '/Images/Oil Cooled Stabilizer.png';
                        }
                      }}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Highlights & Protections */}
                {displayFeatures && displayFeatures.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                    <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider border-l-2 border-brand-green pl-2.5 font-sans">
                      Highlights & Protections
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {displayFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <ShieldCheck className="h-4.5 w-4.5 text-brand-green shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Title, Metrics, Capacity Buttons, Specifications Table, & Quote CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-brand-green/10 text-brand-green px-2.5 py-1 rounded inline-block">
                    {parentCategory?.name || (isServo ? 'Servo Stabilizers' : 'Power Solutions')} Series
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                    {displayTitle}
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans pt-1">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Stabilizer Key Metrics Box */}
                {isServo && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200/90 p-3.5 rounded-2xl text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Input Range</span>
                      <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-brand-green shrink-0" />
                        <span>{selectedProduct.specs?.['Input'] || selectedProduct.specs?.['Input Range'] || selectedProduct.specs?.['Input Voltage'] || servoData?.specs.find(s => s.label.includes('Input'))?.value || '340V - 480V'}</span>
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Capacity Range</span>
                      <span className="font-mono font-black text-brand-green flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{selectedProduct.specs?.['Capacity'] || selectedProduct.specs?.['Capacity Range'] || (servoCfg ? `${servoCfg.variants[0]} - ${servoCfg.variants[servoCfg.variants.length - 1]} KVA` : 'Standard')}</span>
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selected Capacity</span>
                      <span className="font-mono font-extrabold text-[#0A2342] block">
                        {displayPower || `${activeVar} KVA`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive KVA Capacity Buttons if Servo Product */}
                {isServo && servoCfg && servoCfg.variants.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-brand-green" />
                        <span>Select KVA Capacity:</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-brand-green">
                        Selected: {displayPower}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {servoCfg.variants.map((v) => {
                        const isSel = String(activeVar) === String(v);
                        return (
                          <button
                            key={String(v)}
                            type="button"
                            onClick={() => {
                              setActiveServoVariant(v);
                              const vData = getProductVariant(selectedProduct.id, v);
                              const pVal = vData?.specs.find(s => s.label === 'Power')?.value || `${v} KVA`;
                              setOrderForm(prev => ({ ...prev, capacityRating: pVal }));
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                              isSel
                                ? 'bg-brand-green text-white border-brand-green shadow-xs scale-105 font-black ring-2 ring-emerald-300/40'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {v} <span className="text-[9px] font-sans opacity-80">kVA</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specifications on the Right Side of Image on PC */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider border-l-2 border-brand-green pl-2.5 font-sans">
                      Technical Specifications
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      {Object.keys(displaySpecs).length} Parameters
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                    {Object.entries(displaySpecs).map(([key, val], idx) => (
                      <div key={key} className={`grid grid-cols-2 p-3.5 text-xs ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <span className="font-bold text-slate-500">{key}</span>
                        <span className="font-semibold text-slate-900 text-right sm:text-left">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prominent Quote CTA Card - Shown for all users (logged in or not) */}
                <div className="bg-gradient-to-r from-slate-900 via-[#0A2342] to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="font-bold text-sm sm:text-base tracking-wide uppercase text-white">
                        Interested in this Product?
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 max-w-md">
                      Request an official price quote with technical specifications and regional dealer delivery coordinates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(null);
                      setSubmitError(null);
                      setAuthError(null);
                      setAuthStep('none');
                      setIsQuoteModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-brand-green hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20 shrink-0 font-sans"
                  >
                    <Send className="h-4 w-4" />
                    <span>Request Quote</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quote Modal */}
            <AnimatePresence>
              {isQuoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full my-8 overflow-hidden relative text-left"
                  >
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-green" />
                          <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">
                            Request Official Quote
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          {displayTitle} ({parentCategory?.name || 'Voltrix Power Systems'})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuoteModalOpen(false);
                          setSubmitSuccess(null);
                          setAuthStep('none');
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer border-none bg-transparent"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6">
                      {submitSuccess ? (
                        /* Step 3: Success Confirmation Screen */
                        <div className="space-y-5 text-center py-2">
                          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-brand-green rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg text-slate-900 uppercase tracking-wide">
                              Quote Request Submitted!
                            </h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                              Your quote has been logged and forwarded to our regional dealer and administration team. We will contact you with dispatch coordinates shortly.
                            </p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-slate-700">
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                              <span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Reference ID:</span>
                              <span className="font-bold text-brand-green">{submitSuccess.id}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                              <span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Product:</span>
                              <span className="font-semibold text-slate-900">{submitSuccess.productInterest}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                              <span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Customer:</span>
                              <span className="font-semibold text-slate-900">{submitSuccess.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Destination:</span>
                              <span className="font-semibold text-slate-900 text-right">{submitSuccess.location}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsQuoteModalOpen(false);
                              setSubmitSuccess(null);
                              setAuthStep('none');
                            }}
                            className="w-full h-11 bg-slate-900 hover:bg-[#0A2342] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer font-sans"
                          >
                            Done & Return
                          </button>
                        </div>
                      ) : authStep !== 'none' ? (
                        /* Step 2: Authentication Required (Sign In or Register) */
                        <div className="space-y-5">
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
                            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <strong className="block font-bold">Account Verification Required</strong>
                              <span className="text-[11px] text-amber-700">
                                Please sign in or create an account to finalize your quote. This connects you with your assigned regional dealer and records your quote in your portal.
                              </span>
                            </div>
                          </div>

                          {/* Mode Tabs */}
                          <div className="flex rounded-xl bg-slate-100 p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthStep('login');
                                setAuthError(null);
                              }}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition border-none cursor-pointer font-sans ${
                                authStep === 'login'
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'bg-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthStep('register');
                                setAuthError(null);
                              }}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition border-none cursor-pointer font-sans ${
                                authStep === 'register'
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'bg-transparent text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Create Account
                            </button>
                          </div>

                          {/* Login Tab Content */}
                          {authStep === 'login' ? (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">
                                  Email / Phone
                                </label>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <input
                                    type="text"
                                    value={orderForm.email || orderForm.phone}
                                    onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email or phone"
                                    className="w-full h-10 pl-9 pr-3.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">
                                  Password
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full h-10 pl-9 pr-10 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>

                              {authError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-sans">
                                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  <span>{authError}</span>
                                </div>
                              )}

                              <div className="pt-2 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAuthStep('none')}
                                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer font-sans"
                                >
                                  Edit Form
                                </button>
                                <button
                                  type="button"
                                  disabled={authLoading}
                                  onClick={() => handleAuthAndSubmit('login')}
                                  className="flex-1 h-11 bg-brand-green hover:bg-[#16a34a] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 font-sans shadow-sm"
                                >
                                  {authLoading ? <span>Verifying & Submitting...</span> : <span>Sign In & Submit Quote</span>}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Register Tab Content */
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Full Name</label>
                                  <input
                                    type="text"
                                    value={orderForm.fullName}
                                    onChange={(e) => setOrderForm(prev => ({ ...prev, fullName: e.target.value }))}
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Phone</label>
                                  <input
                                    type="tel"
                                    value={orderForm.phone}
                                    onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Email</label>
                                <input
                                  type="email"
                                  value={orderForm.email}
                                  onChange={(e) => setOrderForm(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Password</label>
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    placeholder="Create password"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Confirm Password</label>
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={authConfirmPassword}
                                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800"
                                  />
                                </div>
                              </div>

                              {authError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-sans">
                                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  <span>{authError}</span>
                                </div>
                              )}

                              <div className="pt-2 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAuthStep('none')}
                                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer font-sans"
                                >
                                  Edit Form
                                </button>
                                <button
                                  type="button"
                                  disabled={authLoading}
                                  onClick={() => handleAuthAndSubmit('register')}
                                  className="flex-1 h-11 bg-brand-green hover:bg-[#16a34a] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border-none cursor-pointer flex items-center justify-center gap-2 font-sans shadow-sm"
                                >
                                  {authLoading ? <span>Registering & Submitting...</span> : <span>Create Account & Submit Quote</span>}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Step 1: The Quote Form */
                        <form onSubmit={handleFormContinue} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Contact Name *</label>
                              <input
                                type="text"
                                required
                                value={orderForm.fullName}
                                onChange={(e) => setOrderForm({ ...orderForm, fullName: e.target.value })}
                                placeholder="Your full name"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Company Name</label>
                              <input
                                type="text"
                                value={orderForm.companyName}
                                onChange={(e) => setOrderForm({ ...orderForm, companyName: e.target.value })}
                                placeholder="Organization or Business"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Phone Number *</label>
                              <input
                                type="tel"
                                required
                                value={orderForm.phone}
                                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                placeholder="+91 9876543210"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Email Address *</label>
                              <input
                                type="email"
                                required
                                value={orderForm.email}
                                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                placeholder="you@company.com"
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 border-t border-slate-100 pt-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Address Line 1 *</label>
                              <input
                                type="text"
                                required
                                placeholder="Street address, building, or industrial estate"
                                value={orderForm.addressLine1}
                                onChange={(e) => setOrderForm({ ...orderForm, addressLine1: e.target.value })}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Zipcode / Postal *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 500043"
                                  value={orderForm.zipcode}
                                  onChange={(e) => setOrderForm({ ...orderForm, zipcode: e.target.value })}
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">City *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Hyderabad"
                                  value={orderForm.city}
                                  onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Country *</label>
                                <select
                                  required
                                  value={orderForm.country}
                                  onChange={(e) => {
                                    const newCountry = e.target.value;
                                    setOrderForm({ ...orderForm, country: newCountry, state: '' });
                                  }}
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                >
                                  <option value="">Select Country</option>
                                  {Object.keys(COUNTRIES_AND_STATES).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">State *</label>
                                <select
                                  required
                                  value={orderForm.state}
                                  onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 font-sans"
                                >
                                  <option value="">Select State</option>
                                  {(COUNTRIES_AND_STATES[orderForm.country] || []).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 border-t border-slate-100 pt-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Project / Sizing Notes</label>
                            <textarea
                              placeholder="Any specific delivery requirements, voltage notes, or quantity notes..."
                              value={orderForm.notes}
                              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                              rows={2}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 resize-none font-sans"
                            />
                          </div>

                          {submitError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-sans">
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                              <span>{submitError}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 bg-brand-green hover:bg-[#16a34a] disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition border-none cursor-pointer flex items-center justify-center gap-2 font-sans mt-2"
                          >
                            {isSubmitting ? (
                              <span>Processing...</span>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                <span>{isLoggedIn ? 'Submit Quote Request' : 'Continue to Submit Quote'}</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
