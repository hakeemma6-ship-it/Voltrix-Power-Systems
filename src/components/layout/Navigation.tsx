/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Zap,
  Phone,
  ShieldCheck,
  Mail,
  MapPin,
  MessageSquare,
  Home,
  Sparkles,
  User,
  ChevronDown,
  BookOpen,
  Wrench,
  FileText,
  Briefcase,
  Layers,
  ShoppingCart,
  Bell,
  LogOut,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';
import { useCompanySettings } from '../../context/CompanySettingsContext';

interface NavbarProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  dealerSession: any;
  adminSession?: any;
  onLogout: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Navbar({
  currentHash,
  onNavigate,
  dealerSession,
  adminSession,
  onLogout,
  cartCount = 0,
  onOpenCart
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);




  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const primaryItems = [
    { label: 'Home', hash: '#home' },
    { label: 'Categories', hash: '#categories' },
    { label: 'Products', hash: '#products' },
    { label: 'AI Support', hash: '#ai-support' },
    { label: 'Contact Us', hash: '#contact' },
  ];

  const handleLinkClick = (hash: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/' + hash;
      return;
    }
    onNavigate(hash);
    setIsDropdownOpen(false);
  };

  const isHome = currentHash === '#home' || currentHash === '' || !currentHash || currentHash === '#';

  return (
    <>
      {/* 1. Desktop & Mobile Header Bar */}
      <nav className="sticky lg:fixed top-0 left-0 w-full z-[99999] border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(15,23,42,0.02),0_1px_3px_rgba(15,23,42,0.02)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 lg:h-14 items-center justify-between">

            {/* Logo Brand - Click leads home */}
            <div
              onClick={() => handleLinkClick('#home')}
              className="flex cursor-pointer items-center select-none gap-2 font-display"
              id="nav-logo"
            >
              <Image
                src='https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png'
                alt="Voltrix Logo"
                width={127}
                height={48}
                priority
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Desktop Navigation Links (Clean PC Layout) */}
            <div className="hidden lg:flex items-center space-x-1 mt-1 font-sans">

              {/* Primary Direct Menu Buttons */}
              {primaryItems.map((item) => {
                const isActive = currentHash === item.hash || (item.hash !== '#home' && currentHash.startsWith(item.hash));
                const isAi = item.label === 'AI Support';
                return (
                  <button
                    key={item.label}
                    id={`nav-link-${item.label.toLowerCase().replace(' ', '-')}__isHome_${isHome}`}
                    onClick={() => handleLinkClick(item.hash)}
                    className={`px-4 py-2 text-xs uppercase tracking-tight font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${isActive
                      ? 'text-[#0A2342] border-b-[3px] border-brand-green rounded-none pb-1.5 font-black'
                      : 'text-slate-600 hover:text-[#0A2342] hover:border-b-[3px] hover:border-brand-green/30 pb-1.5'
                      }`}
                  >
                    {isAi && (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    )}
                    {item.label}
                  </button>
                );
              })}

            </div>

            {/* Right Action buttons (Visible on PC, hidden on mobile for extreme sleekness) */}
            <div className="hidden lg:flex items-center space-x-3">
              {dealerSession ? (
                <div className="flex items-center space-x-1.5 rounded-lg p-1 border bg-slate-50 border-slate-200 text-slate-800 shadow-sm font-sans">
                  <button
                    onClick={() => handleLinkClick('#dealer-portal')}
                    className="px-2 py-1 font-mono text-[9px] rounded bg-brand-green hover:bg-brand-green/90 text-white font-black uppercase transition-colors cursor-pointer border-none"
                    title="Go to Dealer Portal"
                  >
                    PARTNER
                  </button>
                  <span
                    onClick={() => handleLinkClick('#dealer-portal')}
                    className="text-xs font-bold truncate max-w-[130px] text-slate-800 cursor-pointer hover:text-brand-green transition-colors px-1"
                    title="Go to Dealer Portal"
                  >
                    {dealerSession.companyName}
                  </span>
                  <button
                    onClick={() => handleLinkClick('#dealer-portal')}
                    className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide bg-emerald-100 hover:bg-emerald-200 text-brand-green hover:text-emerald-900 transition-all cursor-pointer border-none"
                  >
                    Portal Docs
                  </button>
                  <span className="text-slate-350 select-none">|</span>
                  <button
                    onClick={() => setShowLogoutConfirmModal(true)}
                    className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer border-none bg-slate-150 text-slate-500 hover:bg-slate-200"
                  >
                    Logout
                  </button>
                </div>
              ) : adminSession ? (
                <div className="flex items-center space-x-1.5 rounded-lg p-1 border bg-slate-50 border-slate-200 text-slate-800 shadow-sm font-sans">
                  <button
                    onClick={() => handleLinkClick('#admin')}
                    className="px-2 py-1 font-mono text-[9px] rounded bg-purple-650 hover:bg-purple-700 text-white font-black uppercase transition-colors cursor-pointer border-none"
                    title="Go to Admin Panel"
                  >
                    ADMIN
                  </button>
                  <span
                    onClick={() => handleLinkClick('#admin')}
                    className="text-xs font-bold truncate max-w-[135px] text-slate-800 cursor-pointer hover:text-purple-600 transition-colors px-1"
                    title="Go to Admin Panel"
                  >
                    {adminSession.name}
                  </span>
                  <button
                    onClick={() => handleLinkClick('#admin')}
                    className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-900 transition-all cursor-pointer border-none"
                  >
                    Admin panel
                  </button>
                  <span className="text-slate-350 select-none">|</span>
                  <button
                    onClick={() => setShowLogoutConfirmModal(true)}
                    className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer border-none bg-[#E2E8F0] text-slate-500 hover:bg-slate-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleLinkClick('#login')}
                  className="rounded-lg px-5 py-2 font-sans text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border border-[#0A2342]/20 bg-brand-green text-white hover:bg-brand-green/90 shadow-sm"
                >
                  Portal Login
                </button>
              )}
            </div>

            {/* Mobile Header Right (NO hamburger toggle button - Hamburger removed completely) */}
            <div className="lg:hidden flex items-center space-x-2 font-sans">
              {dealerSession ? (
                <button
                  onClick={() => handleLinkClick('#dealer-portal')}
                  className="text-[10px] bg-emerald-50 border border-brand-green/30 text-brand-green font-extrabold uppercase px-2.5 py-1.5 rounded truncate max-w-[125px] transition-all cursor-pointer font-sans"
                  title="Go back to Dealer Portal"
                >
                  {dealerSession.companyName}
                </button>
              ) : adminSession ? (
                <button
                  onClick={() => handleLinkClick('#admin')}
                  className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 font-extrabold uppercase px-2.5 py-1.5 rounded truncate max-w-[125px] transition-all cursor-pointer font-sans"
                  title="Go back to Admin Panel"
                >
                  {adminSession.name}
                </button>
              ) : (
                <button
                  onClick={() => handleLinkClick('#login')}
                  className="text-[10.5px] bg-brand-green text-white font-black px-3 py-1.5 rounded uppercase cursor-pointer border-none shadow-sm"
                >
                  Login
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR WITH ICONS */}
      {/* Visible only on mobile/tablet (lg:hidden), fixed strictly to the bottom of the viewport */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-[99999] px-2 flex justify-around items-center select-none pb-safe-bottom font-sans">
        {[
          { label: 'Home', hash: '#home', icon: Home },
          { label: 'Categories', hash: '#categories', icon: Layers },
          { label: 'Products', hash: '#products', icon: Briefcase },
          { label: 'AI Support', hash: '#ai-support', icon: Sparkles },
          {
            label: dealerSession ? 'Partner' : adminSession ? 'Admin' : 'Login',
            hash: dealerSession ? '#dealer-portal' : adminSession ? '#admin' : '#login',
            icon: User
          },
        ].map((item) => {
          const IconComp = item.icon;
          const isActive = currentHash === item.hash || (item.hash !== '#home' && currentHash.startsWith(item.hash));
          return (
            <button
              key={item.label}
              onClick={() => handleLinkClick(item.hash)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center border-none bg-transparent cursor-pointer transition-all active:scale-95"
            >
              <div
                className={`p-1.5 rounded-full transition-transform duration-250 ${isActive
                  ? 'text-brand-green scale-110'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <IconComp className={`h-5 w-5 stroke-[2.3px] ${item.label === 'AI Support' && isActive ? 'animate-pulse' : ''}`} />
              </div>
              <span
                className={`text-[9.5px] font-black uppercase tracking-tight transition-colors duration-200 leading-none mt-0.5 ${isActive ? 'text-brand-green' : 'text-slate-500'
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Sign Out</h3>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Voltrix System Session</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-normal leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl">
              Are you sure you want to log out of your session? You will need to sign in again to access protected features.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirmModal(false);
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
    </>
  );
}

export function Footer({ onNavigate, currentHash }: { onNavigate: (hash: string) => void; currentHash?: string }) {
  const currentYear = new Date().getFullYear();
  const isHome = currentHash === '#home' || currentHash === '' || !currentHash || currentHash === '#';
  const { settings } = useCompanySettings();
  const phoneNumbers = settings.phone ? settings.phone.split('|').map(p => p.trim()) : [];
  const primaryPhone = phoneNumbers[0] || '+91 90323 72136';
  const secondaryPhone = phoneNumbers[1] || '+91 73867 10160';
  const gstin = settings.gstin || '36AEPPI5022R1ZY';
  const companyAddress = settings.address || '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad, Telangana – 500043';

  const handleNav = (hash: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/' + hash;
      return;
    }
    onNavigate(hash);
  };

  return (
    <footer className="relative border-t-2 border-emerald-500 bg-[#0A2342] text-slate-300 overflow-hidden font-sans mb-16 lg:mb-0">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>

      {/* Soft industrial decorative grid line patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60 pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">

          {/* Column 1: FORTUNE TRADERS Identity & GST Details */}
          <div className="space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => handleNav('#home')}>
                <div className="w-9 h-9 bg-slate-800 flex items-center justify-center rounded-sm rotate-45 border border-emerald-500/50 group-hover:scale-105 group-hover:border-emerald-400 transition-transform duration-300">
                  <span className="text-emerald-400 font-black text-lg -rotate-45">V</span>
                </div>
                <div className="flex flex-col select-none">
                  <span className="text-base font-black tracking-tighter text-white leading-none group-hover:text-emerald-400 transition-all uppercase">{settings.companyName || 'VOLTRIX POWER SYSTEMS'}</span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 mt-1.5">FORTUNE TRADERS</span>
                </div>
              </div>

              <div className="rounded-sm bg-slate-900/60 border border-slate-800 p-4 shadow-xs">
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                  A premium corporate-industrial power engineering consultation portal connecting engineering teams, factories, and clinics with advanced power quality, voltage regulators, and solar solutions.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400 mt-2.5 pt-2.5 border-t border-slate-800 font-medium">
                  ISO-standard engineering solutions with reliable service and precision power technology.
                </p>
              </div>
            </div>

            {/* GST Verification Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-sm w-fit shadow-xs hover:border-emerald-500/30 transition-all">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold leading-none">GSTIN / CERTIFIED REGISTERED</span>
                <span className="text-[11px] font-mono font-bold text-slate-200 tracking-wider mt-1 select-all">{gstin}</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-4">
              <a href="https://www.youtube.com/@VoltrixPowerSystems" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-red-500 transition-colors duration-200">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61592899555120" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-blue-500 transition-colors duration-200">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/voltrixpowersystems/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-pink-500 transition-colors duration-200">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Customer portals, Support & Legal Policies */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-bold text-white uppercase tracking-wider text-xs border-l-2 border-emerald-500 pl-2.5">
              Sales & Support
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <button onClick={() => handleNav('#dealer-portal')} className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block border-none bg-transparent cursor-pointer">
                  Dealer Login Center
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('#dealer-portal')} className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block border-none bg-transparent cursor-pointer">
                  Join Partner Network
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('#ai-support')} className="text-slate-300 hover:text-emerald-300 hover:pl-1 transition-all duration-200 text-left block font-bold flex items-center space-x-1 border-none bg-transparent cursor-pointer">
                  <span>AI Assistant Desk (24/7)</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('#contact')} className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block border-none bg-transparent cursor-pointer">
                  Direct Technical Inquiry
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('#products')} className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block border-none bg-transparent cursor-pointer">
                  Browse Power Products
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <a href="/privacy-policy" className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/data-deletion" className="text-slate-300 hover:text-emerald-400 hover:pl-1 transition-all duration-200 text-left block">
                  Data Deletion
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Premium Interactive Location/Contact Card */}
          <div className="space-y-4 text-left">
            <h3 className="font-display font-bold text-white uppercase tracking-wider text-xs border-l-2 border-emerald-500 pl-2.5">
              Hyderabad Hub Office
            </h3>

            {/* Interactive glassmorphism card */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4.5 hover:border-emerald-500/40 shadow-xs hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group">
              <div className="space-y-4 relative z-10 font-sans">
                {/* Clickable Address block */}
                <a
                  href="https://maps.app.goo.gl/KYuUPL7KFj1bAC2z8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start text-xs text-slate-300 hover:text-emerald-400 transition-colors duration-200 group/addr block"
                  title="Open location in Google Maps"
                >
                  <MapPin className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 mr-2.5 animate-pulse" />
                  <div className="text-left">
                    <span className="font-bold text-white group-hover/addr:text-emerald-400 transition-colors leading-relaxed uppercase block">
                      FORTUNE TRADERS
                    </span>
                    <p className="text-slate-300 font-medium leading-relaxed mt-1 whitespace-pre-line">
                      {companyAddress}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-black block mt-2 inline-flex items-center gap-1 group-hover/addr:underline">
                      View Google Maps Location
                    </span>
                  </div>
                </a>

                <div className="h-[1px] bg-slate-800 my-3"></div>

                {/* Clickable phone lines with Phone icons */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">OFFICIAL SERVICE HOTLINES:</div>

                  <a
                    href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                    className="flex items-center text-xs text-slate-300 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 px-3 py-2.5 rounded transition-all group/phone shadow-xs"
                  >
                    <Phone className="h-4 w-4 text-emerald-400 shrink-0 mr-2 group-hover/phone:animate-bounce" />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wide leading-none uppercase">PRIMARY CONTACT</span>
                      <span className="text-[11px] font-mono font-bold text-slate-200 mt-0.5 tracking-wider group-hover/phone:text-emerald-400">{primaryPhone}</span>
                    </div>
                  </a>

                  {secondaryPhone && (
                    <a
                      href={`tel:${secondaryPhone.replace(/\s+/g, '')}`}
                      className="flex items-center text-xs text-slate-300 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 px-3 py-2.5 rounded transition-all group/phone shadow-xs"
                    >
                      <Phone className="h-4 w-4 text-emerald-400 shrink-0 mr-2 group-hover/phone:animate-bounce" />
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wide leading-none uppercase">SECONDARY CALL</span>
                        <span className="text-[11px] font-mono font-bold text-slate-200 mt-0.5 tracking-wider group-hover/phone:text-emerald-400">{secondaryPhone}</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>© {currentYear} Voltrix Power Systems. Operated by Fortune Traders. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
            <a href="/privacy-policy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </a>
            <span className="text-slate-600">•</span>
            <a href="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">
              Terms & Conditions
            </a>
            <span className="text-slate-600">•</span>
            <a href="/data-deletion" className="hover:text-emerald-400 transition-colors">
              Data Deletion
            </a>
          </div>
        </div>
      </div>

      {/* Floating Action Ribbons (Bottom Sticky) */}
      <div className="fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-[90] lg:bottom-6 lg:left-6">
        {/* Call Now Action */}
        <a
          href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
          className="flex h-11 px-3.5 sm:h-12 sm:px-4 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold font-sans text-xs tracking-wider uppercase hover:bg-emerald-500 hover:border-transparent transition-all shadow-md gap-2 select-none"
        >
          <Phone className="h-4 w-4 text-white animate-pulse" />
        </a>
      </div>
    </footer>
  );
}
