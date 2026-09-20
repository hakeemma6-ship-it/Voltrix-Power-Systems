'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  FileText,
  Clock,
  Send,
  UserCheck
} from 'lucide-react';
import { CompanySettingsProvider } from '@/context/CompanySettingsContext';
import { Navbar, Footer } from '@/components/layout/Navigation';

function DataDeletionContent() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentHash=""
        onNavigate={(hash) => {
          if (typeof window !== 'undefined') window.location.href = '/' + hash;
        }}
        dealerSession={null}
        onLogout={() => {}}
      />

      <main className="flex-grow pt-20 lg:pt-24 pb-16">
        {/* Header Hero */}
        <section className="bg-gradient-to-b from-[#0A2342] to-[#0F2F57] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b-2 border-emerald-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-4 tracking-wider uppercase">
              <Link href="/" className="hover:text-white transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltrix Home</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-emerald-300">Data Deletion Request</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Customer Data Privacy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Data Deletion Request
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              At Voltrix Power Systems, we respect your privacy and provide customers with clear options to request the deletion of their personal information associated with our website, customer portals, and WhatsApp customer service.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
              <div>
                <span className="text-slate-400">Entity: </span>
                <span className="text-white font-semibold">Voltrix Power Systems / Fortune Traders</span>
              </div>
              <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>
              <div>
                <span className="text-slate-400">Support Desk: </span>
                <a href="mailto:voltrixpowersystems@gmail.com" className="text-emerald-400 font-semibold hover:underline">
                  voltrixpowersystems@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Content Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

          {/* Overview Card */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Right to Request Data Deletion</span>
            </h2>
            <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
              If you have registered an account with Voltrix Power Systems, submitted equipment inquiries, or interacted with our automated WhatsApp customer assistance, you have the right to request that your personal information be deleted from our active customer systems.
            </p>
            <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
              Voltrix reviews and processes all eligible deletion requests in accordance with applicable consumer data protection guidelines and our Privacy Policy.
            </p>
          </section>

          {/* Step-by-Step Instructions */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-150 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight flex items-center gap-2.5">
                <Send className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>How to Submit a Deletion Request</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Follow these simple steps to request the deletion of your customer records:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-[#0A2342] uppercase tracking-wide">
                    Email Our Desk
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Send an email to our official customer support desk at:
                  </p>
                  <a
                    href="mailto:voltrixpowersystems@gmail.com?subject=Data%20Deletion%20Request"
                    className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded block truncate hover:underline"
                  >
                    voltrixpowersystems@gmail.com
                  </a>
                  <p className="text-[11px] text-slate-500">
                    Subject: <em>&quot;Data Deletion Request&quot;</em>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-[#0A2342] uppercase tracking-wide">
                    Provide Details
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    To help us locate and verify your profile, please include:
                  </p>
                  <ul className="text-xs text-slate-650 space-y-1 list-disc pl-4">
                    <li>Your Full Registered Name</li>
                    <li>Registered WhatsApp / Mobile Number</li>
                    <li>Registered Email Address</li>
                    <li>Company / Enterprise Name (if any)</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-[#0A2342] uppercase tracking-wide">
                    Review &amp; Confirmation
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    Our compliance team will verify your identity, process the deletion from active systems, and send you a written confirmation.
                  </p>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Response within 30 business days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Email Action Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
              <div className="text-xs text-slate-700">
                <strong>Need immediate assistance?</strong> Click the button to launch a pre-formatted email to our data privacy team.
              </div>
              <a
                href="mailto:voltrixpowersystems@gmail.com?subject=Data%20Deletion%20Request&body=Dear%20Voltrix%20Privacy%20Team%2C%0A%0APlease%20process%20my%20data%20deletion%20request%20under%20the%20Voltrix%20Privacy%20Policy.%0A%0AFull%20Name%3A%20%0ARegistered%20Phone%20%2F%20WhatsApp%20Number%3A%20%0ARegistered%20Email%3A%20%0ACompany%20Name%20(if%20any)%3A%20%0A%0AThank%20you."
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-emerald-500 transition-colors shrink-0 shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Submit Deletion Email</span>
              </a>
            </div>
          </section>

          {/* Retention Exceptions Section */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                Information That May Be Retained
              </h2>
            </div>
            <p className="text-slate-650 text-sm leading-relaxed">
              While we will promptly remove your active account profile, login credentials, and marketing preferences, please note that certain records <strong>may be legally retained</strong> where required by statutory, tax, or legitimate business requirements, including:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-xs text-[#0A2342] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tax &amp; GST Accounting Records</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Issued commercial invoices, GST filings, and payment transaction receipts must be retained under applicable statutory tax laws.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-xs text-[#0A2342] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Product Warranty &amp; Serial Records</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Records verifying active product serial numbers and 12-month manufacturer warranties must be maintained to honor equipment servicing obligations.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-xs text-[#0A2342] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Executed Purchase Contracts</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Signed commercial agreements and proof of equipment delivery required for bilateral commercial record-keeping.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-xs text-[#0A2342] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dispute &amp; Legal Compliance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Information necessary to establish, exercise, or defend against legal claims or to comply with official court or regulatory orders.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              Any retained data will be archived securely, access-restricted, and strictly used only for the specific statutory or warranty purpose for which retention is required.
            </p>
          </section>

          {/* Meta & WhatsApp Platform Compliance Note */}
          <section className="bg-slate-100/80 border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-[#0A2342] uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Meta / WhatsApp User Data Notice</span>
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed">
              If you have interacted with Voltrix Power Systems via WhatsApp or Meta business tools, this page serves as our official <strong>User Data Deletion Instructions</strong>. Submitting a request with your registered mobile telephone number will delete your WhatsApp contact profile and conversation logs from Voltrix systems.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please note that messages stored within your personal WhatsApp application on your own device remain under your control and must be cleared directly within your WhatsApp chat interface.
            </p>
          </section>

          {/* Contact Box */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-[#0A2342] tracking-tight">
              Corporate Office &amp; Contact Information
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-650">
              <p className="font-bold text-slate-900">
                Voltrix Power Systems (Operated by Fortune Traders)
              </p>
              <div className="flex items-start gap-2 text-slate-650">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad, Telangana – 500043, India</span>
              </div>
              <div className="flex items-center gap-2 text-slate-650">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+91 90323 72136 / +91 73867 10160</span>
              </div>
              <div className="flex items-center gap-2 text-slate-650">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href="mailto:voltrixpowersystems@gmail.com" className="hover:text-emerald-600 transition-colors">
                  voltrixpowersystems@gmail.com
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(hash) => {
          if (typeof window !== 'undefined') window.location.href = '/' + hash;
        }}
        currentHash=""
      />
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <CompanySettingsProvider>
      <DataDeletionContent />
    </CompanySettingsProvider>
  );
}
