import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COORDINATOR } from '../config';
import { X, Scale, AlertTriangle, FileCheck2, BookOpen, Hourglass } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showFade, setShowFade] = useState(true);

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    setShowFade(!atBottom);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(updateFade);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, updateFade]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-navy-950/80">
      <style>{`
        .gm-scroll { scrollbar-width: thin; scrollbar-color: var(--border-medium) transparent; }
        .gm-scroll::-webkit-scrollbar { width: 8px; }
        .gm-scroll::-webkit-scrollbar-track { background: transparent; }
        .gm-scroll::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 4px; }
        .gm-scroll::-webkit-scrollbar-thumb:hover { background: var(--border-dark); }
        .gm-list { list-style: none; }
        .gm-list > li { position: relative; padding-left: 18px; }
        .gm-list > li::before {
          content: "";
          position: absolute;
          left: 3px;
          top: 8px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--portal-orange);
        }
        .gm-focus-light:focus-visible { outline: 2px solid var(--portal-blue); outline-offset: 2px; }
        .gm-focus-dark:focus-visible { outline: 2px solid var(--portal-orange); outline-offset: 2px; }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-dialog-title"
        className="bg-white shadow-2xl border border-slate-200"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '720px',
          width: 'calc(100% - 2rem)',
          maxHeight: 'calc(100vh - 2rem)',
          overflow: 'hidden',
          borderRadius: '12px',
          fontFamily: 'var(--portal-font)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between bg-navy-900 border-b border-navy-800 text-white"
          style={{ flex: 'none', padding: '20px 24px' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(242, 106, 33, 0.18)',
                color: 'var(--portal-orange)',
              }}
            >
              <Scale size={17} />
            </div>
            <div className="min-w-0">
              <h3 id="gm-dialog-title" className="text-lg font-semibold tracking-normal text-white">
                MUJ IPR Policy &amp; Statutory Patenting Guidelines
              </h3>
              <p className="text-[13px] text-slate-300" style={{ marginTop: '2px' }}>
                Indian Patents Act 1970 (as amended) &bull; Directorate of Research
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="gm-focus-dark shrink-0 flex items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-white hover:bg-white/10"
            style={{ width: 36, height: 36 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="relative flex flex-col min-h-0"
          style={{ flex: '1 1 auto', minHeight: 0 }}
        >
          <div
            ref={scrollRef}
            onScroll={updateFade}
            className="gm-scroll overflow-y-auto p-5 px-4 sm:p-7 sm:px-8 text-slate-700"
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overscrollBehavior: 'contain',
              fontSize: '14.5px',
              lineHeight: 1.6,
              paddingBottom: '24px',
            }}
          >
            <div className="flex flex-col gap-7">
              {/* Section 1: Patentability criteria */}
              <section className="flex gap-3">
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--portal-orange-light)',
                    color: 'var(--portal-orange)',
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[17px] font-semibold tracking-normal text-navy-900">
                    1. Statutory Criteria for Patentability (Section 2(1)(j))
                  </h4>
                  <p className="mt-2 text-[14.5px] text-slate-700">
                    An invention must satisfy three cumulative legal prerequisites to qualify for patent grant in India:
                  </p>
                  <ul className="gm-list mt-2 space-y-1.5">
                    <li><strong>Novelty:</strong> The technical subject matter must not have been anticipated by prior publication or public use anywhere in the world before the filing date.</li>
                    <li><strong>Inventive Step (Non-Obviousness):</strong> The feature must involve technical advance as compared to existing knowledge or economic significance that is not obvious to a person skilled in the art.</li>
                    <li><strong>Industrial Applicability:</strong> The invention must be capable of being made or used in an industry.</li>
                  </ul>
                </div>
              </section>

              {/* Section 2: Non-Patentable Subject Matter */}
              <section
                className="flex gap-3"
                style={{ borderTop: '1px solid var(--border-light)', paddingTop: '28px' }}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--portal-orange-light)',
                    color: 'var(--portal-orange)',
                  }}
                >
                  <AlertTriangle size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[17px] font-semibold tracking-normal text-navy-900">
                    2. Non-Patentable Subject Matter (Section 3 Exclusion Notice)
                  </h4>
                  <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="text-[14.5px] text-slate-700">
                      Under Indian law, the following are strictly excluded from patentability:
                    </p>
                    <ul className="gm-list mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <li>Section 3(k): Mathematical or business methods, algorithms, or computer programmes per se.</li>
                      <li>Section 3(d): Mere discovery of a new form of a known substance without enhancement of efficacy.</li>
                      <li>Section 3(f): Mere arrangement, rearrangement, or duplication of known devices functioning independently.</li>
                      <li>Section 3(p): An invention which in effect is traditional knowledge.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3: Inventorship & University Support */}
              <section
                className="flex gap-3"
                style={{ borderTop: '1px solid var(--border-light)', paddingTop: '28px' }}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--portal-orange-light)',
                    color: 'var(--portal-orange)',
                  }}
                >
                  <FileCheck2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[17px] font-semibold tracking-normal text-navy-900">
                    3. Inventorship Allocation &amp; Financial Support
                  </h4>
                  <ul className="gm-list mt-2 space-y-1.5">
                    <li><strong>True and First Inventor:</strong> Only natural persons who contributed intellectually to the conception of the invention can be named as inventors. Listing guides or students who did not actively conceptualize claims is legally invalid.</li>
                    <li><strong>Institutional Assistance:</strong> For approved dockets, Manipal University Jaipur covers the official government statutory filing fees and engages certified patent attorneys for drafting and response to First Examination Reports (FER).</li>
                  </ul>
                </div>
              </section>

              {/* Section 4: Process Flow */}
              <section
                className="flex gap-3"
                style={{ borderTop: '1px solid var(--border-light)', paddingTop: '28px' }}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--portal-orange-light)',
                    color: 'var(--portal-orange)',
                  }}
                >
                  <Hourglass size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[17px] font-semibold tracking-normal text-navy-900">
                    4. In-Portal Examination Procedure
                  </h4>
                  <p className="mt-2 text-[14.5px] text-slate-700">
                    Once your disclosure is submitted, Coordinator <strong>{COORDINATOR.FULL_NAME}</strong> conducts preliminary novelty screening within 7 working days. If itemized corrections are issued, you will receive a notification to update target fields and resubmit <strong>Version N+1</strong>.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Scroll fade — hidden once the user reaches the end of the content */}
          {showFade && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 right-0"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '24px',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff)',
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end"
          style={{
            flex: 'none',
            position: 'static',
            background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            zIndex: 2,
            padding: '16px 24px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="gm-focus-light rounded-lg bg-navy-900 hover:bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
