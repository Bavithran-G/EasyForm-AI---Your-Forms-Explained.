import React, { useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  X, 
  Copy, 
  Check, 
  BookOpen, 
  AlertTriangle 
} from 'lucide-react';
import type { ExplanationSelection } from '../../types/form';

interface ExplanationPopupProps {
  selection: ExplanationSelection;
  onClose: () => void;
  onCopy: (text: string, key?: string) => void;
  copiedKey: string | null;
  containerRect?: DOMRect | null;
}

export const ExplanationPopup: React.FC<ExplanationPopupProps> = ({
  selection,
  onClose,
  onCopy,
  copiedKey,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Attach with slight timeout so the field click itself doesn't trigger outside click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  // Position calculation: anchor beside the field
  // If field is on right half of document (> 50%), position popup to the left
  // Otherwise position to the right
  const posX = selection.position.x;
  const posY = selection.position.y;
  const isRightAligned = posX > 48;

  // On desktop: floating popup anchored to field
  // On mobile: fixed bottom sheet with high visibility
  return (
    <>
      {/* Desktop Anchored Contextual Popup */}
      <div
        ref={popupRef}
        role="dialog"
        aria-label="Easy Explanation"
        style={{
          top: `${Math.max(10, Math.min(posY, 72))}%`,
          ...(isRightAligned
            ? { right: `${100 - posX + 2}%` }
            : { left: `${posX + (selection.position.width || 30) + 2}%` }),
        }}
        className="hidden md:flex flex-col absolute z-40 w-[360px] max-w-[90vw] p-5 rounded-2xl bg-white/95 dark:bg-[#2E2E2E]/95 border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-[0_20px_50px_-10px_rgba(46,182,136,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 transition-colors"
      >
        {/* Glow corner marker */}
        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-[#2EB688] shadow-[0_0_12px_#2EB688]" />

        {/* Top Header: Badge & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] mb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#2EB688] uppercase">
            <div className="p-1 rounded-md bg-[#2EB688]/10 text-[#2EB688] border border-[#2EB688]/30">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <span>EASY EXPLANATION</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] transition-colors focus:outline-none"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Field Name / Selected Word */}
        <h4 className="text-base font-bold text-[#2E2E2E] dark:text-white font-sans mb-2 leading-snug">
          {selection.title}
        </h4>

        {/* Simplified Plain-English Explanation */}
        <p className="text-xs sm:text-sm text-[#2E2E2E] dark:text-[#ACAFAB] leading-relaxed font-sans mb-4">
          {selection.explanation}
        </p>

        {/* WHAT TO ENTER section */}
        <div className="p-3 rounded-xl bg-[#F0FAF6] dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] mb-3">
          <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase text-[#2EB688] mb-1">
            <span>WHAT TO ENTER</span>
            <button
              onClick={() => onCopy(selection.whatToEnter, 'whatToEnter')}
              className="text-[10px] text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2EB688] flex items-center gap-1 focus:outline-none"
              title="Copy sample entry"
            >
              {copiedKey === 'whatToEnter' ? (
                <>
                  <Check className="w-3 h-3 text-[#2EB688]" />
                  <span className="text-[#2EB688]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs font-mono text-[#2E2E2E] dark:text-white font-medium selection:bg-[#2EB688]/30">
            {selection.whatToEnter}
          </p>
          {selection.exampleValue && (
            <div className="mt-1.5 pt-1.5 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] text-[11px] text-[#6B706D] dark:text-[#ACAFAB] flex items-center gap-1">
              <span className="font-semibold text-[#2EB688]">Example:</span>
              <span className="italic">{selection.exampleValue}</span>
            </div>
          )}
        </div>

        {/* Common Pitfall (if exists) */}
        {selection.commonMistake && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 dark:bg-[#2E1813]/60 border border-red-500/30 dark:border-[#8B251A]/40 mb-3 text-[11px] text-red-700 dark:text-[#F3C5BA]">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-[#E05342] flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{selection.commonMistake}</span>
          </div>
        )}

        {/* Official Source Grounding */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB] mb-4">
          <BookOpen className="w-3.5 h-3.5 text-[#2EB688] flex-shrink-0" />
          <span className="truncate">SOURCE: {selection.source}</span>
        </div>

        {/* Primary Action: Copy Explanation */}
        <button
          onClick={() => onCopy(`${selection.title}\n\nExplanation: ${selection.explanation}\n\nWhat to enter: ${selection.whatToEnter}`, 'explanation')}
          id="btn-copy-explanation"
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            copiedKey === 'explanation'
              ? 'bg-[#1E8561] text-white shadow-[0_0_20px_rgba(46,182,136,0.4)]'
              : 'bg-[#2EB688] hover:bg-[#259B73] text-white shadow-md hover:shadow-lg'
          }`}
        >
          {copiedKey === 'explanation' ? (
            <>
              <Check className="w-4 h-4 animate-in zoom-in-50 duration-200" />
              <span>Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Explanation</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Bottom Sheet (Responsive) */}
      <div
        ref={popupRef}
        role="dialog"
        aria-label="Easy Explanation"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 p-5 bg-white dark:bg-[#2E2E2E] border-t-2 border-[#2EB688] rounded-t-3xl shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[80vh] overflow-y-auto transition-colors"
      >
        {/* Pull indicator bar */}
        <div className="w-12 h-1.5 rounded-full bg-[#CEF1E4] dark:bg-[#383D3A] mx-auto mb-4" />

        <div className="flex items-center justify-between pb-2 border-b border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] mb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2EB688] uppercase">
            <Lightbulb className="w-4 h-4" />
            <span>EASY EXPLANATION</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#CCF0E6]/50 dark:bg-[#1E2220] text-[#6B706D] dark:text-[#ACAFAB]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="text-base font-bold text-[#2E2E2E] dark:text-white font-sans mb-1">
          {selection.title}
        </h4>
        <p className="text-xs text-[#2E2E2E] dark:text-[#ACAFAB] leading-relaxed mb-3">
          {selection.explanation}
        </p>

        <div className="p-3 rounded-xl bg-[#F0FAF6] dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] mb-3">
          <div className="text-[10px] font-mono text-[#2EB688] font-bold mb-1">WHAT TO ENTER</div>
          <p className="text-xs font-mono text-[#2E2E2E] dark:text-white">{selection.whatToEnter}</p>
        </div>

        <div className="text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB] mb-4">
          SOURCE: {selection.source}
        </div>

        <button
          onClick={() => onCopy(`${selection.title}\n${selection.explanation}`, 'explanation')}
          className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 ${
            copiedKey === 'explanation' ? 'bg-[#1E8561] text-white' : 'bg-[#2EB688] text-white'
          }`}
        >
          {copiedKey === 'explanation' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedKey === 'explanation' ? 'Copied ✓' : 'Copy Explanation'}</span>
        </button>
      </div>
    </>
  );
};
