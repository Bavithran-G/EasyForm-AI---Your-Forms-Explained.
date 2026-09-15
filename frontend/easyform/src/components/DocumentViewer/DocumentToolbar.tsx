import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Maximize,
  Sparkles
} from 'lucide-react';

interface DocumentToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  activeFieldName?: string | null;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  isFullscreen,
  onToggleFullscreen,
  activeFieldName,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#2E2E2E]/95 border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-xl dark:shadow-2xl backdrop-blur-md max-w-4xl mx-auto w-full transition-colors">
      {/* Left: Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-[#2E2E2E] dark:text-white px-2 py-0.5 rounded bg-[#F0FAF6] dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)]">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Selected Field or Interactive Hint */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#6B706D] dark:text-[#ACAFAB]">
        <Sparkles className="w-3.5 h-3.5 text-[#2EB688]" />
        {activeFieldName ? (
          <span className="truncate max-w-[200px] text-[#2EB688] font-semibold">
            Inspecting: {activeFieldName}
          </span>
        ) : (
          <span className="text-[#6B706D] dark:text-[#ACAFAB]">Click any field or highlight text</span>
        )}
      </div>

      {/* Right: Zoom Controls & Fullscreen */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.65}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] disabled:opacity-30 transition-colors focus:outline-none"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-[#2EB688] font-bold w-12 text-center select-none">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          disabled={zoomLevel >= 2.0}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] disabled:opacity-30 transition-colors focus:outline-none"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#CEF1E4] dark:bg-[rgba(206,241,228,0.15)] mx-1" />

        <button
          onClick={onFitToScreen}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] transition-colors focus:outline-none"
          title="Fit to Screen"
          aria-label="Fit to Screen"
        >
          <Maximize className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] transition-colors focus:outline-none"
          title="Reset Zoom (100%)"
          aria-label="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2EB688] hover:bg-[#CEF1E4]/50 dark:hover:bg-[#383D3A] transition-colors focus:outline-none"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
