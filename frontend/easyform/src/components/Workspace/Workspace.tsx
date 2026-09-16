import React, { useState } from 'react';
import { 
  UploadCloud, 
  Camera, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { UploadModal } from '../Upload/UploadModal';
import { UploadProgress } from '../Upload/UploadProgress';
import { AnalysisProgress } from '../Analysis/AnalysisProgress';
import { DocumentViewer } from '../DocumentViewer/DocumentViewer';
import { analyzeForm, applyExplanation, explainField, pageUrl, statusToDocument, type BackendStatus } from '../../lib/easyformApi';
import type { FormField, MockDocument } from '../../types/form';

interface WorkspaceProps {
  onBackToLanding?: () => void;
}

type WorkspaceState = 'select' | 'uploading' | 'analyzing' | 'viewing';

export const Workspace: React.FC<WorkspaceProps> = ({ onBackToLanding }) => {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('select');
  const [modalMode, setModalMode] = useState<'upload' | 'camera' | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('Standard_Application_Form_4B_2026.pdf');
  const [liveStatus, setLiveStatus] = useState<BackendStatus | null>(null);
  const [liveDocument, setLiveDocument] = useState<MockDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [apiDone, setApiDone] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  React.useEffect(() => {
    if (apiDone && animDone && workspaceState === 'analyzing') {
      setWorkspaceState('viewing');
    }
  }, [apiDone, animDone, workspaceState]);

  const handleBack = () => {
    if (onBackToLanding) {
      onBackToLanding();
    } else {
      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const startUpload = (file: File | string, instructions?: File | null) => {
    const fileName = typeof file === 'string' ? file : file.name;
    setActiveFileName(fileName);
    setModalMode(null);
    setUploadError(null);
    if (typeof file === 'string') { setLiveStatus(null); setLiveDocument(null); setWorkspaceState('uploading'); return; }
    
    setApiDone(false);
    setAnimDone(false);
    setWorkspaceState('analyzing');
    
    analyzeForm(file, instructions).then((status) => { 
      setLiveStatus(status); 
      setLiveDocument(statusToDocument(status)); 
      setApiDone(true);
    }).catch((error: Error) => {
      // Reset both flags so the scanning screen doesn't stay frozen
      setApiDone(false);
      setAnimDone(false);
      setUploadError(error.message || 'Failed to reach the backend. Make sure the server is running on port 8000.');
      setWorkspaceState('select'); 
    });
  };

  const handleUploadComplete = () => {
    setWorkspaceState('analyzing');
  };

  const handleAnalysisComplete = () => {
    setAnimDone(true);
  };

  // If in Document Viewer state
  if (workspaceState === 'viewing') {
    return (
      <div id="workspace" className="relative w-full">
        <DocumentViewer
          fileName={activeFileName}
          documentData={liveDocument || undefined}
          pageUrl={liveStatus ? (page) => pageUrl(liveStatus.sid, page) : undefined}
          onFieldSelected={liveStatus ? async (field: FormField) => applyExplanation(field, await explainField(liveStatus.sid, field.id)) : undefined}
          onBackToHome={() => setWorkspaceState('select')}
        />
      </div>
    );
  }

  return (
    <div id="workspace" className="min-h-screen w-full bg-[#F0FAF6] dark:bg-[#111214] text-[#2E2E2E] dark:text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-between overflow-x-hidden transition-colors duration-300">
      {/* Top Header Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-xs font-mono text-[#2E2E2E] dark:text-white hover:bg-[#CEF1E4]/40 dark:hover:bg-[#383D3A] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#6B706D] dark:text-[#ACAFAB]">
          <span className="w-2 h-2 rounded-full bg-[#2EB688] animate-pulse" />
          <span>Secure Citizen Session</span>
        </div>
      </div>

      {/* Main Workspace Stage */}
      <div className="max-w-4xl mx-auto w-full my-auto flex flex-col items-center">
        {uploadError && <div className="mb-5 w-full rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">{uploadError}</div>}
        {/* STATE 1: SELECT ACTION */}
        {workspaceState === 'select' && (
          <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-300">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-xs font-mono uppercase tracking-widest text-[#2EB688] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Document Intelligence Engine</span>
            </div>

            {/* Requested Exact Titles */}
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#2E2E2E] dark:text-white font-sans">
              Let's make your form easy.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#6B706D] dark:text-[#ACAFAB] font-sans font-light max-w-xl">
              Upload a government form or take a photo to get started.
            </p>

            {/* Two Primary Prominent Actions */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              {/* 1. Upload Documents */}
              <button
                onClick={() => setModalMode('upload')}
                id="btn-upload-documents"
                className="group relative p-8 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#2E2E2E] dark:to-[#1E2220] border-2 border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] hover:border-[#2EB688] dark:hover:border-[#2EB688] transition-all duration-400 flex flex-col items-center text-center shadow-lg dark:shadow-xl hover:shadow-[0_20px_40px_rgba(46,182,136,0.2)] hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2EB688]/40"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CEF1E4]/60 to-[#2EB688]/10 border border-[#2EB688]/40 flex items-center justify-center text-[#2EB688] mb-5 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2E2E2E] dark:text-white font-sans mb-1 group-hover:text-[#2EB688] transition-colors">
                  Upload Documents
                </h3>
                <p className="text-xs text-[#6B706D] dark:text-[#ACAFAB] font-sans">
                  Drop scanned PDFs, JPG, or PNG files
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-xs font-mono text-[#2EB688]">
                  <span>Browse files</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* 2. Take a Photo */}
              <button
                onClick={() => setModalMode('camera')}
                id="btn-take-photo"
                className="group relative p-8 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#2E2E2E] dark:to-[#1E2220] border-2 border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] hover:border-[#2EB688] dark:hover:border-[#2EB688] transition-all duration-400 flex flex-col items-center text-center shadow-lg dark:shadow-xl hover:shadow-[0_20px_40px_rgba(46,182,136,0.2)] hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2EB688]/40"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CEF1E4]/60 to-[#2EB688]/10 border border-[#2EB688]/40 flex items-center justify-center text-[#2EB688] mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2E2E2E] dark:text-white font-sans mb-1 group-hover:text-[#2EB688] transition-colors">
                  Take a Photo
                </h3>
                <p className="text-xs text-[#6B706D] dark:text-[#ACAFAB] font-sans">
                  Use device camera on physical paperwork
                </p>
                <div className="mt-5 inline-flex items-center gap-1 text-xs font-mono text-[#2EB688]">
                  <span>Capture document</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* Quick Demo Instant Presets */}
            <div className="mt-14 w-full max-w-2xl text-left bg-white dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6B706D] dark:text-[#ACAFAB]">
                  Or Instant Demo Documents (Click to Test):
                </span>
                <span className="text-[10px] font-mono text-[#2EB688] font-semibold">Ready in 1-Click</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => startUpload('Standard_Application_Form_4B_2026.pdf')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F0FAF6] dark:bg-[#2E2E2E] hover:bg-[#CEF1E4]/40 dark:hover:bg-[#383D3A] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2EB688]/15 border border-[#2EB688]/30 flex items-center justify-center text-[#2EB688]">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2E2E2E] dark:text-white group-hover:text-[#2EB688] transition-colors">
                        Citizen Welfare Scheme — Form 4-B (2026 Edition)
                      </div>
                      <div className="text-[10px] text-[#6B706D] dark:text-[#ACAFAB] font-mono">
                        Aadhaar, income declaration, bank DBT, parent particulars · 2 Pages
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#2EB688] group-hover:translate-x-1 transition-transform">
                    Launch Demo →
                  </span>
                </button>
              </div>
            </div>

            {/* Trust and privacy badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B706D] dark:text-[#ACAFAB] font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2EB688]" />
                <span>Zero Server Storage</span>
              </div>
              <span className="text-[#CEF1E4] dark:text-[rgba(206,241,228,0.2)]">·</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2EB688]" />
                <span>Instant Vision Processing</span>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: UPLOAD PROGRESS ANIMATION */}
        {workspaceState === 'uploading' && (
          <UploadProgress
            fileName={activeFileName}
            onComplete={handleUploadComplete}
          />
        )}

        {/* STATE 3: AI ANALYSIS PROGRESS ANIMATION */}
        {workspaceState === 'analyzing' && (
          <AnalysisProgress onComplete={handleAnalysisComplete} />
        )}
      </div>

      {/* Upload Modal Drawer */}
      <UploadModal
        isOpen={modalMode !== null}
        mode={modalMode || 'upload'}
        onClose={() => setModalMode(null)}
        onStartUpload={startUpload}
      />

    </div>
  );
};
