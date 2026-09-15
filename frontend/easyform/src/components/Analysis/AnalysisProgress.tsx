import { useState, useEffect } from 'react';
import { Scan, CheckCircle, BrainCircuit } from 'lucide-react';
import type { AnalysisStage } from '../../types/form';

interface AnalysisProgressProps {
  onComplete: () => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState<AnalysisStage>('reading');
  const [overallProgress, setOverallProgress] = useState(12);
  const [discoveredFieldsCount, setDiscoveredFieldsCount] = useState(0);
  const [scanBeamTop, setScanBeamTop] = useState(0);

  const stages: { key: AnalysisStage; label: string; desc: string }[] = [
    { key: 'reading', label: 'Reading document', desc: 'Analyzing layout geometry and typography hierarchy...' },
    { key: 'finding_fields', label: 'Finding fields', desc: 'Detecting input boxes, checkboxes, and stamp perimeters...' },
    { key: 'understanding', label: 'Understanding instructions', desc: 'Cross-referencing statutory regulations and gazettes...' },
    { key: 'preparing', label: 'Preparing explanations', desc: 'Synthesizing plain-English answers and example values...' },
  ];

  // Laser beam continuous scan animation
  useEffect(() => {
    let forward = true;
    let pos = 0;
    const interval = setInterval(() => {
      if (forward) {
        pos += 2;
        if (pos >= 92) forward = false;
      } else {
        pos -= 2;
        if (pos <= 4) forward = true;
      }
      setScanBeamTop(pos);
    }, 24);

    return () => clearInterval(interval);
  }, []);

  // Multi-stage progression timing
  useEffect(() => {
    // Stage 1: Reading (0 - 1.2s)
    const t1 = setTimeout(() => {
      setCurrentStage('finding_fields');
      setOverallProgress(38);
      setDiscoveredFieldsCount(4);
    }, 1200);

    // Stage 2: Finding fields (1.2s - 2.5s)
    const t2 = setTimeout(() => {
      setDiscoveredFieldsCount(8);
      setOverallProgress(65);
    }, 2000);

    // Stage 3: Understanding instructions (2.5s - 3.8s)
    const t3 = setTimeout(() => {
      setCurrentStage('understanding');
      setDiscoveredFieldsCount(12);
      setOverallProgress(84);
    }, 2800);

    // Stage 4: Preparing explanations (3.8s - 4.8s)
    const t4 = setTimeout(() => {
      setCurrentStage('preparing');
      setDiscoveredFieldsCount(15);
      setOverallProgress(96);
    }, 4000);

    // Completion
    const t5 = setTimeout(() => {
      setCurrentStage('completed');
      setOverallProgress(100);
      setTimeout(() => {
        onComplete();
      }, 700);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl w-full mx-auto p-4 sm:p-8">
      {/* Title & Subtext */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1E1E1E] border border-coolgray-200 dark:border-coolgray-700/60 text-primary-600 dark:text-primary-400 text-xs font-mono uppercase tracking-widest mb-3 shadow-sm">
          <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
          <span>Vision AI Parsing Engine</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-charcoal dark:text-white font-sans tracking-tight">
          {currentStage === 'completed' ? 'Your form is ready.' : 'Understanding your form...'}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-coolgray-600 dark:text-coolgray-300 font-sans">
          {currentStage === 'completed'
            ? 'Form analysis complete. Opening interactive document canvas...'
            : 'Preparing your form for easy explanations.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
        {/* Left: Animated Document Preview with Laser Scan Beam */}
        <div className="md:col-span-7 flex justify-center">
          <div className="relative w-[300px] sm:w-[350px] h-[440px] sm:h-[490px] paper-texture rounded-lg border-2 border-[#7F644A]/40 shadow-2xl p-5 overflow-hidden select-none">
            {/* Watermark in background */}
            <div className="paper-watermark">GOV DRAFT</div>

            {/* Simulated Scanned Form Elements */}
            <div className="border border-[#7F644A]/30 p-2 mb-3">
              <div className="flex justify-between items-center border-b border-[#7F644A]/30 pb-1 mb-2">
                <div className="w-8 h-8 rounded-full border border-[#8B251A] flex items-center justify-center text-[#8B251A] text-[7px] font-mono font-bold">
                  SEAL
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-[#2A1F16] font-mono">OFFICIAL CITIZEN FORM 4-B</div>
                  <div className="text-[8px] text-[#5A4533]">PUBLIC WELFARE APPLICATION</div>
                </div>
                <div className="text-[8px] font-mono text-[#7F644A]">P.1/2</div>
              </div>

              {/* Mock fields that light up as scanner passes */}
              <div className="space-y-3">
                {/* Field 1 */}
                <div className={`p-1.5 rounded transition-all duration-300 ${
                  discoveredFieldsCount >= 2 ? 'bg-primary-500/15 ring-1 ring-primary-500/50' : 'bg-transparent'
                }`}>
                  <div className="text-[8px] font-bold text-[#2A1F16]">1. APPLICANT FULL NAME</div>
                  <div className="h-4 border border-[#7F644A]/40 bg-white/40 mt-0.5 px-1 text-[9px] text-[#2A1F16] flex items-center">
                    RAJESH KUMAR SHARMA
                  </div>
                </div>

                {/* Field 2 */}
                <div className={`p-1.5 rounded transition-all duration-300 ${
                  discoveredFieldsCount >= 4 ? 'bg-primary-500/15 ring-1 ring-primary-500/50' : 'bg-transparent'
                }`}>
                  <div className="text-[8px] font-bold text-[#2A1F16]">2. FATHER'S / GUARDIAN'S NAME</div>
                  <div className="h-4 border border-[#7F644A]/40 bg-white/40 mt-0.5 px-1 text-[9px] text-[#2A1F16] flex items-center">
                    SURESH CHANDRA SHARMA
                  </div>
                </div>

                {/* Field 3 */}
                <div className={`p-1.5 rounded transition-all duration-300 ${
                  discoveredFieldsCount >= 8 ? 'bg-primary-500/15 ring-1 ring-primary-500/50' : 'bg-transparent'
                }`}>
                  <div className="text-[8px] font-bold text-[#2A1F16]">3. AADHAAR / ID NUMBER</div>
                  <div className="h-4 border border-[#7F644A]/40 bg-white/40 mt-0.5 px-1 text-[9px] text-[#2A1F16] flex items-center">
                    4829 3920 1928
                  </div>
                </div>

                {/* Field 4 */}
                <div className={`p-1.5 rounded transition-all duration-300 ${
                  discoveredFieldsCount >= 12 ? 'bg-primary-500/15 ring-1 ring-primary-500/50' : 'bg-transparent'
                }`}>
                  <div className="text-[8px] font-bold text-[#2A1F16]">4. PERMANENT ADDRESS & PIN CODE</div>
                  <div className="h-7 border border-[#7F644A]/40 bg-white/40 mt-0.5 p-1 text-[8px] text-[#2A1F16]">
                    PLOT 42, CIVIL LINES, SECTOR 9, JAIPUR 302006
                  </div>
                </div>

                {/* Field 5 */}
                <div className={`p-1.5 rounded transition-all duration-300 ${
                  discoveredFieldsCount >= 14 ? 'bg-primary-500/15 ring-1 ring-primary-500/50' : 'bg-transparent'
                }`}>
                  <div className="text-[8px] font-bold text-[#2A1F16]">5. ANNUAL HOUSEHOLD INCOME & DBT A/C</div>
                  <div className="h-4 border border-[#7F644A]/40 bg-white/40 mt-0.5 px-1 text-[9px] text-[#2A1F16] flex items-center">
                    INR 3,80,000 / SBIN0004921
                  </div>
                </div>
              </div>

              {/* Bottom Stamp & Signature Box */}
              <div className="mt-4 pt-2 border-t border-[#7F644A]/30 flex justify-between items-center">
                <div className="paper-stamp text-[8px] px-2 py-1">
                  OFFICIAL DRAFT
                </div>
                <div className="w-24 h-8 border border-dashed border-[#7F644A] flex items-center justify-center text-[7px] text-[#5A4533]">
                  [SIGNATURE BOX]
                </div>
              </div>
            </div>

            {/* Glowing Laser Scan Beam moving up and down */}
            <div
              className="scan-laser"
              style={{ top: `${scanBeamTop}%` }}
            />
          </div>
        </div>

        {/* Right: Stages & Progress Bar */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-6">
          {/* Progress bar container */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-coolgray-200 dark:border-coolgray-800 shadow-sm dark:shadow-none transition-colors">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-coolgray-600 dark:text-coolgray-300 uppercase tracking-wider">Analysis Status</span>
              <span className="text-primary-600 dark:text-primary-400 font-bold">{overallProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-mint-100/60 dark:bg-[#2A2A2A] rounded-full overflow-hidden p-0.5 border border-coolgray-200 dark:border-coolgray-700/60">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(46,182,136,0.5)]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-coolgray-500 dark:text-coolgray-400">
              <span>Fields Discovered:</span>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{discoveredFieldsCount} detected</span>
            </div>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const isPast = stages.findIndex((s) => s.key === currentStage) > idx || currentStage === 'completed';
              const isCurrent = currentStage === stage.key;

              return (
                <div
                  key={stage.key}
                  className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-white dark:bg-[#252525] border-primary-500/80 dark:border-primary-500/60 shadow-md dark:shadow-lg dark:shadow-primary-500/10'
                      : isPast
                      ? 'bg-white dark:bg-[#1E1E1E] border-coolgray-200 dark:border-coolgray-800/60 opacity-90'
                      : 'bg-white/50 dark:bg-[#18191B] border-transparent opacity-40'
                  }`}
                >
                  <div className="mt-0.5">
                    {isPast ? (
                      <CheckCircle className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                    ) : isCurrent ? (
                      <Scan className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-coolgray-300 dark:border-coolgray-600" />
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold font-mono ${isCurrent ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-charcoal dark:text-white'}`}>
                      {stage.label}
                    </div>
                    <div className="text-xs text-coolgray-500 dark:text-coolgray-400 font-sans mt-0.5">
                      {stage.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
