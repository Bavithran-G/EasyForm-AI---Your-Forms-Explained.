import React from 'react';
import { 
  FileCheck2, 
  Target, 
  BookOpenCheck, 
  LayoutDashboard, 
  Copy, 
  Eye 
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      num: '01',
      title: 'Whole Form Simplification',
      desc: 'Every single field, table row, and statutory footnote is translated into clear, citizen-friendly language without legalistic jargon.',
      icon: FileCheck2,
    },
    {
      num: '02',
      title: 'Field-Level AI Guidance',
      desc: 'Pinpoint precision. Click any exact input box or highlight single words to unlock micro-guidance tailored to that exact clause.',
      icon: Target,
    },
    {
      num: '03',
      title: 'Official-Source Grounding',
      desc: 'Every simplified answer cites the official gazette clause, department manual page number, and legal authority so you can verify with certainty.',
      icon: BookOpenCheck,
    },
    {
      num: '04',
      title: 'Contextual Explanations',
      desc: 'No detached sidebars or separate chat windows. High-clarity explanation popups anchor right next to your active selection on the document canvas.',
      icon: LayoutDashboard,
    },
    {
      num: '05',
      title: 'One-Click Copy Explanation',
      desc: 'Instantly copy exact simplified descriptions or formatted sample entries to your clipboard with a single tap for offline reference.',
      icon: Copy,
    },
    {
      num: '06',
      title: 'Document-Centered Experience',
      desc: 'The genuine government form stays front and center. You see the authentic page layout, stamps, seals, and barcodes as they actually exist.',
      icon: Eye,
    },
  ];

  return (
    <section id="clarity" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Anchor alias for legacy links */}
      <span id="features" className="sr-only" />
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/2 -right-40 w-96 h-96 bg-[#2EB688]/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-10 -left-40 w-96 h-96 bg-[#CEF1E4]/20 dark:bg-[#2EB688]/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-xs font-mono uppercase tracking-widest text-[#2EB688] mb-4 shadow-sm">
          Engineered for Citizens
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2E2E2E] dark:text-white font-sans">
          Designed for Absolute Clarity
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#6B706D] dark:text-[#ACAFAB] font-sans font-light leading-relaxed">
          Government paperwork should not require a lawyer to decipher. Easy Form bridges the gap between bureaucratic complexity and human understanding.
        </p>
      </div>

      {/* 6 Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.num}
              className="group relative p-7 rounded-2xl bg-white dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] hover:border-[#2EB688]/60 hover:bg-[#F0FAF6] dark:hover:bg-[#2E2E2E] transition-all duration-400 shadow-md dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between"
            >
              {/* Top Row: Icon + Number */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-lg bg-[#CCF0E6]/40 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] flex items-center justify-center text-[#2EB688] group-hover:bg-[#2EB688]/15 group-hover:border-[#2EB688] transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#6B706D] dark:text-[#ACAFAB] uppercase">
                    FEATURE {f.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#2E2E2E] dark:text-white tracking-normal mb-2.5 font-sans group-hover:text-[#2EB688] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-[#6B706D] dark:text-[#ACAFAB] leading-relaxed font-sans">
                  {f.desc}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="mt-6 w-full h-0.5 bg-[#CEF1E4]/50 dark:bg-[rgba(206,241,228,0.1)] group-hover:bg-[#2EB688]/50 transition-colors duration-400" />
            </div>
          );
        })}
      </div>
    </section>
  );
};
