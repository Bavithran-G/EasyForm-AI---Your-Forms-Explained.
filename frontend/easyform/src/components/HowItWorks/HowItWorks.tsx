import React from 'react';
import { UploadCloud, MousePointerClick, MessageSquareText, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'UPLOAD',
      tagline: 'Upload a government document or take a photo.',
      description: 'Drag and drop standard PDFs, JPEG/PNG scans, or capture forms directly from your mobile camera. Our AI vision parses the layout instantly.',
      icon: UploadCloud,
      color: 'from-[#CEF1E4]/50 to-[#2EB688]/10',
      iconColor: 'text-[#2EB688]',
    },
    {
      stepNumber: '02',
      title: 'SELECT',
      tagline: 'Click any field or word on the document.',
      description: 'The physical document appears directly on your screen. Tap or click any bounding box, legal term, or confusing bureaucratic clause.',
      icon: MousePointerClick,
      color: 'from-[#CEF1E4]/50 to-[#2EB688]/10',
      iconColor: 'text-[#2EB688]',
    },
    {
      stepNumber: '03',
      title: 'UNDERSTAND',
      tagline: 'Get a simple explanation directly beside the selected content.',
      description: 'A floating contextual card reveals what to enter, common pitfalls to avoid, and exact source citations from the official gazette regulations.',
      icon: MessageSquareText,
      color: 'from-[#CEF1E4]/50 to-[#2EB688]/10',
      iconColor: 'text-[#2EB688]',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background connector line */}
      <div 
        className="hidden md:block absolute top-[52%] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[#CEF1E4] dark:via-[rgba(206,241,228,0.15)] to-transparent pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-xs font-mono uppercase tracking-widest text-[#2EB688] mb-4 shadow-sm">
          Intuitive 3-Step Flow
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2E2E2E] dark:text-white font-sans">
          How Easy Form Works
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#6B706D] dark:text-[#ACAFAB] font-sans font-light leading-relaxed">
          No robotic chat back-and-forth. The document remains the heart of your experience, with explanations delivered directly in place.
        </p>
      </div>

      {/* 3 Step Cards - Horizontal on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.stepNumber}
              className="group relative flex flex-col p-8 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#2E2E2E] dark:to-[#1C1F1D] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] hover:border-[#2EB688]/60 transition-all duration-500 shadow-lg dark:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1.5"
            >
              {/* Card glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#2EB688]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Step indicator header */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[#ACAFAB] dark:text-[#6B706D] group-hover:text-[#2EB688] transition-colors duration-300">
                  {s.stepNumber}
                </span>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] flex items-center justify-center ${s.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {/* Step Title & Tagline */}
              <h3 className="text-xl font-bold text-[#2E2E2E] dark:text-white tracking-wide mb-2 uppercase font-mono">
                {s.title}
              </h3>
              <p className="text-base font-medium text-[#2EB688] mb-4 font-sans">
                {s.tagline}
              </p>

              {/* Detailed Description */}
              <p className="text-sm text-[#6B706D] dark:text-[#ACAFAB] leading-relaxed font-sans mt-auto">
                {s.description}
              </p>

              {/* Subtle hover arrow */}
              <div className="mt-6 pt-4 border-t border-[#CEF1E4]/60 dark:border-[rgba(206,241,228,0.12)] flex items-center text-xs font-mono text-[#6B706D] dark:text-[#ACAFAB] group-hover:text-[#2EB688] transition-colors">
                <span>Phase {s.stepNumber}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
