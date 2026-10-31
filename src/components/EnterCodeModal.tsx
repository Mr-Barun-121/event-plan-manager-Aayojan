import React, { useState } from 'react';
import { X, Ticket, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface EnterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCode: (code: string) => void;
}

export const EnterCodeModal: React.FC<EnterCodeModalProps> = ({
  isOpen,
  onClose,
  onSubmitCode,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a valid unique code');
      return;
    }
    onSubmitCode(code.trim().toUpperCase());
    setCode('');
    setError('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enter-code-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-amber-200/80 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 id="enter-code-modal-title" className="font-display font-bold text-base text-stone-900">
                Access Celebration Pass
              </h3>
              <p className="text-[11px] text-stone-500">
                Invitation RSVP & Door Entry Code
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close enter code modal"
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-600 mb-4 leading-relaxed">
          Received an invitation or ticket? Enter your unique entry code below to view your invitation details, RSVP, and display your digital entry pass.
        </p>

        {error && (
          <div 
            role="alert" 
            aria-live="polite"
            className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Unique Entry Code
            </label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. WED-101 or EVT-8F2K"
              className="w-full text-base font-mono font-bold tracking-widest text-stone-900 bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white uppercase text-center"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-amber-200" />
            <span>Open Invitation & Entry Pass</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-100 text-center">
          <span className="text-[11px] text-stone-400">
            Powered by Firebase Cloud Verified Admission
          </span>
        </div>

      </div>
    </div>
  );
};
