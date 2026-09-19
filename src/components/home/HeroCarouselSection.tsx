import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Leaf,
  TrendingUp,
  Settings,
  Download,
  Cpu,
  Activity,
  Battery as BatteryIcon,
  Sun,
  Wrench,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

const firstSliderImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547892/voltrix_power_systems/First_Slider.png";
const stabilizerImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547856/voltrix_power_systems/Stabilizer.png";
const batteriesImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547897/voltrix_power_systems/Batteries.png";
const solarImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547858/voltrix_power_systems/Solar.webp";
const upsImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547845/voltrix_power_systems/UPS.jpg";

const inverterCategoryImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1785436657/voltrix_power_systems/category_inverter.png";
const batteriesCategoryImg = "https://res.cloudinary.com/a6ppmzjz/image/upload/v1785436661/voltrix_power_systems/category_batteries.png";

interface HeroCarouselSectionProps {
  onNavigate: (hash: string) => void;
}

export function HeroCarouselSection({ onNavigate }: HeroCarouselSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-white select-none" id="home-hero">
      {/* Main Hero Container */}
      <div className="relative min-h-[440px] sm:min-h-[480px] lg:h-[550px] w-full flex items-center bg-slate-50 overflow-hidden py-8 lg:py-0">

        {/* Background Image spanning full hero section height with smooth left-to-right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 lg:w-1/2 h-full z-0 overflow-hidden">
          <img
            src={firstSliderImg}
            alt="Voltrix clean energy solutions"
            className="w-full h-full object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
            loading="eager"
          />
          {/* Smooth left gradient fade blending into the light background */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 lg:w-1/2 bg-gradient-to-r from-slate-50 via-slate-50/85 to-transparent" />
          {/* Subtle top/bottom edge gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50/40 via-transparent to-slate-50/20 pointer-events-none" />
        </div>

        {/* Content Container (Content on Left) */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Content */}
            <div className="w-full sm:w-4/5 md:w-3/4 lg:w-auto lg:col-span-6 flex flex-col items-start text-left space-y-4 sm:space-y-6 lg:pr-8">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 bg-emerald-50/90 border border-emerald-250 uppercase tracking-widest px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md shadow-xs inline-block">
                VOLTRIX POWER SYSTEMS
              </span>

              <h1 className="text-[#05303c] text-2.5xl sm:text-4.5xl md:text-5xl lg:text-[54px] font-sans font-black leading-[1.12] sm:leading-[1.1] tracking-tight uppercase">
                Reliable <span className="text-emerald-500">Green</span> <br /> Power Solutions
              </h1>

              <p className="text-slate-700 lg:text-slate-600 text-xs sm:text-base leading-relaxed font-semibold max-w-xl">
                Advanced electrical and power solutions that drive efficiency, reduce costs, and build a cleaner tomorrow.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2">
                <button
                  onClick={() => onNavigate('#categories')}
                  className="h-11 sm:h-12 w-full sm:w-auto px-6 sm:px-7 font-extrabold text-xs uppercase tracking-widest rounded-md bg-[#10b981] hover:bg-[#059669] text-[#05303c] hover:text-white transition-all duration-305 flex items-center justify-center gap-2 cursor-pointer border-none shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:scale-102 active:scale-98"
                >
                  <span>Explore Solutions</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>

                <button
                  onClick={() => onNavigate('#ai-support')}
                  className="h-11 sm:h-12 w-full sm:w-auto px-6 sm:px-7 font-extrabold text-xs uppercase tracking-widest rounded-md bg-[#0A2342] hover:bg-[#05182d] text-white border border-slate-700/60 transition-all duration-305 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102 active:scale-98"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 animate-pulse" />
                  <span>Ask Voltrix AI</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Features Banner */}
      <div className="w-full bg-[#03403f] py-8 text-white relative z-10 font-sans border-t border-emerald-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 tracking-wide">

            {/* Feature 1 */}
            <div className="flex items-start space-x-3.5 p-2">
              <div className="text-emerald-400 mt-1 shrink-0 p-1.5 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-100">Sustainable Power</h4>
                <p className="text-slate-300 text-[11px] font-semibold mt-1 leading-relaxed">Environmentally friendly solutions for a greener future.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-3.5 p-2">
              <div className="text-emerald-400 mt-1 shrink-0 p-1.5 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-100">Reliable Performance</h4>
                <p className="text-slate-300 text-[11px] font-semibold mt-1 leading-relaxed">Engineered for durability, built to last.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-3.5 p-2">
              <div className="text-emerald-400 mt-1 shrink-0 p-1.5 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-100">Cost Efficient</h4>
                <p className="text-slate-300 text-[11px] font-semibold mt-1 leading-relaxed">Maximize efficiency and reduce operational costs.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start space-x-3.5 p-2">
              <div className="text-emerald-400 mt-1 shrink-0 p-1.5 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-100">Expert Support</h4>
                <p className="text-slate-300 text-[11px] font-semibold mt-1 leading-relaxed">Technical expertise and dedicated support.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Product Categories Section underneath - styled with a clean white background */}
      <div className="w-full relative py-20 sm:py-24 z-10 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
            <h3 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight uppercase">
              Explore Core Power Categories
            </h3>
            <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                id: 'inverter',
                slug: 'inverter',
                title: 'Inverters',
                description: 'Heavy-duty sine wave controllers for continuous workspace loads.',
                icon: Cpu,
                badge: 'Continuous',
                imgSrc: inverterCategoryImg,
                borderClass: 'border-blue-500/40 hover:border-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.15)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.3)]',
                accentText: 'text-blue-300 group-hover:text-blue-200',
                badgeStyle: 'text-blue-300 bg-blue-950/75 border-blue-800/70 group-hover:bg-blue-900/60',
                iconBg: 'bg-blue-950/50 border-blue-800/50 text-blue-400',
              },
              {
                id: 'stabilizer',
                slug: 'stabilizers',
                title: 'Stabilizers',
                description: '±0.5% high-precision correction for CNC, Laser & medical equipment.',
                icon: Activity,
                badge: 'Precision',
                imgSrc: stabilizerImg,
                borderClass: 'border-amber-500/40 hover:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.3)]',
                accentText: 'text-amber-300 group-hover:text-amber-200',
                badgeStyle: 'text-amber-300 bg-amber-950/75 border-amber-800/70 group-hover:bg-amber-900/60',
                iconBg: 'bg-amber-950/50 border-amber-800/50 text-amber-400',
              },
              {
                id: 'ups',
                slug: 'ups',
                title: 'UPS Systems',
                description: 'True double-conversion zero-latency pure sine wave backup.',
                icon: ShieldCheck,
                badge: 'Zero-Latency',
                imgSrc: upsImg,
                borderClass: 'border-indigo-500/40 hover:border-indigo-400 shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.3)]',
                accentText: 'text-indigo-300 group-hover:text-indigo-200',
                badgeStyle: 'text-indigo-300 bg-indigo-950/75 border-indigo-800/70 group-hover:bg-indigo-900/60',
                iconBg: 'bg-indigo-950/50 border-indigo-800/50 text-indigo-400',
              },
              {
                id: 'battery',
                slug: 'batteries',
                title: 'Batteries',
                description: 'Tall tubular & maintenance-free deep-cycle energy reserves.',
                icon: BatteryIcon,
                badge: 'Storage',
                imgSrc: batteriesCategoryImg,
                borderClass: 'border-emerald-500/40 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.3)]',
                accentText: 'text-emerald-300 group-hover:text-emerald-200',
                badgeStyle: 'text-emerald-300 bg-emerald-950/75 border-emerald-800/70 group-hover:bg-emerald-900/60',
                iconBg: 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400',
              },
              {
                id: 'solar',
                slug: 'solar-panels',
                title: 'Solar Power Systems',
                description: 'High-efficiency Mono-PERC smart net-metering integration.',
                icon: Sun,
                badge: 'Green Energy',
                imgSrc: solarImg,
                borderClass: 'border-orange-500/40 hover:border-orange-400 shadow-[0_4px_20px_rgba(249,115,22,0.15)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.3)]',
                accentText: 'text-orange-300 group-hover:text-orange-200',
                badgeStyle: 'text-orange-300 bg-orange-950/75 border-orange-800/70 group-hover:bg-amber-900/60',
                iconBg: 'bg-orange-950/50 border-orange-850/50 text-orange-400',
              },
              {
                id: 'amc-services',
                slug: 'amc-services',
                title: 'AMC & Services',
                description: 'After-sales installation, emergency repair & Annual Maintenance Contracts.',
                icon: Wrench,
                badge: 'Care & Maintenance',
                imgSrc: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
                borderClass: 'border-teal-500/40 hover:border-teal-400 shadow-[0_4px_20px_rgba(20,184,166,0.15)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.3)]',
                accentText: 'text-teal-300 group-hover:text-teal-200',
                badgeStyle: 'text-teal-300 bg-teal-950/75 border-teal-800/70 group-hover:bg-teal-900/60',
                iconBg: 'bg-teal-950/50 border-teal-800/50 text-teal-450',
              },
            ].map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={`bg-slate-900/80 border ${cat.borderClass} rounded-2xl p-4 sm:p-6 h-60 sm:h-68 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer animate-fade-in hover:-translate-y-1`}
                  onClick={() => {
                    onNavigate(`#categories/${cat.slug}`);
                  }}
                >
                  <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden rounded-2xl">
                    <img
                      src={cat.imgSrc || ''}
                      alt={cat.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-all duration-500 scale-100 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-sans font-extrabold text-lg sm:text-lg text-white tracking-tight uppercase group-hover:text-white transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pt-4">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-100 mt-2 leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-medium">
                      {cat.description}
                    </p>
                  </div>

                  <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-5 sm:mt-6 opacity-90 group-hover:opacity-100 transition-all duration-300 relative z-10 ${cat.accentText} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
                    <span>Explore Range</span>
                    <ArrowUpRight className="h-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
