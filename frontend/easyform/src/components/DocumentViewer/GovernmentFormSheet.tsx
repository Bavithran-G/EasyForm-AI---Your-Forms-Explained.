import React from 'react';
import type { FormField, DocumentPage } from '../../types/form';
import { Shield, Info } from 'lucide-react';

interface GovernmentFormSheetProps {
  pageData: DocumentPage;
  selectedFieldId?: string | null;
  onSelectField: (field: FormField, e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  livePageUrl?: string;
}

export const GovernmentFormSheet: React.FC<GovernmentFormSheetProps> = ({
  pageData,
  selectedFieldId,
  onSelectField,
  onMouseUp,
  livePageUrl,
}) => {
  const isPage1 = pageData.pageNumber === 1;

  if (livePageUrl) {
    return (
      <div onMouseUp={onMouseUp} className="relative w-full max-w-[760px] bg-white rounded-md shadow-2xl overflow-visible select-text leading-none">
        <img src={livePageUrl} alt={`Uploaded government form page ${pageData.pageNumber}`} className="block w-full h-auto rounded-md" draggable={false} />
        {pageData.fields.map((field) => {
          const isSelected = selectedFieldId === field.id;
          return (
            <div key={field.id} id={`form-field-${field.id}`} onClick={(e) => onSelectField(field, e)} role="button" tabIndex={0} aria-label={`Inspect ${field.text}`} aria-pressed={isSelected} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectField(field, e as unknown as React.MouseEvent); }} style={{ left: `${field.bbox.x}%`, top: `${field.bbox.y}%`, width: `${field.bbox.width}%`, height: `${field.bbox.height}%` }} className={`doc-field-highlight ${isSelected ? 'doc-field-active' : ''}`}>
              <span className={`absolute -top-4 left-0 sm:left-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase transition-all whitespace-nowrap z-10 ${isSelected ? 'bg-primary-500 text-white shadow-md opacity-100 scale-100' : 'bg-charcoal/90 text-white opacity-0 scale-95 hover:opacity-100 hover:scale-100'}`}>
                {field.text ? field.text.split('.')[0].substring(0, 20) : 'AI FIELD'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      onMouseUp={onMouseUp}
      className="relative w-full max-w-[760px] min-h-[1060px] paper-texture text-[#2A1F16] rounded-md shadow-2xl p-6 sm:p-10 select-text transition-transform duration-200"
      style={{
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(90, 69, 51, 0.25)',
      }}
    >
      {/* Background Watermark */}
      <div className="paper-watermark">
        OFFICIAL DRAFT 2026
      </div>

      {/* Outer Border Double Line typical of Government Forms */}
      <div className="relative border-2 border-[#5A4533]/60 p-4 min-h-[980px]">
        {/* Top Header: National Seal, Ministry Name, Form Identifier */}
        <div className="flex items-start justify-between border-b-2 border-[#5A4533]/70 pb-4 mb-4">
          {/* Emblem / Seal */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#8B251A] flex flex-col items-center justify-center text-[#8B251A] p-1 text-center">
              <Shield className="w-5 h-5 mb-0.5" />
              <span className="text-[6px] font-mono font-bold uppercase leading-none">OFFICIAL SEAL</span>
            </div>
            <span className="text-[7px] font-mono text-[#5A4533] mt-1">GAZETTED</span>
          </div>

          {/* Department Titles */}
          <div className="flex-1 text-center px-4">
            <h2 className="font-serif text-xs sm:text-sm tracking-wider uppercase font-bold text-[#140E09]">
              GOVERNMENT OF THE CITIZEN WELFARE FEDERATION
            </h2>
            <h3 className="font-sans text-[11px] sm:text-xs font-semibold text-[#5A4533] uppercase mt-0.5">
              DEPARTMENT OF PUBLIC ADMINISTRATION & CIVIC ENTITLEMENTS
            </h3>
            <div className="inline-block mt-1 px-3 py-0.5 bg-[#8B251A]/10 border border-[#8B251A]/30 text-[#8B251A] font-mono text-[9px] font-bold tracking-widest uppercase">
              FORM 4-B (REVISED 2026) · ADMISSIBLE UNDER REGULATION 14
            </div>
          </div>

          {/* Form Code & Barcode */}
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] font-bold text-[#2A1F16]">
              {pageData.formCode}
            </span>
            <div className="flex gap-[2px] h-6 my-1">
              {[3,1,2,4,1,3,2,1,4,2,3,1,2,3,1,4,2,1].map((w, idx) => (
                <div key={idx} className="bg-[#2A1F16] h-full" style={{ width: `${w}px` }} />
              ))}
            </div>
            <span className="font-mono text-[8px] text-[#5A4533]">
              Page {pageData.pageNumber} of 2
            </span>
          </div>
        </div>

        {/* General Instruction Banner */}
        <div className="bg-[#E2D2BE]/60 border border-[#A48564]/50 p-2 rounded mb-5 text-[10px] sm:text-[11px] text-[#423223] font-sans flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#846749] flex-shrink-0 mt-0.5" />
          <span className="leading-tight">
            <strong>INSTRUCTIONS:</strong> Complete all sections in BLACK / BLUE ballpoint ink. Do not write inside demarcated margins. Click any bounding box below for instant plain-English explanations.
          </span>
        </div>

        {/* Form Body: Page 1 Layout */}
        {isPage1 && (
          <div className="space-y-5 text-[11px] font-sans">
            {/* PART A: PERSONAL PARTICULARS */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09] mb-3">
                PART A: PERSONAL PARTICULARS OF APPLICANT
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* 1. Applicant Name */}
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    1. Full Name of Applicant (as per official ID) *
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09] tracking-wide">
                    RAJESH KUMAR SHARMA
                  </div>
                </div>

                {/* 2. Parent Name */}
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    2. Father's / Mother's / Legal Guardian's Full Name *
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09] tracking-wide">
                    SURESH CHANDRA SHARMA
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 3. DOB */}
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    3. Date of Birth (DD / MM / YYYY) *
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09]">
                    14 / 08 / 1994
                  </div>
                </div>

                {/* 4. Gender */}
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    4. Gender *
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-[10px] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="w-3.5 h-3.5 border border-[#5A4533] flex items-center justify-center font-bold text-xs">✓</span> MALE
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[#7F644A]">
                      <span className="w-3.5 h-3.5 border border-[#5A4533] inline-block" /> FEMALE
                    </span>
                  </div>
                </div>

                {/* 5. Aadhaar */}
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    5. Aadhaar / National ID *
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09] tracking-wider">
                    4829 3920 1928
                  </div>
                </div>
              </div>
            </div>

            {/* PART B: RESIDENTIAL DETAILS */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09] mb-3">
                PART B: RESIDENTIAL & CONTACT DETAILS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    6. Permanent Residential Address with PIN Code *
                  </span>
                  <div className="mt-1 h-12 text-[10px] font-mono text-[#140E09] leading-snug p-1 border-b border-dotted border-[#7F644A]">
                    Plot 42, Shanti Vihar, Civil Lines, Sector 9, Jaipur, Rajasthan - 302006
                  </div>
                </div>

                <div className="sm:col-span-4 border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    7. Primary Mobile Number (OTP) *
                  </span>
                  <div className="mt-1 h-12 flex flex-col justify-center px-1 border-b border-dotted border-[#7F644A]">
                    <span className="font-mono text-xs text-[#140E09] font-bold">+91 98201 44521</span>
                    <span className="text-[8px] text-[#7F644A]">Aadhaar-Linked Active SIM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PART C: SOCIO-ECONOMIC DECLARATION */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09] mb-3">
                PART C: SOCIO-ECONOMIC & CATEGORY DECLARATION
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    8. Gross Annual Household Income (All Sources) *
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09] font-bold">
                    ₹ 3,80,000 / Per Annum
                  </div>
                </div>

                <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                  <span className="font-bold text-[10px] block text-[#2A1F16]">
                    9. Social Category / Reservation Classification
                  </span>
                  <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center px-1 font-mono text-xs text-[#140E09]">
                    General (Non-Reserved Quota)
                  </div>
                </div>
              </div>
            </div>

            {/* PART D: FINANCIAL DISBURSEMENT */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09] mb-3">
                PART D: FINANCIAL DISBURSEMENT (DIRECT BENEFIT TRANSFER)
              </div>

              <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded">
                <span className="font-bold text-[10px] block text-[#2A1F16]">
                  10. Bank Account Number & IFSC Code *
                </span>
                <div className="mt-1 h-7 border-b border-dotted border-[#7F644A] flex items-center justify-between px-1 font-mono text-xs text-[#140E09]">
                  <span>A/C: 309811029384 (State Bank of India)</span>
                  <span className="font-bold">IFSC: SBIN0004921</span>
                </div>
              </div>
            </div>

            {/* PART E: VERIFICATION & ATTESTATION */}
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09] mb-3">
                PART E: VERIFICATION & STATUTORY ATTESTATION
              </div>

              <div className="border border-[#7F644A]/60 p-2 bg-white/50 rounded mb-3">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 border border-[#5A4533] flex items-center justify-center text-xs font-bold text-[#8B251A] mt-0.5">
                    ✓
                  </span>
                  <p className="text-[9px] text-[#423223] leading-relaxed">
                    <strong>11. Declaration:</strong> I hereby solemnly affirm and declare that the statements made above are true and complete to the best of my knowledge under penalty of Law. I grant consent to the Department to verify my Aadhaar credentials.
                  </p>
                </div>
              </div>

              {/* Bottom Signature & Stamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mt-4 pt-2">
                <div className="paper-stamp inline-block p-2 text-center text-xs">
                  VERIFIED & RECORDED<br />
                  <span className="text-[8px] font-mono">REG: IND-2026-F4B</span>
                </div>

                <div className="border-2 border-dashed border-[#5A4533] p-3 rounded text-center bg-white/60">
                  <div className="font-serif italic text-base text-[#140E09] select-none">
                    Rajesh K. Sharma
                  </div>
                  <div className="text-[8px] font-mono uppercase text-[#7F644A] border-t border-[#5A4533]/40 mt-1 pt-0.5">
                    12. Applicant Signature / Thumb Impression *
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Body: Page 2 Layout */}
        {!isPage1 && (
          <div className="space-y-6 text-[11px] font-sans">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#5A4533]/15 px-2 py-1 border-l-4 border-[#8B251A] text-[#140E09]">
              SCHEDULE II: MANDATORY ATTESTED ENCLOSURES & SCRUTINY
            </div>

            {/* Checklist */}
            <div className="border border-[#7F644A]/60 p-4 bg-white/50 rounded space-y-2.5">
              <span className="font-bold text-xs text-[#2A1F16] block mb-2">
                13. List of Mandatory Attested Enclosures
              </span>
              {[
                'Self-attested copy of Aadhaar Card / National Photo Identity Card',
                'Copy of Valid Residence Proof (Electricity Bill / Rent Agreement)',
                'Proof of Income (Form 16 / Revenue Officer Certificate)',
                'Two recent passport-sized color photographs with white background',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px] text-[#2A1F16]">
                  <span className="w-3.5 h-3.5 border border-[#5A4533] flex items-center justify-center font-bold text-[9px] text-[#8B251A]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Gazetted Attestation */}
            <div className="border border-[#7F644A]/60 p-4 bg-white/50 rounded">
              <span className="font-bold text-xs text-[#2A1F16] block mb-2">
                14. Attestation by Gazetted Officer or Notary Public
              </span>
              <p className="text-[10px] text-[#5A4533] leading-relaxed mb-4">
                I have inspected the applicant's credentials and verified original copies presented before me on this day.
              </p>
              <div className="flex justify-between items-end pt-4 border-t border-dotted border-[#7F644A]">
                <div className="text-[9px] font-mono text-[#5A4533]">
                  Date: 15 / 09 / 2026<br />
                  Station: New Delhi Central
                </div>
                <div className="w-36 h-12 border border-[#7F644A] flex items-center justify-center text-[8px] font-mono text-[#8B251A] text-center border-dashed">
                  [ OFFICIAL NOTARY STAMP & SEAL ]
                </div>
              </div>
            </div>

            {/* Office Use Only */}
            <div className="border-2 border-[#8B251A]/40 p-4 bg-[#8B251A]/5 rounded">
              <span className="font-mono font-bold text-xs text-[#8B251A] block mb-1 uppercase">
                15. For Office / Processing Desk Use Only (DO NOT WRITE)
              </span>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[9px] font-mono text-[#5A4533]">
                <div className="border border-[#5A4533]/30 p-2">ACK NO: 9982-CW-2026</div>
                <div className="border border-[#5A4533]/30 p-2">DESK: VERIF-04</div>
                <div className="border border-[#5A4533]/30 p-2">STATUS: DISPATCH READY</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer of the Page */}
        <div className="mt-8 pt-3 border-t border-[#7F644A]/40 flex justify-between items-center text-[8px] font-mono text-[#5A4533]">
          <span>FORM 4-B (SERIES 2026) · CITIZEN WELFARE SCHEME</span>
          <span>SYSTEM VERIFICATION: HASH-SHA256-AUTHENTICATED</span>
        </div>
      </div>

      {/* Interactive Overlays for Each Detected Field */}
      {pageData.fields.map((field) => {
        const isSelected = selectedFieldId === field.id;

        return (
          <div
            key={field.id}
            id={`form-field-${field.id}`}
            onClick={(e) => onSelectField(field, e)}
            role="button"
            tabIndex={0}
            aria-label={`Inspect ${field.text}`}
            aria-pressed={isSelected}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectField(field, e as unknown as React.MouseEvent);
              }
            }}
            style={{
              left: `${field.bbox.x}%`,
              top: `${field.bbox.y}%`,
              width: `${field.bbox.width}%`,
              height: `${field.bbox.height}%`,
            }}
            className={`doc-field-highlight ${
              isSelected ? 'doc-field-active' : ''
            }`}
          >
            {/* Field Indicator Tag */}
            <span
              className={`absolute -top-3 left-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase transition-opacity ${
                isSelected
                  ? 'bg-primary-500 text-white shadow-sm opacity-100'
                  : 'bg-charcoal/90 text-white opacity-0 hover:opacity-100'
              }`}
            >
              {field.text.split('.')[0] || 'AI FIELD'}
            </span>
          </div>
        );
      })}
    </div>
  );
};
