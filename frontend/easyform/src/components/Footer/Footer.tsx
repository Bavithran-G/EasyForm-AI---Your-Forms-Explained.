import React from 'react';
import { FileText, Shield, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenWorkspace: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenWorkspace }) => {
  return (
    <footer id="about" className="relative bg-white dark:bg-[#111214] border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] text-[#6B706D] dark:text-[#ACAFAB] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] flex items-center justify-center text-[#2EB688]">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-mono text-base font-bold tracking-widest text-[#2E2E2E] dark:text-white">
              EASY FORM
            </span>
          </div>
          <p className="text-xs text-[#6B706D] dark:text-[#ACAFAB] max-w-sm font-sans leading-relaxed">
            Democratizing civic participation and administrative accessibility through document-centric vision AI.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono uppercase tracking-wider text-[#6B706D] dark:text-[#ACAFAB]">
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#2EB688] transition-colors"
          >
            Workspace
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#2EB688] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#clarity"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('clarity')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#2EB688] transition-colors"
          >
            Designed for Clarity
          </a>
          <span className="flex items-center gap-1 text-[#2EB688]">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Data Stored</span>
          </span>
        </div>

        {/* Action button */}
        <div>
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#2EB688] hover:bg-[#259B73] transition-colors shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Easy Form</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#ACAFAB] dark:text-[#6B706D] font-mono">
        <p>© 2026 EASY FORM. All rights reserved. Hackathon Production Prototype.</p>
        <p className="flex items-center gap-1">
          Crafted with care for citizens everywhere
        </p>
      </div>
    </footer>
  );
};
