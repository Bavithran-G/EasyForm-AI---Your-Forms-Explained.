import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Copy, 
  Check, 
  BookOpen, 
  Search, 
  AlertTriangle,
  ChevronRight,
  FileText
} from 'lucide-react';
import type { FormField, DocumentPage } from '../../types/form';

interface AIFormGuideProps {
  currentPageData: DocumentPage;
  allPages: DocumentPage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedField: FormField | null;
  onSelectField: (field: FormField) => void;
  onCopyExplanation: (text: string, key?: string) => void;
  copiedKey: string | null;
}

export const AIFormGuide: React.FC<AIFormGuideProps> = ({
  currentPageData,
  allPages,
  currentPage,
  onPageChange,
  selectedField,
  onSelectField,
  onCopyExplanation,
  copiedKey,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageFilter, setPageFilter] = useState<'current' | 'all'>('current');

  // Fields to display based on filter
  const displayedFields = useMemo(() => {
    const list = pageFilter === 'current' 
      ? currentPageData.fields 
      : allPages.flatMap((p) => p.fields);

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (f) =>
        f.text.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.whatToEnter.toLowerCase().includes(q) ||
        (f.sectionTitle && f.sectionTitle.toLowerCase().includes(q))
    );
  }, [pageFilter, currentPageData, allPages, searchQuery]);

  // Clean field title helper
  const formatFieldLabel = (rawText: string) => {
    return rawText.replace(/^\d+\.\s*/, '').split('(')[0].trim();
  };

  const handleFieldClick = (field: FormField) => {
    // If field belongs to a different page, navigate to that page first
    if (field.page && field.page !== currentPage) {
      onPageChange(field.page);
    }
    onSelectField(field);

    // Scroll to the field element on the document
    setTimeout(() => {
      const el = document.getElementById(`form-field-${field.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }, 100);
  };

  return (
    <aside
      className="w-full rounded-2xl bg-white/95 dark:bg-[#1E2220]/95 border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-colors duration-300"
      aria-label="AI Form Guide & Quick Jump"
    >
      {/* 1. Header: AI FORM GUIDE */}
      <div className="p-5 pb-4 border-b border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] bg-gradient-to-b from-[#F0FAF6]/60 dark:from-[#2E2E2E]/40 to-transparent">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#2EB688] font-bold">
            <Sparkles className="w-4 h-4 text-[#2EB688] animate-pulse" />
            <span>AI FORM GUIDE</span>
          </div>
          <span className="text-[11px] font-mono text-[#6B706D] dark:text-[#ACAFAB] px-2 py-0.5 rounded-full bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)]">
            Copilot Active
          </span>
        </div>
        <p className="text-xs text-[#6B706D] dark:text-[#ACAFAB] font-sans">
          Jump to a field or select one on the document.
        </p>

        {/* Search / Filter Input */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B706D] dark:text-[#ACAFAB]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fields or clauses..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono bg-[#F0FAF6] dark:bg-[#111214] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2E2E2E] dark:text-white placeholder-[#ACAFAB] focus:outline-none focus:border-[#2EB688] transition-colors"
          />
        </div>

        {/* Page Filter Pill Switch */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B706D] dark:text-[#ACAFAB] mr-1">
            Scope:
          </span>
          <button
            onClick={() => setPageFilter('current')}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
              pageFilter === 'current'
                ? 'bg-[#2EB688] text-white font-bold shadow-sm'
                : 'text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white'
            }`}
          >
            Page {currentPage} ({currentPageData.fields.length})
          </button>
          <button
            onClick={() => setPageFilter('all')}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
              pageFilter === 'all'
                ? 'bg-[#2EB688] text-white font-bold shadow-sm'
                : 'text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white'
            }`}
          >
            All Pages ({allPages.reduce((acc, p) => acc + p.fields.length, 0)})
          </button>
        </div>
      </div>

      {/* 2. QUICK JUMP: Vertically Stacked List */}
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#6B706D] dark:text-[#ACAFAB]">
            QUICK JUMP
          </span>
          <span className="text-[10px] font-mono text-[#ACAFAB] dark:text-[#6B706D]">
            {displayedFields.length} {displayedFields.length === 1 ? 'field' : 'fields'}
          </span>
        </div>

        {/* Scrollable list container */}
        <div 
          tabIndex={0}
          aria-label="Form Fields List"
          className="max-h-[260px] sm:max-h-[300px] overflow-y-auto pr-1 space-y-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2EB688] rounded-lg"
        >
          {displayedFields.map((field) => {
            const isSelected = selectedField?.id === field.id;
            const label = formatFieldLabel(field.text);

            return (
              <button
                key={field.id}
                onClick={() => handleFieldClick(field)}
                className={`w-full group text-left px-3 py-2.5 rounded-xl text-xs font-sans transition-all duration-200 flex items-center justify-between gap-2 border ${
                  isSelected
                    ? 'bg-[#CEF1E4]/50 dark:bg-[#2E2E2E] text-[#2E2E2E] dark:text-white font-semibold border-[#2EB688]/40 dark:border-[#2EB688]/50 shadow-sm'
                    : 'bg-[#F0FAF6]/60 dark:bg-[#111214]/60 hover:bg-[#CCF0E6]/30 dark:hover:bg-[#252A28] text-[#2E2E2E] dark:text-[#ACAFAB] border-transparent hover:border-[#CEF1E4] dark:hover:border-[rgba(206,241,228,0.12)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Subtle accent indicator dot */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#2EB688] scale-110 shadow-[0_0_8px_rgba(46,182,136,0.6)]'
                        : 'bg-[#ACAFAB] opacity-40 group-hover:opacity-80'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB]">
                  {pageFilter === 'all' && field.page && (
                    <span className="px-1 py-0.2 rounded bg-[#CEF1E4]/50 dark:bg-[#2E2E2E] text-[9px]">
                      P.{field.page}
                    </span>
                  )}
                  <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'translate-x-0.5 text-[#2EB688]' : 'opacity-40 group-hover:opacity-100'}`} />
                </div>
              </button>
            );
          })}

          {displayedFields.length === 0 && (
            <div className="text-center py-6 text-xs text-[#6B706D] dark:text-[#ACAFAB] font-mono">
              No matching form fields found.
            </div>
          )}
        </div>
      </div>

      {/* 3. EXPLANATION AREA */}
      <div className="p-5 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] bg-[#F0FAF6]/60 dark:bg-[#141715]/80">
        {selectedField ? (
          <div
            key={selectedField.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col space-y-3.5"
          >
            {/* Header: Easy Explanation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2EB688] uppercase">
                <Lightbulb className="w-4 h-4 text-[#2EB688]" />
                <span>EASY EXPLANATION</span>
              </div>
              <span className="text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB]">
                Field {selectedField.id}
              </span>
            </div>

            {/* Field Title */}
            <div>
              <h4 className="text-sm font-bold text-[#2E2E2E] dark:text-white font-sans leading-snug">
                {selectedField.text}
              </h4>
              {selectedField.sectionTitle && (
                <span className="text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB] uppercase mt-0.5 block">
                  {selectedField.sectionTitle}
                </span>
              )}
            </div>

            {/* Plain-English Explanation */}
            <p className="text-xs text-[#2E2E2E] dark:text-[#ACAFAB] leading-relaxed font-sans">
              {selectedField.explanation}
            </p>

            {/* WHAT TO ENTER Box */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#2EB688] mb-1">
                <span>WHAT TO ENTER</span>
                <button
                  onClick={() => onCopyExplanation(selectedField.whatToEnter, 'whatToEnter')}
                  className="text-[10px] text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2EB688] flex items-center gap-1 focus:outline-none"
                  title="Copy sample value"
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
              <p className="text-xs font-mono font-medium text-[#2E2E2E] dark:text-white select-all">
                {selectedField.whatToEnter}
              </p>
              {selectedField.exampleValue && (
                <div className="mt-1.5 pt-1.5 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] text-[10px] text-[#6B706D] dark:text-[#ACAFAB]">
                  <span className="font-semibold text-[#2EB688] mr-1">Example:</span>
                  <span className="italic">{selectedField.exampleValue}</span>
                </div>
              )}
            </div>

            {/* Common Mistake Warning if present */}
            {selectedField.commonMistake && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 dark:bg-[#2E1813]/60 border border-red-500/30 dark:border-[#8B251A]/40 text-[11px] text-red-700 dark:text-[#F3C5BA]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-[#E05342] flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{selectedField.commonMistake}</span>
              </div>
            )}

            {/* Source Grounding */}
            {selectedField.source && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6B706D] dark:text-[#ACAFAB]">
                <BookOpen className="w-3 h-3 text-[#2EB688] flex-shrink-0" />
                <span className="truncate">SOURCE: {selectedField.source}</span>
              </div>
            )}

            {/* Action: Copy Full Explanation */}
            <button
              onClick={() =>
                onCopyExplanation(
                  `${selectedField.text}\n\nExplanation: ${selectedField.explanation}\n\nWhat to enter: ${selectedField.whatToEnter}`,
                  'explanation'
                )
              }
              id="btn-guide-copy-explanation"
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
                copiedKey === 'explanation'
                  ? 'bg-[#1E8561] text-white shadow-[0_0_15px_rgba(46,182,136,0.5)]'
                  : 'bg-[#2EB688] hover:bg-[#259B73] text-white hover:shadow-lg'
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
        ) : (
          /* Empty State when no field selected */
          <div className="py-6 px-3 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2EB688] flex items-center justify-center mb-2.5 shadow-sm">
              <FileText className="w-5 h-5 opacity-70" />
            </div>
            <h5 className="text-xs font-bold text-[#2E2E2E] dark:text-white font-sans mb-1">
              Select a field to understand it
            </h5>
            <p className="text-[11px] text-[#6B706D] dark:text-[#ACAFAB] font-sans max-w-xs leading-relaxed">
              Click any bounding box on the official form or choose an item from the Quick Jump list above.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
