'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — Simplified routing after CRM overhaul.
 *
 * Routes:
 *  #home            → Homepage (public)
 *  #categories/*    → Product categories (public)
 *  #products/*      → Products (public)
 *  #contact         → Contact page (public)
 *  #ai-support      → AI chat (public)
 *  #dealer-register → Dealer registration form (public)
 *  #login           → Login page (admin, dealer, customer)
 *  #profile         → Customer order tracking (customer only)
 *  #dealer-portal   → Dealer portal (dealer only)
 *  #admin/*         → Admin panel (admin only)
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, Phone, ShieldCheck, Send, Users, Sparkles, MapPin, ArrowUpRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { CompanySettingsProvider, useCompanySettings } from './context/CompanySettingsContext';

// Layout & Home
import { Navbar, Footer } from './components/layout/Navigation';
import { DedicatedAiSupport, FloatingChatBubble } from './components/ai/AiChatCenter';
import IndustriesWePower from './components/home/IndustriesWePower';
import { HeroCarouselSection } from './components/home/HeroCarouselSection';

// Next.js Optimized Lazy-loaded route components (Code Splitting / Bundle Optimization)
const DealerPortal = dynamic(() => import('./components/portal/DealerPortal'), { ssr: false, loading: () => <PageLoadProgress /> });
const AdminPanel = dynamic(() => import('./components/admin/AdminPanel'), { ssr: false, loading: () => <PageLoadProgress /> });
const LoginPage = dynamic(() => import('./components/portal/LoginPage'), { ssr: false, loading: () => <PageLoadProgress /> });
const DealerRegistrationForm = dynamic(() => import('./components/portal/DealerRegistrationForm'), { ssr: false, loading: () => <PageLoadProgress /> });
const CategoriesPage = dynamic(() => import('./components/pages/CategoriesPage'), { ssr: false, loading: () => <PageLoadProgress /> });
const ProductsPage = dynamic(() => import('./components/pages/ProductsPage'), { ssr: false, loading: () => <PageLoadProgress /> });
const CustomerProfile = dynamic(() => import('./components/portal/CustomerProfile'), { ssr: false, loading: () => <PageLoadProgress /> });
const SetPasswordPage = dynamic(() => import('./components/portal/SetPasswordPage'), { ssr: false, loading: () => <PageLoadProgress /> });
const ServoStabilizersShowcase = dynamic(() => import('./components/pages/ServoStabilizersShowcase'), { ssr: false, loading: () => <PageLoadProgress /> });

const voltrixHeroImage = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547887/voltrix_power_systems/industrial_solar_new.png";

// Page load indicator
function PageLoadProgress() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 text-slate-650 font-sans p-8 relative overflow-hidden">
      <div className="relative flex flex-col items-center justify-center mb-6">
        <svg className="w-16 h-16 text-emerald-500" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx="25" cy="25" r="20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="animate-circle-draw" transform="rotate(-90 25 25)" />
          <path d="M25,10 L17,25 H24 L20,40 L33,22 H26 Z" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-thunder-draw" />
        </svg>
      </div>
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-none font-bold">
        VOLTRIX Power System Active...
      </p>
    </div>
  );
}

function AppContent() {
  const { settings } = useCompanySettings();
  const phoneNumbers = settings.phone ? settings.phone.split('|').map(p => p.trim()) : [];
  const primaryPhone = phoneNumbers[0] || '+91 90323 72136';
  const secondaryPhone = phoneNumbers[1] || '+91 73867 10160';
  const gstin = settings.gstin || '36AEPPI5022R1ZY';
  const companyAddress = settings.address || '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad, Telangana – 500043';

  const [currentHash, setCurrentHash] = useState<string>(() => {
    if (typeof window !== 'undefined') return window.location.hash || '#home';
    return '#home';
  });
  const activeHash = currentHash.split('?')[0];
  const [aiSupportNavKey, setAiSupportNavKey] = useState<number>(0);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Sessions
  const [dealerSession, setDealerSession] = useState<any>(null);
  const [adminSession, setAdminSession] = useState<any>(null);
  const [customerSession, setCustomerSession] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Hero image with fallback
  const [heroImageSrc, setHeroImageSrc] = useState<any>(voltrixHeroImage);
  const [heroImageErrCount, setHeroImageErrCount] = useState<number>(0);

  const handleHeroImageError = () => {
    if (heroImageErrCount === 0) {
      setHeroImageErrCount(1);
      setHeroImageSrc('https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547858/voltrix_power_systems/Solar.webp');
    } else if (heroImageErrCount === 1) {
      setHeroImageErrCount(2);
      setHeroImageSrc('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=80');
    } else if (heroImageErrCount === 2) {
      setHeroImageErrCount(3);
      setHeroImageSrc('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1920&q=82');
    }
  };

  // Restore session on boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search || (url.hash.includes('?') ? url.hash.substring(url.hash.indexOf('?')) : ''));
        const urlToken = params.get('auth0_token');

        let token = urlToken || localStorage.getItem('voltrix_auth_token');

        if (urlToken) {
          localStorage.setItem('voltrix_auth_token', urlToken);
          // Clean search/hash query parameter from the address bar
          const hashPath = window.location.hash.includes('?') ? window.location.hash.split('?')[0] : window.location.hash;
          window.history.replaceState({}, document.title, window.location.pathname + hashPath);
          setCurrentHash(hashPath || '#home');
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await res.json();
            if (data.user) {
              if (data.user.role === 'admin') setAdminSession(data.user);
              else if (data.user.role === 'dealer') setDealerSession(data.user);
              else if (data.user.role === 'customer') setCustomerSession(data.user);
            }
          }
        }
      } catch (err) {
        console.warn("Session restoration failed:", err);
      } finally {
        setIsSessionLoading(false);
        const sElem = document.getElementById('ssr-hash-anti-flash');
        if (sElem?.parentNode) sElem.parentNode.removeChild(sElem);
      }
    };
    restoreSession();
  }, []);

  const isPortalView = (adminSession && activeHash.startsWith('#admin')) ||
    (dealerSession && activeHash === '#dealer-portal') ||
    (isSessionLoading && (activeHash.startsWith('#admin') || activeHash === '#dealer-portal'));

  // Contact form state
  const [homeContact, setHomeContact] = useState({ name: '', email: '', phone: '', subject: 'Main Page Inquiry', message: '' });
  const [homeSuccess, setHomeSuccess] = useState('');
  const [homeErr, setHomeErr] = useState('');

  // Auto-scroll on homepage
  const autoScrollExecutedRef = useRef(false);
  useEffect(() => {
    const hash = window.location.hash || '#home';
    if (hash !== '#home' && hash !== '' && hash !== '#') return;
    if (autoScrollExecutedRef.current) return;
    let isCancelled = false;
    let animationFrameId: number | null = null;
    let timerId: NodeJS.Timeout | null = null;
    const interactionEvents = ['wheel', 'touchmove', 'mousedown', 'keydown', 'pointerdown'];
    const handleUserInteraction = () => { isCancelled = true; if (timerId) clearTimeout(timerId); if (animationFrameId) cancelAnimationFrame(animationFrameId); cleanup(); };
    const cleanup = () => interactionEvents.forEach(ev => window.removeEventListener(ev, handleUserInteraction));
    interactionEvents.forEach(ev => window.addEventListener(ev, handleUserInteraction, { passive: true }));
    timerId = setTimeout(() => {
      if (isCancelled) return;
      const targetElement = document.getElementById('select-power-categories');
      if (!targetElement) { cleanup(); return; }
      autoScrollExecutedRef.current = true;
      const elementRect = targetElement.getBoundingClientRect();
      const absoluteTop = elementRect.top + window.scrollY;
      const finalTargetY = Math.max(0, absoluteTop - (window.innerHeight * 0.2));
      const startY = window.scrollY;
      const distance = finalTargetY - startY;
      if (Math.abs(distance) < 10) { cleanup(); return; }
      const duration = 1800;
      const startTime = performance.now();
      const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const scrollStep = (currentTime: number) => {
        if (isCancelled) return;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * ease(progress));
        if (progress < 1) animationFrameId = requestAnimationFrame(scrollStep);
        else cleanup();
      };
      animationFrameId = requestAnimationFrame(scrollStep);
    }, 2000);
    return () => { isCancelled = true; if (timerId) clearTimeout(timerId); if (animationFrameId) cancelAnimationFrame(animationFrameId); cleanup(); };
  }, []);

  // Track page views
  useEffect(() => {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: currentHash }) }).catch(() => { });
  }, [currentHash]);

  // Hash change listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      if (hash === '#privacy-policy') {
        window.location.href = '/privacy-policy';
        return;
      }
      if (hash === '#terms-and-conditions') {
        window.location.href = '/terms-and-conditions';
        return;
      }
      if (hash === '#data-deletion') {
        window.location.href = '/data-deletion';
        return;
      }
      if (hash !== '#login' && hash !== '#home') sessionStorage.setItem('login_redirect_hash', hash);
      setCurrentHash(hash);
      if (hash.startsWith('#blog/')) setActiveSlug(hash.replace('#blog/', ''));
      else setActiveSlug(null);
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentHash]);

  // SEO updates
  useEffect(() => {
    const hash = currentHash;
    let title = "VOLTRIX | Power Solutions Platform & Technical Guidance Portal";
    let desc = "VOLTRIX is a Power Solutions Platform helping users evaluate, compare, and connect with suitable power protection solution providers.";
    if (hash === '#login') { title = "Secure Login | VOLTRIX"; desc = "Secure gateway for authorized dealers, administrators, and customers."; }
    else if (hash === '#dealer-register') { title = "Dealer Registration | VOLTRIX"; desc = "Register as an authorized Voltrix dealer and join our distribution network."; }
    else if (hash === '#profile') { title = "My Orders & Inquiries | VOLTRIX"; desc = "Track your power system orders and inquiry status."; }
    else if (hash === '#dealer-portal') { title = "Dealer Portal | VOLTRIX Power Systems"; desc = "Manage clients, create quotations, and file orders as an authorized Voltrix dealer."; }
    else if (hash.startsWith('#admin')) { title = "Admin Dashboard | VOLTRIX"; desc = "Administrative panel for managing customers, dealers, orders, and quotations."; }
    else if (hash.startsWith('#categories')) { title = "Voltrix Industrial Power Categories"; desc = "Explore our premium power portfolio including UPS, stabilizers, solar, and battery systems."; }
    else if (hash.startsWith('#servo-stabilizers')) { title = "Servo Controlled Voltage Stabilizers & Transformers | VOLTRIX"; desc = "Microprocessor-controlled oil-cooled, three-phase, single-phase servo stabilizers and constant voltage transformers up to 500kVA."; }
    else if (hash.startsWith('#products')) { title = "Voltrix Products Catalog"; desc = "Browse all Voltrix power solutions and submit order requests."; }
    else if (hash === '#contact') { title = "Contact Fortune Traders Hyderabad | VOLTRIX"; desc = "Get in touch with Fortune Traders, Gandhi Maisamma, Hyderabad."; }
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", desc);
    else { const m = document.createElement("meta"); m.name = "description"; m.content = desc; document.head.appendChild(m); }
  }, [currentHash]);

  // Session-based redirects
  useEffect(() => {
    if (isSessionLoading) return;
    if (activeHash === '#login') {
      if (customerSession) handleNavigate('#profile');
      else if (dealerSession) handleNavigate('#dealer-portal');
      else if (adminSession) handleNavigate('#admin');
    } else if (activeHash === '#profile') {
      if (!customerSession && !adminSession && !dealerSession) handleNavigate('#login');
    }
  }, [activeHash, customerSession, dealerSession, adminSession, isSessionLoading]);

  const handleNavigate = (hash: string) => {
    if (hash === '#login' && currentHash && currentHash !== '#login' && currentHash !== '#home') {
      sessionStorage.setItem('login_redirect_hash', currentHash);
    }
    if (hash === '#ai-support') setAiSupportNavKey(prev => prev + 1);
    window.location.hash = hash;
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }
    localStorage.removeItem('voltrix_auth_token');
    setDealerSession(null);
    setAdminSession(null);
    setCustomerSession(null);
    window.location.hash = '#home';
  };

  const handleHomeInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setHomeSuccess('');
    setHomeErr('');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeContact),
      });
      const data = await res.json();
      if (!res.ok) { setHomeErr(data.error || "Failed to submit inquiry."); return; }
      setHomeSuccess(`Your inquiry has been received! Ticket ID: ${data.id}. We'll be in touch soon.`);
      setHomeContact({ name: '', email: '', phone: '', subject: 'Main Page Inquiry', message: '' });
    } catch {
      setHomeErr("Network error. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen bg-white text-slate-900 flex flex-col justify-between relative font-sans ${isPortalView ? 'h-screen overflow-hidden' : 'overflow-x-hidden'}`} id="voltrix-viewport">

      {/* Navbar */}
      {!isPortalView && activeHash !== '#login' && (
        <Navbar
          currentHash={currentHash}
          onNavigate={handleNavigate}
          dealerSession={dealerSession}
          adminSession={adminSession}
          customerSession={customerSession}
          onLogout={handleLogout}
        />
      )}

      {/* MAIN ROUTING */}
      <main className={`flex-grow min-h-0 ${isPortalView ? 'pt-0 h-full overflow-hidden' : (activeHash === '#login' || activeHash === '#dealer-register' || activeHash === '#set-password') ? 'pt-0' : 'pt-0 lg:pt-14'}`}>

        {/* Loading state for protected portal views */}
        {isSessionLoading && (
          activeHash === '#login' ||
          activeHash === '#profile' ||
          activeHash === '#dealer-portal' ||
          activeHash.startsWith('#admin')
        ) && <PageLoadProgress />}

        {/* HOME */}
        {activeHash === '#home' && (
          <div className="font-sans bg-transparent">
            <HeroCarouselSection onNavigate={handleNavigate} />
            <IndustriesWePower onNavigate={handleNavigate} />

            {/* Testimonials */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-white">
              <div className="text-center max-w-xl mx-auto space-y-3 mb-2">
                <span className="text-xs font-bold text-brand-green bg-emerald-50 border border-brand-green/20 uppercase tracking-widest px-3 py-1 rounded inline-block">Verified Testimonials</span>
                <h3 className="font-sans font-extrabold text-3xl text-[#0A2342] tracking-tight leading-none uppercase">Trusted by B2B Partners</h3>
              </div>
              <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full mb-10"></div>

              <div className="grid grid-rows-2 grid-flow-col gap-6 overflow-x-auto pb-6 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {[
                  { name: 'Pranav Shah (Director, ElectroVolt Solutions)', quote: "Partnering with the VOLTRIX platform has streamlined our client matching. The digital system prepares power solution blueprints in under 40 seconds.", location: 'Ludhiana weaving district' },
                  { name: 'Dr. Rajesh Chawla (Technology Director, Diagnostic Systems)', quote: "Our CT scanners experienced chronic voltage fluctuations. Connecting with an approved 100kVA double-conversion Online UPS via the VOLTRIX network delivered True dual-conversion safety.", location: 'Sector 62 NCR' },
                  { name: 'Nisha Gurnani (Chief Operations Officer, Apex Cold Chain)', quote: "Perishable inventories require zero-downtime backup configurations. Working with Voltrix power engineers allowed us to size and secure high-discharge tubular grid battery arrays.", location: 'Mundra Port Zone' },
                  { name: 'Amrit Pal Singh (Infrastructure Lead, Horizon Datacenters)', quote: "Transient voltage spikes are catastrophic. The Voltrix service connected us with certified 3-phase servo stabilizers reducing hardware tickets by 82%.", location: 'Tech City Hyderabad' },
                  { name: 'Meera Deshmukh (Project Manager, SolarGrid Infrastructure)', quote: "Procuring commercial monocrystalline PV modules for our solar park required rigorous compliance checks. Voltrix verified the panel portfolios precisely.", location: 'Nagpur Smart Zone' },
                  { name: 'Vikramaditya Rao (VP Operations, MRTS Control Rail)', quote: "Our signal control rooms demand redundant backup operations. The Voltrix custom AMC contract options keep our critical UPS backups actively audited.", location: 'Noida Sector 150' }
                ].map((test, i) => (
                  <div key={i} className="w-[285px] xs:w-[335px] md:w-[375px] shrink-0 snap-center bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand-green/45 transition-all flex flex-col justify-between space-y-4">
                    <p className="text-[11.5px] xs:text-xs sm:text-sm text-slate-650 leading-relaxed">"{test.quote}"</p>
                    <div className="flex items-center space-x-3 border-t border-slate-150 pt-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-brand-green font-black text-xs shrink-0 border border-brand-green/25">{test.name.charAt(0)}</div>
                      <div className="text-[10px] sm:text-xs font-medium min-w-0">
                        <p className="text-slate-900 font-extrabold uppercase tracking-tight truncate">{test.name}</p>
                        <p className="text-slate-400 font-bold mt-0.5 truncate">{test.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* LOGIN */}
        {!isSessionLoading && activeHash === '#login' && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <LoginPage
              onAdminLogin={(admin, isActive) => { setAdminSession(admin); if (isActive) handleNavigate('#admin'); }}
              onDealerLogin={(dealer, isActive) => { setDealerSession(dealer); if (isActive) handleNavigate('#dealer-portal'); }}
              onCustomerLogin={(cust, isActive) => { setCustomerSession(cust); if (isActive) handleNavigate('#profile'); }}
              onNavigate={handleNavigate}
              dealerSession={dealerSession}
              adminSession={adminSession}
              customerSession={customerSession}
            />
          </React.Suspense>
        )}

        {/* DEALER REGISTER */}
        {activeHash === '#dealer-register' && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <DealerRegistrationForm onNavigate={handleNavigate} />
          </React.Suspense>
        )}

        {/* SET PASSWORD / ACTIVATION */}
        {(activeHash === '#set-password' || activeHash === '#activate-account') && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <SetPasswordPage onNavigate={handleNavigate} />
          </React.Suspense>
        )}

        {/* CUSTOMER PROFILE & SUB-PAGES (#profile, #orders, #quotations, #support, #security) */}
        {!isSessionLoading && ['#profile', '#orders', '#quotations', '#support', '#security'].includes(activeHash) && (
          <React.Suspense fallback={<PageLoadProgress />}>
            {customerSession ? (
              <CustomerProfile
                customerSession={customerSession}
                onLogout={handleLogout}
                onUpdateSession={(updatedUser) => setCustomerSession(updatedUser)}
                activeHash={activeHash}
                onNavigate={handleNavigate}
              />
            ) : (
              <LoginPage
                onAdminLogin={(admin, isActive) => { setAdminSession(admin); if (isActive) handleNavigate('#admin'); }}
                onDealerLogin={(dealer, isActive) => { setDealerSession(dealer); if (isActive) handleNavigate('#dealer-portal'); }}
                onCustomerLogin={(cust, isActive) => { setCustomerSession(cust); if (isActive) handleNavigate('#profile'); }}
                onNavigate={handleNavigate}
                dealerSession={dealerSession}
                adminSession={adminSession}
                customerSession={customerSession}
              />
            )}
          </React.Suspense>
        )}

        {/* DEALER PORTAL */}
        {!isSessionLoading && activeHash === '#dealer-portal' && (
          <React.Suspense fallback={<PageLoadProgress />}>
            {dealerSession ? (
              <DealerPortal dealerSession={dealerSession} onLoginSuccess={setDealerSession} onLogout={handleLogout} />
            ) : (
              <React.Suspense fallback={<PageLoadProgress />}>
                <LoginPage
                  onAdminLogin={(admin, isActive) => { setAdminSession(admin); if (isActive) handleNavigate('#admin'); }}
                  onDealerLogin={(dealer, isActive) => { setDealerSession(dealer); if (isActive) handleNavigate('#dealer-portal'); }}
                  onCustomerLogin={(cust, isActive) => { setCustomerSession(cust); if (isActive) handleNavigate('#profile'); }}
                  onNavigate={handleNavigate}
                  dealerSession={dealerSession}
                  adminSession={adminSession}
                  customerSession={customerSession}
                />
              </React.Suspense>
            )}
          </React.Suspense>
        )}

        {/* AI SUPPORT */}
        {activeHash === '#ai-support' && (
          <DedicatedAiSupport
            key={`ai-support-${aiSupportNavKey}`}
            activeSession={dealerSession || adminSession || customerSession}
            onNavigate={handleNavigate}
          />
        )}

        {/* CATEGORIES */}
        {activeHash.startsWith('#categories') && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <CategoriesPage currentHash={currentHash} onNavigate={handleNavigate} />
          </React.Suspense>
        )}

        {/* SERVO STABILIZERS */}
        {(activeHash === '#servo-stabilizers' || activeHash.startsWith('#servo-stabilizers/')) && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <ServoStabilizersShowcase
              onNavigate={handleNavigate}
              dealerSession={dealerSession}
              customerSession={customerSession}
              adminSession={adminSession}
              showBreadcrumb={true}
            />
          </React.Suspense>
        )}

        {/* PRODUCTS */}
        {activeHash.startsWith('#products') && (
          <React.Suspense fallback={<PageLoadProgress />}>
            <ProductsPage
              currentHash={currentHash}
              onNavigate={handleNavigate}
              dealerSession={dealerSession}
              customerSession={customerSession}
              adminSession={adminSession}
              onCustomerLogin={(cust) => setCustomerSession(cust)}
            />
          </React.Suspense>
        )}

        {/* CONTACT */}
        {activeHash === '#contact' && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 font-sans animate-fade-in bg-white border border-slate-200 rounded-3xl mt-6 shadow-sm text-center">
            {/* Header */}
            <div className="max-w-3xl mx-auto space-y-3 mb-10">
              <span className="text-xs font-bold text-brand-green bg-emerald-50 border border-emerald-255 uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-xs inline-block">
                Fortune Traders // Hyderabad Hub
              </span>
              <h2 className="font-sans font-black text-[#0A2342] text-3xl tracking-tight leading-tight sm:text-5xl uppercase">
                Contact Technical Desk
              </h2>
              <p className="text-slate-650 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
                Connect with our regional partner specialist desks for on-site load assessments, commercial installations, stabilizer recommendations, or high-capacity battery configurations. We do not use web inquiry forms—please reach out directly using the hotlines below.
              </p>
              <div className="h-[3px] w-12 bg-emerald-500 mx-auto rounded-full mt-4"></div>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-10">

              {/* Address card */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between hover:border-brand-green/30 transition-all duration-300 shadow-xs">
                <div>
                  <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans font-bold text-slate-800 text-base uppercase tracking-wide mb-2">Corporate Office</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold whitespace-pre-line">
                    {companyAddress}
                  </p>
                </div>
                <a
                  href="https://maps.app.goo.gl/KYuUPL7KFj1bAC2z8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-green font-bold mt-6 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Open in Google Maps</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>

              {/* Call hotlines card */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between hover:border-brand-green/30 transition-all duration-300 shadow-xs">
                <div>
                  <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans font-bold text-slate-800 text-base uppercase tracking-wide mb-2">Official Hotlines</h3>
                  <p className="text-slate-650 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
                    Speak directly with our senior power engineers for sales, custom configurations, or support:
                  </p>
                  <div className="space-y-2 mt-2">
                    <a
                      href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-brand-green/30 rounded-lg group transition-all font-mono text-xs font-bold text-slate-700"
                    >
                      <span>{primaryPhone}</span>
                      <span className="text-[10px] text-brand-green uppercase tracking-wide">Call Primary</span>
                    </a>
                    {secondaryPhone && (
                      <a
                        href={`tel:${secondaryPhone.replace(/\s+/g, '')}`}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-250 hover:border-brand-green/30 rounded-lg group transition-all font-mono text-xs font-bold text-slate-700"
                      >
                        <span>{secondaryPhone}</span>
                        <span className="text-[10px] text-brand-green uppercase tracking-wide">Call Secondary</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Corporate registry card */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between hover:border-brand-green/30 transition-all duration-300 shadow-xs md:col-span-2 lg:col-span-1">
                <div>
                  <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans font-bold text-slate-800 text-base uppercase tracking-wide mb-2">GST Identification</h3>
                  <p className="text-slate-650 text-xs sm:text-sm leading-relaxed mb-4 font-semibold">
                    Voltrix Power Systems (operated by Fortune Traders) is a verified and certified regional contractor entity.
                  </p>
                  <div className="p-3 bg-white border border-slate-250 rounded-lg text-center">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold block mb-1">GSTIN REGISTERED</span>
                    <span className="text-xs font-mono font-black text-brand-green tracking-widest select-all uppercase">{gstin}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive map banner */}
            <div className="rounded-2xl border-2 border-slate-200 overflow-hidden relative shadow-sm group hover:border-brand-green/30 transition-all duration-300">
              <a
                href="https://maps.app.goo.gl/KYuUPL7KFj1bAC2z8"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-64 bg-slate-100 relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10 text-center p-4">
                  <div className="p-3 bg-white/90 backdrop-blur-sm rounded-full border border-slate-250 shadow-md group-hover:scale-115 transition-transform duration-300">
                    <MapPin className="h-8 w-8 text-brand-green animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#0A2342] tracking-wider uppercase bg-white px-3 py-1 rounded-sm border border-slate-250 shadow-xs block">
                      Find Voltrix Power Systems
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Click to open maps directions
                    </span>
                  </div>
                </div>
              </a>
            </div>

          </div>
        )}

        {/* ADMIN PANEL */}
        {!isSessionLoading && activeHash.startsWith('#admin') && (
          <React.Suspense fallback={<PageLoadProgress />}>
            {adminSession ? (
              <AdminPanel adminSession={adminSession} onLogout={handleLogout} />
            ) : (
              <React.Suspense fallback={<PageLoadProgress />}>
                <LoginPage
                  onAdminLogin={(admin, isActive) => { setAdminSession(admin); if (isActive) handleNavigate('#admin'); }}
                  onDealerLogin={(dealer, isActive) => { setDealerSession(dealer); if (isActive) handleNavigate('#dealer-portal'); }}
                  onCustomerLogin={(cust, isActive) => { setCustomerSession(cust); if (isActive) handleNavigate('#profile'); }}
                  onNavigate={handleNavigate}
                  dealerSession={dealerSession}
                  adminSession={adminSession}
                  customerSession={customerSession}
                />
              </React.Suspense>
            )}
          </React.Suspense>
        )}

      </main>

      {/* Footer */}
      {!isPortalView && (
        <Footer onNavigate={handleNavigate} currentHash={currentHash} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <CompanySettingsProvider>
      <AppContent />
    </CompanySettingsProvider>
  );
}
