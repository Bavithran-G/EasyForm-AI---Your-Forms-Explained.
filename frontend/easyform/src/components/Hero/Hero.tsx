import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import { Hero3DCanvas } from './Hero3DCanvas';

interface HeroProps {
  onStartSimplifying: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartSimplifying }) => {
  // Mouse sensitivity reduced by 15% (1.2 * 0.85 = 1.02)
  const coords = useMouseParallax(1.02);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  return (
    <section 
      id="home" 
      className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden pt-20 pb-16 bg-[#F0FAF6] dark:bg-[#111214] transition-colors duration-300"
    >
      {/* 1. Full-Hero 3D Interactive Canvas Layer (Covers 100% of the Hero viewport, z-0) */}
      <Hero3DCanvas mouseX={coords.x} mouseY={coords.y} />

      {/* 2. Hero Content & Typography (z-10, layered cleanly over 3D scene with transparent backgrounds) */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 w-full flex flex-col items-center text-center my-auto pointer-events-none">
        {/* EASY FORM Title: 100% Transparent background, pure text glow, 3D elements visible behind */}
        <div
          onMouseEnter={() => setIsTitleHovered(true)}
          onMouseLeave={() => setIsTitleHovered(false)}
          className="relative cursor-pointer select-none py-1 px-4 max-w-full overflow-visible pointer-events-auto bg-transparent transition-all duration-700"
          role="heading"
          aria-level={1}
          aria-label="EASY FORM"
        >
          <h1
            style={{
              fontFamily: '"Six Caps", sans-serif',
              transformOrigin: 'center center',
              transform: isTitleHovered ? 'scaleX(1.3)' : 'scaleX(1)',
              letterSpacing: isTitleHovered ? '0.2em' : '0.12em',
              transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1), letter-spacing 700ms cubic-bezier(0.16, 1, 0.3, 1), filter 700ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`text-[60px] sm:text-[80px] md:text-[105px] lg:text-[125px] leading-[0.82] font-normal uppercase inline-block m-0 bg-transparent will-change-transform text-[#2E2E2E] dark:text-[#FFFFFF] ${
              isTitleHovered
                ? 'drop-shadow-[0_0_24px_rgba(46,182,136,0.5)] dark:drop-shadow-[0_0_32px_rgba(46,182,136,0.85)]'
                : 'drop-shadow-[0_0_12px_rgba(46,182,136,0.25)] dark:drop-shadow-[0_0_16px_rgba(46,182,136,0.4)]'
            }`}
          >
            EASY FORM
          </h1>
        </div>

        {/* Subtitle in Warm Brown (#7A5638 light, #B88B66 dark) */}
        <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium text-[#7A5638] dark:text-[#B88B66] tracking-wide font-sans pointer-events-auto transition-colors">
          Government forms, made easy.
        </p>

        {/* Descriptive tag line */}
        <p className="mt-3 text-xs sm:text-sm text-[#6B706D] dark:text-[#ACAFAB] max-w-xl font-sans font-normal leading-relaxed pointer-events-auto transition-colors">
          The document-centric AI assistant. Upload any official paperwork, click any confusing clause, and receive instant, plain-English guidance right beside the text.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          <button
            onClick={onStartSimplifying}
            id="hero-start-simplifying"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#2EB688] hover:bg-[#259B73] shadow-[0_8px_30px_rgba(46,182,136,0.4)] hover:shadow-[0_12px_40px_rgba(46,182,136,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2EB688]/50"
          >
            <span>Start Simplifying</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </button>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium text-[#2E2E2E] dark:text-[#CEF1E4] hover:text-[#111214] dark:hover:text-[#FFFFFF] bg-white/90 dark:bg-[#2E2E2E]/80 hover:bg-[#CEF1E4]/40 dark:hover:bg-[#383D3A] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-sm transition-all duration-300 focus:outline-none"
          >
            <span>See How It Works</span>
          </a>
        </div>

        {/* Feature Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B706D] dark:text-[#ACAFAB] font-mono pointer-events-auto transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2EB688]" />
            <span>Official Gazette Grounded</span>
          </div>
          <span className="hidden sm:inline text-[#CEF1E4] dark:text-[rgba(206,241,228,0.2)]">·</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2EB688]" />
            <span>Click Any Field or Word</span>
          </div>
          <span className="hidden sm:inline text-[#CEF1E4] dark:text-[rgba(206,241,228,0.2)]">·</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2EB688] animate-ping" />
            <span>100% Document-Centric</span>
          </div>
        </div>
      </div>
    </section>
  );
};
