import React from 'react';
import { 
  Cpu, 
  Wrench, 
  Headphones, 
  ShieldCheck, 
  Sun, 
  Factory 
} from 'lucide-react';

interface Benefit {
  id: string;
  stepNumber: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
}

export default function WhyChooseVoltrix({ onNavigate }: { onNavigate: (hash: string) => void }) {
  const benefits: Benefit[] = [
    {
      id: 'servo-tech',
      stepNumber: '01',
      title: 'Advanced Servo Technology',
      desc: 'High-precision copper-wound transformers combined with microprocessor controllers to provide a stable voltage corridor with ultra-fast correction response.',
      icon: Cpu
    },
    {
      id: 'expert-install',
      stepNumber: '02',
      title: 'Technical Guidance',
      desc: 'Expert assistance with qualified electrical engineers ensuring optimal capacity sizing, mechanical integrity, cabling checks, and full grid integration.',
      icon: Wrench
    },
    {
      id: 'tech-support',
      stepNumber: '03',
      title: 'Expert Consultation Desk',
      desc: 'A responsive around-the-clock remote network helpdesk with dedicated technical specialists on standby to coordinate on-site visits and system advice.',
      icon: Headphones
    },
    {
      id: 'power-security',
      stepNumber: '04',
      title: 'Requirement Analysis',
      desc: 'Double-conversion backup systems, integrated surge suppression modules, phase reversal safeguards, and automated voltage isolation systems matched to your needs.',
      icon: ShieldCheck
    },
    {
      id: 'solar-integration',
      stepNumber: '05',
      title: 'Solar Inverter Matching',
      desc: 'Smart MPPT battery system linkages and pure sine wave hybrid solar inverter options to optimize carbon-neutral energy production and local grid utilization.',
      icon: Sun
    },
    {
      id: 'ind-solutions',
      stepNumber: '06',
      title: 'Power System Recommendations',
      desc: 'Specially evaluated configurations satisfying heavy industrial motor surges, sensitive MRI hospital diagnostics, and cloud servers, sourced from verified providers.',
      icon: Factory
    }
  ];

  return (
    <section 
      className="bg-[#0A2342] border-t border-slate-850 border-b border-slate-850 text-white py-24 sm:py-32 relative overflow-hidden font-sans" 
      id="home-why-choose"
    >
      {/* Decorative patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#22C55E]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER AREA */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <span className="text-xs font-bold text-[#22C55E] uppercase tracking-widest block">
            ENGINEERING QUALITY ADVANTAGES
          </span>
          <h2 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight uppercase">
            WHY SERVO STABILIZERS ARE USED
          </h2>
          <div className="h-1 w-16 bg-[#22C55E] mx-auto rounded-full mt-4"></div>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
            The VOLTRIX platform recommends and matches custom industrial-tested engineering architectures designed to secure continuous operations, reduce operational expenses, and minimize power sags.
          </p>
        </div>

        {/* 6 BENEFIT BLOCKS */}
        <div className="relative">
          {/* Subtle connecting line - colored subtly */}
          <div className="hidden lg:block absolute top-[52px] left-8 right-8 h-0.5 bg-slate-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-10 relative z-10">
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <div 
                  key={benefit.id} 
                  className="group flex flex-col items-start text-left relative space-y-4 p-6 rounded-xl bg-[#0f2d54] border border-slate-700/50 shadow-md hover:shadow-lg hover:border-[#22C55E]/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between w-full">
                    
                    {/* Circle container */}
                    <div className="flex items-center space-x-4">
                      <div className="h-14 w-14 rounded-full flex items-center justify-center border border-[#22C55E]/20 bg-slate-900/45 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[#22C55E]/10">
                        <IconComponent className="h-6 w-6 text-[#22C55E] text-center stroke-[2px]" />
                      </div>
                      
                      <span className="text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded">
                        BENEFIT {benefit.stepNumber}
                      </span>
                    </div>

                  </div>

                  {/* Title and descriptive content text */}
                  <div className="space-y-2 pt-2">
                    <h3 className="font-sans font-bold text-white group-hover:text-[#22C55E] transition-colors duration-300 text-xl tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button Segment */}
        <div className="mt-16 text-center">
          <button
            onClick={() => onNavigate('#contact')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-widest rounded transition-all duration-300 shadow-sm cursor-pointer border-none font-sans"
          >
            <span>Request customized blueprint recommendations</span>
            <span className="font-semibold"></span>
          </button>
        </div>

      </div>
    </section>
  );
}
