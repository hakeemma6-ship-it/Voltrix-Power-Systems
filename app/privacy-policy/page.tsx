'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Lock,
  ArrowLeft,
  ChevronRight,
  Truck,
  Building2
} from 'lucide-react';
import { CompanySettingsProvider } from '@/context/CompanySettingsContext';
import { Navbar, Footer } from '@/components/layout/Navigation';

function PrivacyPolicyContent() {
  const [activeSection, setActiveSection] = useState('overview');

  const navToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

          <div className="max-w-5xl mx-auto relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-4 tracking-wider uppercase">
              <Link href="/" className="hover:text-white transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltrix Home</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-200">Legal &amp; Policies</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-emerald-300">Privacy Policy</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Shield className="w-3.5 h-3.5" />
              <span>Official Business Policy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Privacy Policy
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              This Privacy Policy explains how Voltrix Power Systems (operated by Fortune Traders) collects, uses, protects, and discloses your personal information across our website, customer portals, and customer communication channels, including our WhatsApp Customer Service.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
              <div>
                <span className="text-slate-400">Effective Date: </span>
                <span className="text-white font-semibold">September 20, 2026</span>
              </div>
              <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>
              <div>
                <span className="text-slate-400">Entity: </span>
                <span className="text-white font-semibold">Voltrix Power Systems / Fortune Traders</span>
              </div>
              <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>
              <div>
                <span className="text-slate-400">GSTIN: </span>
                <span className="text-emerald-400 font-mono font-bold">36AEPPI5022R1ZY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Content Layout */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sticky Sidebar Navigation */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Table of Contents
                </p>
                <nav className="space-y-1 text-xs font-semibold">
                  {[
                    { id: 'overview', label: '1. Introduction & Scope' },
                    { id: 'information-collected', label: '2. Information We Collect' },
                    { id: 'how-we-use-information', label: '3. How We Use Information' },
                    { id: 'whatsapp-communication', label: '4. WhatsApp Customer Service' },
                    { id: 'automated-support', label: '5. Automated & AI Assistance' },
                    { id: 'information-sharing', label: '6. Information Sharing & Partners' },
                    { id: 'data-protection', label: '7. How We Protect Your Data' },
                    { id: 'data-retention', label: '8. Data Retention' },
                    { id: 'customer-rights', label: '9. Your Privacy Rights' },
                    { id: 'policy-updates', label: '10. Policy Updates' },
                    { id: 'contact-us', label: '11. Contact Information' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navToSection(item.id)}
                      className={`w-full text-left py-2 px-2.5 rounded-lg transition-colors block ${
                        activeSection === item.id
                          ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-500'
                          : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-5 border-t border-slate-150">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-[11px] text-slate-700 space-y-1">
                    <p className="font-bold text-[#0A2342] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Support</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Official transactional messages and order status are delivered via verified WhatsApp communication.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Policy Text */}
            <article className="lg:col-span-3 space-y-10 text-slate-800 leading-relaxed text-sm sm:text-base">

              {/* Section 1 */}
              <section id="overview" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">1</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Introduction &amp; Scope
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix Power Systems is an industrial and commercial power technology platform operated by <strong>Fortune Traders</strong> (referred to as &quot;Voltrix&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We specialize in industrial voltage regulation, three-phase servo stabilizers, online uninterruptible power supply (UPS) systems, industrial solar solutions, and power conditioning equipment.
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  This Privacy Policy governs our collection, storage, use, and disclosure of personal and business information received through:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li>Our primary website and digital consultation portal at <strong>https://voltrixsystems.com</strong>.</li>
                  <li>Our customer login portals, order status tracking pages, and quotation management desks.</li>
                  <li>Our official WhatsApp customer communication and assistance channels.</li>
                  <li>Direct phone inquiries, corporate office consultations, and partner service interactions.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section id="information-collected" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">2</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Information We Collect
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  We collect information necessary to evaluate your industrial electrical requirements, generate accurate commercial quotations, fulfill orders, deliver equipment, and provide warranty assistance. The types of information we collect include:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[#0A2342] font-bold text-xs sm:text-sm uppercase tracking-wide">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Contact &amp; Identification</span>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed">
                      Your full name, commercial enterprise name, designation, billing and delivery address, state code, GST identification number (GSTIN), telephone numbers, and email address.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[#0A2342] font-bold text-xs sm:text-sm uppercase tracking-wide">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Inquiries &amp; Technical Sizing</span>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed">
                      Power ratings (kVA), phase requirements (single-phase or three-phase), input voltage range conditions, equipment location, application type (medical, manufacturing, data center), and customer inquiry notes.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[#0A2342] font-bold text-xs sm:text-sm uppercase tracking-wide">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Orders, Payments &amp; Logistics</span>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed">
                      Quotation numbers, confirmed order line items, transaction amounts, payment status records (pending, partial, or completed bank settlements), delivery progress, dispatch notes, and invoice documents.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[#0A2342] font-bold text-xs sm:text-sm uppercase tracking-wide">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp Communications</span>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed">
                      Your verified mobile phone number, WhatsApp sender name, incoming messages, customer service requests, document retrieval requests, and delivery notification status receipts.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl mt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong>Payment Card Data Notice:</strong> Voltrix does not store credit card numbers, debit card PINs, CVV codes, or net-banking login credentials. Commercial payments are settled through established banking channels (such as NEFT, RTGS, or UPI) or through authorized regional partner arrangements.
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="how-we-use-information" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">3</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    How We Use Your Information
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix uses customer information exclusively for legitimate commercial, engineering, and customer support purposes, including:
                </p>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-650">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Technical Consultation:</strong> Analyzing electrical load specifications and recommending tailored power protection systems.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Quotation &amp; Order Execution:</strong> Preparing official price quotations, processing purchase requests, and dispatching equipment.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Delivery &amp; Logistics Coordination:</strong> Notifying customers of shipment progress, dispatch milestones, and coordinating with installation teams.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Document Delivery:</strong> Providing GST invoices, quotations, technical specification sheets, and warranty certificates via email, customer portal, or WhatsApp.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Warranty &amp; Maintenance:</strong> Tracking serial numbers, servicing history, and providing preventive maintenance or Annual Maintenance Contract (AMC) support.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Customer Portal Administration:</strong> Enabling customer account management, password resets, and self-service order tracking.</span>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="whatsapp-communication" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">4</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Communication Through WhatsApp
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix offers WhatsApp customer communication to provide fast, reliable, and convenient customer service. Customers may reach out to Voltrix or receive transactional messages via WhatsApp for:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li>Receiving order acknowledgments, quotation updates, and shipping alerts.</li>
                  <li>Inquiring about equipment specifications and pricing guidelines.</li>
                  <li>Checking the real-time delivery and logistics status of pending orders.</li>
                  <li>Requesting and receiving official invoice documents in electronic format.</li>
                  <li>Requesting technical support callback from a Voltrix regional specialist.</li>
                </ul>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 mt-4">
                  <h4 className="font-bold text-xs sm:text-sm text-[#0A2342] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Customer Identity Verification &amp; Data Access Controls</span>
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    To safeguard customer confidentiality, customer-specific records—such as order histories, delivery details, and official invoice documents—are <strong>only accessible when communicating from the verified mobile phone number</strong> registered with your Voltrix customer account.
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    If an incoming WhatsApp message originates from an unregistered or unverified phone number, customer-specific records will not be disclosed. The sender will only receive general product catalog information and instructions on how to reach our sales desk.
                  </p>
                </div>

                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-900 leading-relaxed">
                      <strong>Important Customer Security Advisory:</strong> Voltrix staff and automated systems will <strong>NEVER</strong> ask you to provide passwords, One-Time Passwords (OTPs), PINs, credit/debit card numbers, or online banking passwords over WhatsApp. Please do not send sensitive security credentials through WhatsApp messages.
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-550 leading-relaxed mt-2">
                  <em>Third-Party Platform Notice:</em> WhatsApp is an independent messaging service operated by Meta Platforms, Inc. Your use of WhatsApp is subject to WhatsApp&apos;s own Terms of Service and Privacy Policy in addition to this policy.
                </p>
              </section>

              {/* Section 5 */}
              <section id="automated-support" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">5</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Use of Automated &amp; AI-Assisted Customer Support
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  To provide prompt assistance around the clock, Voltrix incorporates automated tools and artificial intelligence (AI) to interpret incoming customer inquiries on our website chat desk and WhatsApp customer channels.
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <p className="leading-relaxed">
                    • <strong>Intent Understanding:</strong> Automated assistance is used to interpret natural language requests (such as asking for the latest order status, tracking an inquiry, or requesting an invoice copy) and direct you to the appropriate information.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Strict Data Boundaries:</strong> Automated tools operate within predefined business boundaries and only retrieve authorized records belonging to the verified customer.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Human Assistance Always Available:</strong> Automated customer assistance does not replace human engineers. You may at any point request direct contact with a human technical specialist, who will follow up during standard business hours.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="information-sharing" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">6</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    When Information May Be Shared
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix treats your information with confidentiality. <strong>We do not sell, rent, or trade your personal or business information to third parties for marketing purposes.</strong> We only share information in the following limited commercial circumstances:
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900">Authorized Regional Dealers &amp; Partners:</strong> When you submit a sizing or quote inquiry, we may share your inquiry details with an authorized regional dealer partner assigned to your territory to provide localized technical assessment, site inspection, and fulfillment.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900">Logistics &amp; Delivery Providers:</strong> We share your recipient name, shipping address, and contact telephone number with transport and courier carriers solely to ensure accurate delivery of industrial hardware.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900">Essential Communication Service Providers:</strong> We work with trusted platform partners (including Meta/WhatsApp for messaging delivery and telecommunication carriers for SMS notifications) to transmit authorized communications.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900">Legal &amp; Regulatory Compliance:</strong> We may disclose information where required by law, subpoena, tax audit, or governmental regulation, or to protect the vital legal rights, safety, and property of Voltrix, its customers, or the public.
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section id="data-protection" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">7</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    How We Protect Your Data
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  We maintain reasonable and appropriate administrative, physical, and technical safeguards designed to protect customer personal information against unauthorized access, loss, destruction, alteration, or misuse.
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Access to customer records is restricted to authorized personnel, engineers, and assigned dealers who require the information to perform their business duties. While we take commercially reasonable measures to safeguard information, no internet transmission or electronic storage method can guarantee absolute security.
                </p>
              </section>

              {/* Section 8 */}
              <section id="data-retention" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">8</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Data Retention
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix retains customer account details, inquiries, orders, and invoice records for as long as necessary to fulfill the purposes outlined in this Privacy Policy, provide ongoing equipment warranty service, maintain corporate financial records, or comply with statutory retention periods under applicable law.
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Where specific statutory timelines apply, records are kept for the duration required by applicable commercial and tax regulations (<span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">[DATA RETENTION PERIOD]</span>), after which they are securely archived, anonymized, or deleted.
                </p>
              </section>

              {/* Section 9 */}
              <section id="customer-rights" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">9</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Customer Privacy Rights &amp; Requests
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  You have rights regarding your personal information held by Voltrix Power Systems. Depending on applicable legal standards, you may:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li><strong>Request Access:</strong> Review the personal and commercial information we maintain about you.</li>
                  <li><strong>Request Correction:</strong> Request updates or corrections to inaccurate, incomplete, or outdated information.</li>
                  <li><strong>Request Account Deletion:</strong> Request the closure of your customer account and deletion of your contact data, subject to our legal, tax, or warranty record-keeping obligations.</li>
                  <li><strong>Opt Out of Marketing:</strong> Request to stop receiving non-transactional marketing communications at any time.</li>
                </ul>
                <p className="text-slate-650 text-sm leading-relaxed mt-2">
                  To submit a privacy or data request, please email our support desk at <strong className="text-slate-900">[SUPPORT EMAIL]</strong> (or <strong>sales@voltrixpower.com</strong>) with the subject line <em>&quot;Privacy Rights Request&quot;</em>. We will verify your identity and respond within a reasonable business timeframe.
                </p>
              </section>

              {/* Section 10 */}
              <section id="policy-updates" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">10</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Policy Updates &amp; Effective Date
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix may update this Privacy Policy periodically to reflect changes in our business practices, customer services, or applicable regulatory requirements. Any updates will be posted on this page with an updated &quot;Effective Date&quot; at the top of the policy. We encourage you to review this policy periodically.
                </p>
              </section>

              {/* Section 11 */}
              <section id="contact-us" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">11</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Contact Information &amp; Corporate Office
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  If you have questions, feedback, or concerns regarding this Privacy Policy or how Voltrix handles customer information, please contact our administrative desk:
                </p>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-4 text-xs sm:text-sm">
                  <div className="font-bold text-[#0A2342] uppercase tracking-wide">
                    Voltrix Power Systems (Operated by Fortune Traders)
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-650">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad, Telangana – 500043, India</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-650">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>+91 90323 72136 / +91 73867 10160</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-650">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>sales@voltrixpower.com / [SUPPORT EMAIL]</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-650">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>GSTIN: 36AEPPI5022R1ZY</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    Grievance Officer: <span className="font-mono">[GRIEVANCE OFFICER CONTACT]</span>
                  </div>
                </div>
              </section>

            </article>
          </div>
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

export default function PrivacyPolicyPage() {
  return (
    <CompanySettingsProvider>
      <PrivacyPolicyContent />
    </CompanySettingsProvider>
  );
}
