import React from 'react';
import { useDocumentInteraction } from '../../hooks/useDocumentInteraction';
import { DocumentToolbar } from './DocumentToolbar';
import { GovernmentFormSheet } from './GovernmentFormSheet';
import { ExplanationPopup } from '../ExplanationPopup/ExplanationPopup';
import { AIFormGuide } from './AIFormGuide';
import { ArrowLeft, FileText } from 'lucide-react';
import type { MockDocument } from '../../types/form';

interface DocumentViewerProps {
  onBackToHome?: () => void;
  fileName?: string;
  documentData?: MockDocument;
  pageUrl?: (page: number) => string;
  onFieldSelected?: (field: import('../../types/form').FormField) => Promise<import('../../types/form').FormField | void> | import('../../types/form').FormField | void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  onBackToHome,
  fileName = 'Standard_Application_Form_4B_2026.pdf',
  documentData: inputDocumentData,
  pageUrl,
  onFieldSelected,
}) => {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    currentPageData,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    isFullscreen,
    toggleFullscreen,
    selectedField,
    activeSelection,
    selectField,
    clearSelection,
    handleMouseUp,
    copyExplanation,
    copiedKey,
    containerRef,
    documentData,
  } = useDocumentInteraction({ documentData: inputDocumentData, onFieldSelected });

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen flex flex-col bg-[#F0FAF6] dark:bg-[#111214] text-[#2E2E2E] dark:text-white overflow-x-hidden transition-colors duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : 'pt-20 pb-12'
      }`}
    >
      {/* Top Bar: Back button & Document Metadata */}
      <div className="max-w-[1560px] mx-auto w-full px-4 sm:px-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-white dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2E2E2E] dark:text-white hover:bg-[#CEF1E4]/40 dark:hover:bg-[#383D3A] transition-colors flex items-center gap-1.5 text-xs font-mono shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Workspace</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2EB688]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2E2E2E] dark:text-white font-sans truncate max-w-[260px] sm:max-w-md">
                {documentData.officialTitle}
              </h2>
              <p className="text-[11px] font-mono text-[#6B706D] dark:text-[#ACAFAB]">
                {fileName} · {documentData.department}
              </p>
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#2EB688] bg-[#2EB688]/10 dark:bg-[#2EB688]/15 border border-[#2EB688]/30 px-3 py-1 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-[#2EB688] animate-pulse" />
          <span>AI Vision Active · Click any field</span>
        </div>
      </div>

      {/* Main Two-Column Workspace Layout: Document (68%) + AI Form Guide (32%) */}
      <div className="max-w-[1560px] mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col lg:flex-row gap-6 items-start pb-12">
        {/* LEFT / MAIN: Government PDF/Document Viewer (68%) */}
        <div className="w-full lg:w-[68%] min-w-0 flex flex-col items-center">
          {/* Floating Toolbar Controls */}
          <div className="w-full mb-4 sticky top-20 z-20">
            <DocumentToolbar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              zoomLevel={zoomLevel}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              onFitToScreen={fitToScreen}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              activeFieldName={selectedField?.text}
            />
          </div>

          {/* Document Canvas Viewport */}
          <div
            className="relative w-full flex justify-center items-start overflow-x-auto min-h-[750px] pb-12 pt-2"
            onClick={clearSelection}
          >
            <div
              className="relative transition-transform duration-200 origin-top flex justify-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Government Paper Sheet */}
              <GovernmentFormSheet
                pageData={currentPageData}
                selectedFieldId={selectedField?.id}
                onSelectField={selectField}
                onMouseUp={handleMouseUp}
                livePageUrl={pageUrl?.(currentPage)}
              />

              {/* Contextual AI Explanation Popup beside selected field */}
              {activeSelection && (
                <ExplanationPopup
                  selection={activeSelection}
                  onClose={clearSelection}
                  onCopy={copyExplanation}
                  copiedKey={copiedKey}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Dedicated AI Form Guide Panel (32%) */}
        <div className="w-full lg:w-[32%] min-w-0 lg:sticky lg:top-24">
          <AIFormGuide
            currentPageData={currentPageData}
            allPages={documentData.pages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            selectedField={selectedField}
            onSelectField={selectField}
            onCopyExplanation={copyExplanation}
            copiedKey={copiedKey}
          />
        </div>
      </div>
    </div>
  );
};
