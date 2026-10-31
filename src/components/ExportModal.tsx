import React, { useState, useEffect } from 'react';
import { EventProfile, CompletePlan } from '../types';
import { downloadICS, downloadBudgetCSV, formatCurrency, formatEventDate } from '../utils/formatters';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Printer, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventProfile;
  plan: CompletePlan;
  currency: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  event,
  plan,
  currency,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-[#FFFDF9] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-200/90 my-8 relative">
        
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close export modal"
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-amber-100/50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md border border-amber-400/40">
            <Share2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 id="export-modal-title" className="font-display text-xl font-black text-stone-900 tracking-tight">
              Export & Share Event Plan
            </h3>
            <p className="font-serif-festive italic text-xs text-amber-800">
              Deliverables ready for co-planners, committee members, and vendors.
            </p>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-3">
          
          {/* Option 1: Calendar .ICS */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Google & Apple Calendar (.ICS)</h4>
                <p className="text-xs text-stone-500">
                  Syncs all {plan.timelineTasks.length} backward milestones and deadlines to your personal phone calendar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadICS(event, plan.timelineTasks)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Option 2: CSV Budget */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Budget Spreadsheet (.CSV)</h4>
                <p className="text-xs text-stone-500">
                  Itemized spreadsheet formatted for Excel or Google Sheets with estimated vs actual variance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadBudgetCSV(event, plan.budgetItems)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Option 3: Print / PDF Summary */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Printable Executive Summary (PDF)</h4>
                <p className="text-xs text-stone-500">
                  Generates formatted print layout with executive overview, budget donut, and vendor checklists.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>

          {/* Option 4: Shareable Link */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">Collaborator Workspace Link</h4>
                <p className="text-xs text-stone-500">
                  Share active plan link with co-planners and family coordinators.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 shadow-xs'
              }`}
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Plans preserved in browser local workspace
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-700 hover:text-stone-900 font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
