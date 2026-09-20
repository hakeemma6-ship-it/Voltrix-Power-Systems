'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock,
  ArrowLeft,
  ChevronRight,
  Truck,
  Wrench,
  Building2,
  Scale,
  Ban,
  Clock
} from 'lucide-react';
import { CompanySettingsProvider } from '@/context/CompanySettingsContext';
import { Navbar, Footer } from '@/components/layout/Navigation';

function TermsAndConditionsContent() {
  const [activeSection, setActiveSection] = useState('acceptance');

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
              <span className="text-emerald-300">Terms &amp; Conditions</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Official Commercial Terms</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Terms &amp; Conditions
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              These Terms &amp; Conditions govern your use of the Voltrix Power Systems website, customer portal, product procurement, warranty provisions, and customer service communication channels, including the Voltrix WhatsApp Customer Assistant.
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
                    { id: 'acceptance', label: '1. Agreement to Terms' },
                    { id: 'website-usage', label: '2. Website Usage' },
                    { id: 'accounts', label: '3. Customer Accounts' },
                    { id: 'inquiries-orders', label: '4. Inquiries & Orders' },
                    { id: 'pricing-payments', label: '5. Pricing, Invoices & Payments' },
                    { id: 'delivery-logistics', label: '6. Delivery & Logistics' },
                    { id: 'warranty', label: '7. Manufacturer Warranty' },
                    { id: 'cancellation-refunds', label: '8. Cancellations & Refunds' },
                    { id: 'whatsapp-terms', label: '9. WhatsApp Communication' },
                    { id: 'automated-assistant', label: '10. Automated Assistant' },
                    { id: 'partner-responsibilities', label: '11. Dealer Network' },
                    { id: 'intellectual-property', label: '12. Intellectual Property' },
                    { id: 'liability', label: '13. Limitation of Liability' },
                    { id: 'disputes', label: '14. Governing Law & Disputes' },
                    { id: 'contact', label: '15. Contact Information' },
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
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Commercial Transparency</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Custom industrial power equipment orders are governed by verified engineering quotations.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Terms Text */}
            <article className="lg:col-span-3 space-y-10 text-slate-800 leading-relaxed text-sm sm:text-base">

              {/* Section 1 */}
              <section id="acceptance" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">1</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Agreement to Terms
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  These Terms &amp; Conditions constitute a legally binding agreement between you (whether individually or on behalf of an enterprise, corporation, hospital, factory, or institution) and <strong>Voltrix Power Systems</strong>, operated by <strong>Fortune Traders</strong> (&quot;Voltrix&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  By visiting our website, accessing the customer portal, submitting equipment inquiries, accepting quotations, placing orders, or communicating with our automated WhatsApp customer service, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree to all of these terms, you must not use our website or services.
                </p>
              </section>

              {/* Section 2 */}
              <section id="website-usage" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">2</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Website Usage &amp; Eligibility
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Our website and consultation tools are intended for lawful commercial, industrial, healthcare, educational, and residential power inquiries. You agree to use the website solely for legitimate purposes and refrain from:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li>Attempting to gain unauthorized access to our portals, networks, or other customers&apos; accounts.</li>
                  <li>Introducing viruses, malicious scripts, automated scraping bots, or disruptive tools.</li>
                  <li>Submitting false, misleading, fraudulent, or defamatory inquiries or information.</li>
                  <li>Circumventing any security features, access restrictions, or verification procedures.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="accounts" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">3</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Customer Accounts &amp; Responsibilities
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  When you register a customer account or when an account is provisioned for you upon placing an inquiry or order:
                </p>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-650">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete corporate and contact details.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Credential Confidentiality:</strong> You are responsible for safeguarding your login credentials and passwords. Do not share your login information with unauthorized third parties.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Account Activities:</strong> You accept responsibility for all activities, quotation acceptances, and orders filed under your authenticated account.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Notice of Compromise:</strong> You must promptly notify Voltrix at voltrixpowersystems@gmail.com if you suspect unauthorized access to your account.</span>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="inquiries-orders" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">4</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Inquiries, Technical Sizing &amp; Orders
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix provides technical recommendations, sizing estimates, and product comparisons based on the operating load and voltage data provided by the customer.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li><strong>Consultation Nature:</strong> Preliminary recommendations made via our website sizing calculator or customer chat are for informational guidance. Final equipment capacity sizing should be validated against actual connected electrical loads and site survey conditions.</li>
                  <li><strong>Order Confirmation:</strong> An order becomes legally binding only upon the issuance of an official written order confirmation or proforma invoice by Voltrix or its authorized regional partner.</li>
                  <li><strong>Custom Specifications:</strong> Customized units (such as tailored voltage ranges, specialized isolation transformers, or custom IP-rated enclosures) will be manufactured in strict accordance with the mutually agreed quotation specifications.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="pricing-payments" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">5</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Quotations, Pricing, Invoices &amp; Payments
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <p className="leading-relaxed">
                    • <strong>Quotations &amp; Validity:</strong> Formal price quotations are valid for the timeframe stated on the quotation document. If no timeframe is specified, quotations remain valid for 15 calendar days from issuance.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Taxes &amp; Duties:</strong> Unless explicitly noted otherwise, prices are quoted in Indian Rupees (INR) and are subject to applicable Goods and Services Tax (GST) at statutory rates (typically 18% for electrical power conditioning equipment).
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Payment Methods:</strong> Approved payment methods include direct electronic bank transfers (NEFT, RTGS, IMPS), authorized UPI channels, or documented settlement with authorized regional distribution partners.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Tax Invoices:</strong> Official GST tax invoices are generated upon dispatch or order confirmation, referencing the customer&apos;s registered GSTIN and corporate billing address.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="delivery-logistics" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">6</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Delivery, Logistics &amp; Site Readiness
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <p className="leading-relaxed">
                    • <strong>Timelines &amp; Dispatch:</strong> Dispatch schedules depend on production lead times, product availability, and custom manufacturing requirements. Estimated delivery dates are provided in good faith but are subject to transit conditions, freight availability, and force majeure events.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Site Readiness:</strong> The customer is responsible for ensuring that the installation site is prepared, accessible, ventilated, and equipped with suitable electrical input connections, circuit breakers, and adequate cabling before delivery.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Inspection on Receipt:</strong> The customer must inspect external transit packaging upon delivery. Any transit damage or missing units must be endorsed on the consignment note and reported to Voltrix within 48 hours of delivery.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="warranty" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">7</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Manufacturer Warranty
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix products are engineered to high industrial quality standards and backed by standard manufacturer warranty protection:
                </p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4" />
                    <span>12-Month Standard Warranty</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                    All new Voltrix Servo Voltage Stabilizers, Online UPS systems, and power transformers carry a <strong>12-month standard warranty</strong> against manufacturing defects from the date of invoice. This warranty covers replacement parts, manufacturing defect repairs, and factory technical assistance.
                  </p>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-2">
                  Warranty Exclusions:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-650">
                  <li>Damage caused by improper wiring, phase-reversal by external electricians, or incorrect installation.</li>
                  <li>Operation beyond rated electrical capacity, prolonged severe overloads, or ambient operating temperature extremes.</li>
                  <li>Physical accidents, water ingress, chemical exposure, fire, lightning surges, or force majeure events.</li>
                  <li>Unauthorized repairs, alterations, or tampering by non-certified technicians without written factory consent.</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section id="cancellation-refunds" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">8</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Cancellation &amp; Refund Policies
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Industrial power equipment, custom-wound servo stabilizers, and engineered power arrays represent specialized commercial hardware manufactured to customer-specified voltages and load profiles.
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <p className="leading-relaxed">
                    • <strong>Cancellation Terms:</strong> Order cancellation requests must be submitted in writing within the applicable timeframe (<span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">[CANCELLATION TIMEFRAME]</span>) prior to production or dispatch. Customized units in active assembly or winding cannot be canceled without incurring committed material charges.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>Refund Rules:</strong> Any commercial refunds, restocking allowances, or credit notes are evaluated strictly according to the agreed contract terms (<span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">[REFUND POLICY]</span>). Where an approved refund is issued, it will be credited back via the original bank transfer method within standard banking business cycles.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="whatsapp-terms" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">9</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    WhatsApp Customer Communication Terms
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix offers WhatsApp messaging as a modern, direct channel to assist customers with inquiries, quotes, order status, logistics tracking, and invoice delivery. When using our WhatsApp channel, you agree that:
                </p>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-650">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Customer Authorization:</strong> You authorize Voltrix to send transactional messages, delivery milestones, quotation updates, and customer service replies to your WhatsApp number.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Identity Verification:</strong> Account-specific information, invoices, and shipment details are only shared after verifying that the inquiry originates from the mobile phone number registered with your Voltrix customer account.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Electronic Document Delivery:</strong> Invoices and technical documents delivered via WhatsApp carry the same official commercial standing as electronic documents downloaded from our customer portal.</span>
                  </div>
                </div>

                <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2 mt-4">
                  <div className="flex items-start gap-3">
                    <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-900 leading-relaxed">
                      <strong>Customer Responsibilities &amp; Anti-Spam Prohibition:</strong> You must not send abusive, profane, spam, harassing, or fraudulent messages through our WhatsApp channel, nor attempt to access information belonging to other customers. Sending passwords, credit/debit card numbers, or banking PINs via WhatsApp is strictly prohibited.
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-550 leading-relaxed mt-2">
                  <em>Third-Party Platform Notice:</em> WhatsApp is provided by Meta Platforms, Inc. Your use of WhatsApp is subject to WhatsApp&apos;s own Terms of Service and Privacy Policy. Voltrix is not liable for temporary service interruptions, network delays, or outages originating from the WhatsApp platform.
                </p>
              </section>

              {/* Section 10 */}
              <section id="automated-assistant" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">10</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Automated Customer Assistance &amp; Limitations
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Our WhatsApp service and website help desk incorporate automated customer assistance tools designed to provide rapid responses to common requests (such as checking order progress, reviewing inquiries, or requesting invoices).
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-650">
                  <li><strong>Informational Purpose:</strong> Automated responses are provided for convenience and guidance. Automated messages do not modify executed contracts, warranty terms, or formal commercial pricing.</li>
                  <li><strong>Technical Inquiries:</strong> Complex electrical engineering questions, specialized industrial configurations, and customized project quotes will be directed to human technical specialists during normal business hours.</li>
                  <li><strong>Availability:</strong> While automated tools operate 24/7, response speed may vary based on network connectivity and third-party platform conditions.</li>
                </ul>
              </section>

              {/* Section 11 */}
              <section id="partner-responsibilities" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">11</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Authorized Dealer Network
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix operates an authorized regional dealer and distribution partner network. Authorized dealers are independent commercial entities. While Voltrix validates dealer credentials and enforces factory quality standards, each dealer is responsible for its own direct customer communications, local site wiring, localized delivery handling, and agreed field service commitments.
                </p>
              </section>

              {/* Section 12 */}
              <section id="intellectual-property" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">12</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Intellectual Property
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  All trademarks, service marks, logos, brand names, product designs, photographs, technical specification sheets, sizing calculators, software interfaces, and documentation on the Voltrix website are the exclusive property of <strong>Voltrix Power Systems</strong> and <strong>Fortune Traders</strong>.
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  You may not copy, reproduce, republish, distribute, sell, or exploit any content from our website without our express prior written permission.
                </p>
              </section>

              {/* Section 13 */}
              <section id="liability" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">13</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Limitation of Liability
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-650">
                  <p className="leading-relaxed">
                    • To the maximum extent permitted by applicable law, in no event shall Voltrix Power Systems, Fortune Traders, or their respective directors, employees, or authorized dealers be liable for any indirect, incidental, consequential, special, or punitive damages—including loss of profits, loss of business opportunity, loss of manufacturing output, production downtime, or loss of data—arising out of or in connection with your use of our website, automated assistance, or purchased power equipment.
                  </p>
                  <p className="leading-relaxed">
                    • Voltrix&apos;s aggregate liability arising out of any purchase, product, or service shall not exceed the actual purchase price paid by the customer for the specific piece of equipment giving rise to the claim.
                  </p>
                </div>
              </section>

              {/* Section 14 */}
              <section id="disputes" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">14</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Governing Law &amp; Dispute Resolution
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  These Terms &amp; Conditions and any commercial dispute arising out of or related to our products or services shall be governed by and construed in accordance with the laws of India (<span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">[GOVERNING LAW &amp; JURISDICTION]</span>).
                </p>
                <p className="text-slate-650 text-sm leading-relaxed">
                  The parties agree to make good-faith efforts to resolve any disputes amicably through technical and executive consultation. Any formal proceedings or arbitrations shall be conducted at <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">[ARBITRATION VENUE]</span> in accordance with applicable statutory dispute resolution rules.
                </p>
              </section>

              {/* Section 15 */}
              <section id="contact" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">15</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0A2342] tracking-tight">
                    Policy Modifications &amp; Contact Desk
                  </h2>
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  Voltrix reserves the right to modify these Terms &amp; Conditions at any time. Updated terms take effect immediately upon publication on this page. Your continued use of our website or customer channels following any revisions constitutes your acceptance of the amended terms.
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
                    <a href="mailto:voltrixpowersystems@gmail.com" className="hover:text-emerald-600 transition-colors">
                      voltrixpowersystems@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-650">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>GSTIN: 36AEPPI5022R1ZY</span>
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

export default function TermsAndConditionsPage() {
  return (
    <CompanySettingsProvider>
      <TermsAndConditionsContent />
    </CompanySettingsProvider>
  );
}
