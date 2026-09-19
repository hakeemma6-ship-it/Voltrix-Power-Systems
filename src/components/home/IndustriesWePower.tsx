import React, { useState } from 'react';
import {
  ArrowRight,
  X,
  CheckCircle2,
  Activity,
  Building,
  Server,
  Hotel,
  Sun,
  Factory,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { INDUSTRIES_DATA, Industry } from './industriesData';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Activity,
  Factory,
  Building,
  Server,
  Hotel,
  Sun
};

export default function IndustriesWePower({ onNavigate }: { onNavigate: (hash: string) => void }) {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  const handleOpenRfq = (ind: Industry) => {
    setSelectedIndustry(ind);
  };

  return (
    <section
      className="bg-[#f8fafc] text-slate-800 py-24 sm:py-16 border-t border-b border-slate-200/70 relative z-10 overflow-hidden font-sans"
      id="industries-we-power"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER AREA: Clean, professional, and conversion-focused */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-none uppercase">
            Industries We Power
          </h2>
          <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full mt-4"></div>
        </div>

        {/* MODERN GRID LAYOUT: Strict 3 columns on desktop, 2 on tablet, 2 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-10">
          {INDUSTRIES_DATA.map((ind) => {
            const IconComponent = ICON_MAP[ind.iconName] || Activity;

            return (
              <div
                key={ind.id}
                onClick={() => handleOpenRfq(ind)}
                className="group bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-start select-none min-h-[250px] sm:min-h-[365px]"
              >
                {/* LARGE PROFESSIONAL INDUSTRY IMAGE */}
                <div className="relative h-28 xs:h-36 sm:h-56 w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={ind.imageUrl}
                    alt={`${ind.name} facility protection`}
                    className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700 object-center"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Fine gradient tint overlay for premium subtle contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* CARD BODY TEXT AREA */}
                <div className="p-3 sm:p-6 flex-grow">
                  <div className="space-y-1 sm:space-y-3 text-left">
                    {/* Simple Readable Title */}
                    <h3 className="font-sans font-bold text-slate-950 text-sm sm:text-xl tracking-tight leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1 sm:line-clamp-none">
                      {ind.name}
                    </h3>

                    {/* Short Description */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {ind.desc}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* RATIONALIZED CORPORATE SOLUTION MODAL */}
      {selectedIndustry && (
        <div className="fixed inset-0 z-[160] overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 text-slate-800 animate-scale-up max-h-[90vh]">

            {/* Modal Header Bar */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center space-x-3.5 text-left">
                <div className="h-10 w-10 bg-slate-850 text-emerald-400 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                  {React.createElement(ICON_MAP[selectedIndustry.iconName] || Activity, { className: 'h-5 w-5 stroke-[2]' })}
                </div>
                <div>
                  <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30 leading-none">
                    Industrial Integration Specification
                  </span>
                  <h3 className="font-sans font-extrabold text-base sm:text-lg text-white uppercase tracking-tight leading-tight mt-1 flex items-center gap-2">
                    <span>{selectedIndustry.name}</span>
                    <span className="text-sm" role="img" aria-label={selectedIndustry.name}>
                      {selectedIndustry.emoji}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedIndustry(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
                aria-label="Close Specification"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Symmetrical Single-Column Content Portal */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-left bg-white">

              {/* Sector Profile */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Sector Core Challenges
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-sans font-normal border-l-4 border-emerald-500 pl-4 py-1">
                  {selectedIndustry.longDesc}
                </p>
              </div>

              {/* Grid Solution Framework */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Recommended Equipment */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recommended Engineering Integration
                  </span>
                  <span className="text-sm font-bold text-emerald-700 block leading-snug">
                    {selectedIndustry.recommendedCategory}
                  </span>
                </div>

                {/* Operational Load Range */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Typical Operational Load Rating
                  </span>
                  <span className="text-sm font-bold text-emerald-700 block leading-snug">
                    {selectedIndustry.systemLoadEst}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </section>
  );
}
