import React from 'react';
import { COORDINATOR } from '../config';
import { X, Scale, AlertTriangle, FileCheck2, BookOpen } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 p-6 border-b border-navy-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                MUJ IPR Policy &amp; Statutory Patenting Guidelines
              </h3>
              <p className="text-xs text-slate-300">
                Indian Patents Act 1970 (as amended) &bull; Directorate of Research
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-sm text-slate-700 leading-relaxed">
          {/* Section 1: Patentability criteria */}
          <div>
            <h4 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <BookOpen size={18} className="text-amber-600" />
              <span>1. Statutory Criteria for Patentability (Section 2(1)(j))</span>
            </h4>
            <p className="mt-2 text-xs text-slate-600">
              An invention must satisfy three cumulative legal prerequisites to qualify for patent grant in India:
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700 list-disc list-inside">
              <li><strong>Novelty:</strong> The technical subject matter must not have been anticipated by prior publication or public use anywhere in the world before the filing date.</li>
              <li><strong>Inventive Step (Non-Obviousness):</strong> The feature must involve technical advance as compared to existing knowledge or economic significance that is not obvious to a person skilled in the art.</li>
              <li><strong>Industrial Applicability:</strong> The invention must be capable of being made or used in an industry.</li>
            </ul>
          </div>

          {/* Section 2: Non-Patentable Subject Matter */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" />
              <span>2. Non-Patentable Subject Matter (Section 3 Exclusion Notice)</span>
            </h4>
            <p className="mt-2 text-xs text-slate-600">
              Under Indian law, the following are strictly excluded from patentability:
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <span className="p-2 bg-white rounded border border-slate-200">&bull; Section 3(k): Mathematical or business methods, algorithms, or computer programmes per se.</span>
              <span className="p-2 bg-white rounded border border-slate-200">&bull; Section 3(d): Mere discovery of a new form of a known substance without enhancement of efficacy.</span>
              <span className="p-2 bg-white rounded border border-slate-200">&bull; Section 3(f): Mere arrangement, rearrangement, or duplication of known devices functioning independently.</span>
              <span className="p-2 bg-white rounded border border-slate-200">&bull; Section 3(p): An invention which in effect is traditional knowledge.</span>
            </div>
          </div>

          {/* Section 3: Inventorship & University Support */}
          <div>
            <h4 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileCheck2 size={18} className="text-emerald-700" />
              <span>3. Inventorship Allocation &amp; Financial Support</span>
            </h4>
            <p className="mt-2 text-xs text-slate-600">
              - <strong>True and First Inventor:</strong> Only natural persons who contributed intellectually to the conception of the invention can be named as inventors. Listing guides or students who did not actively conceptualize claims is legally invalid.
            </p>
            <p className="mt-1.5 text-xs text-slate-600">
              - <strong>Institutional Assistance:</strong> For approved dockets, Manipal University Jaipur covers the official government statutory filing fees and engages certified patent attorneys for drafting and response to First Examination Reports (FER).
            </p>
          </div>

          {/* Section 4: Process Flow */}
          <div className="p-4 bg-navy-50/50 border border-navy-100 rounded-lg">
            <h4 className="text-sm font-bold text-navy-900">
              4. In-Portal Examination Procedure
            </h4>
            <p className="mt-1 text-xs text-slate-600">
              Once your disclosure is submitted, Coordinator <strong>{COORDINATOR.FULL_NAME}</strong> conducts preliminary novelty screening within 7 working days. If itemized corrections are issued, you will receive a notification to update target fields and resubmit <strong>Version N+1</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
