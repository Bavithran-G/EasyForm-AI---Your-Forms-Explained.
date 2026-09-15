import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface UploadProgressProps {
  fileName?: string;
  onComplete: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName = 'Standard_Application_Form_4B_2026.pdf',
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Uploading document...');
  const [statePhase, setStatePhase] = useState<'uploading' | 'processing' | 'ready'>('uploading');

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Realistic simulated non-linear progression
      if (current < 45) {
        current += Math.floor(Math.random() * 8) + 4;
      } else if (current < 85) {
        current += Math.floor(Math.random() * 6) + 2;
        setStatusText('Extracting vector structure...');
        setStatePhase('processing');
      } else if (current < 99) {
        current += Math.floor(Math.random() * 3) + 1;
        setStatusText('Optimizing document canvas...');
      } else {
        current = 100;
        setProgress(100);
        setStatusText('Document uploaded');
        setStatePhase('ready');
        clearInterval(interval);

        // Small success delay before transitioning to Analysis stage
        setTimeout(() => {
          onComplete();
        }, 800);
      }
      setProgress(Math.min(current, 100));
    }, 90);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 max-w-lg w-full mx-auto bg-white dark:bg-[#1E2220] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] rounded-3xl shadow-2xl transition-colors">
      {/* Animated File Icon & Pulse */}
      <div className="relative mb-6">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
          statePhase === 'ready'
            ? 'bg-[#2EB688]/15 dark:bg-[#2EB688]/20 border-[#2EB688] text-[#2EB688] shadow-[0_0_30px_rgba(46,182,136,0.35)]'
            : 'bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2EB688] shadow-[0_0_25px_rgba(46,182,136,0.2)]'
        }`}>
          {statePhase === 'ready' ? (
            <CheckCircle2 className="w-10 h-10 text-[#2EB688] animate-in zoom-in-50 duration-300" />
          ) : (
            <FileText className="w-10 h-10 animate-pulse text-[#2EB688]" />
          )}
        </div>

        {statePhase !== 'ready' && (
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-[#111214] border border-[#2EB688]/50 shadow-sm">
            <Loader2 className="w-4 h-4 text-[#2EB688] animate-spin" />
          </div>
        )}
      </div>

      {/* Progress Heading */}
      <h3 className="text-xl font-bold text-[#2E2E2E] dark:text-white font-sans flex items-center gap-2">
        {statusText}
        {statePhase === 'ready' && <Sparkles className="w-5 h-5 text-[#2EB688]" />}
      </h3>

      {/* File Name */}
      <p className="mt-1.5 text-xs sm:text-sm font-mono text-[#6B706D] dark:text-[#ACAFAB] max-w-xs truncate text-center">
        {fileName}
      </p>

      {/* Elegant Progress Bar */}
      <div className="w-full mt-6">
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="uppercase tracking-wider text-[#6B706D] dark:text-[#ACAFAB]">
            {statePhase.toUpperCase()}
          </span>
          <span className="font-bold text-[#2EB688]">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#CCF0E6]/40 dark:bg-[#2E2E2E] rounded-full overflow-hidden p-0.5 border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)]">
          <div
            className="h-full bg-gradient-to-r from-[#2EB688] to-[#3FCB9C] rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(46,182,136,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Security note */}
      <p className="mt-6 text-[11px] text-[#6B706D] dark:text-[#ACAFAB] font-mono text-center">
        Zero-retention encryption active · Document parsed in memory
      </p>
    </div>
  );
};
