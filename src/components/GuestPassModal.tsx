import React, { useState, useEffect } from 'react';
import { EventProfile, CompletePlan, InvitationRecord, GuestRecord } from '../types.ts';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  Ticket, 
  QrCode, 
  UtensilsCrossed, 
  Share2, 
  ShieldCheck, 
  PartyPopper,
  Check,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatEventDate, getDaysRemaining } from '../utils/formatters.ts';
import { updateGuestRsvp, lookupInvitationOrEventByCode } from '../utils/firebase.ts';

interface GuestPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  activeEvent: EventProfile | null;
  activePlan: CompletePlan | null;
  onRsvpSuccess?: (updatedGuest: Partial<GuestRecord>) => void;
}

export const GuestPassModal: React.FC<GuestPassModalProps> = ({
  isOpen,
  onClose,
  code,
  activeEvent,
  activePlan,
  onRsvpSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [resolvedEvent, setResolvedEvent] = useState<EventProfile | null>(activeEvent);
  const [resolvedPlan, setResolvedPlan] = useState<CompletePlan | null>(activePlan);
  const [resolvedInvitation, setResolvedInvitation] = useState<InvitationRecord | null>(null);
  const [guestName, setGuestName] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [dietary, setDietary] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined' | 'pending'>('pending');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
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

  useEffect(() => {
    if (!isOpen || !code) return;

    let isMounted = true;
    setLoading(true);
    setRsvpSubmitted(false);

    // If matches currently active event
    if (activeEvent && (activeEvent.entryCode === code || code.startsWith(activeEvent.entryCode?.split('-')[0] || '___'))) {
      setResolvedEvent(activeEvent);
      setResolvedPlan(activePlan);

      // Check if code corresponds to a specific guest in activePlan
      const matchedGuest = activePlan?.guests.find((g) => g.notes?.includes(`ENTRY_CODE:${code}`));
      if (matchedGuest) {
        setResolvedInvitation({
          id: matchedGuest.id,
          eventId: activeEvent.id,
          entryCode: code,
          guestName: matchedGuest.name,
          guestEmail: matchedGuest.email,
          partySize: matchedGuest.partySize || 1,
          rsvpStatus: matchedGuest.rsvpStatus || 'pending',
          dietary: matchedGuest.dietary || 'Standard',
          tableOrGroup: matchedGuest.tableOrGroup,
          checkedIn: matchedGuest.notes?.includes('CHECKED_IN:true') || false,
          createdAt: new Date().toISOString(),
        });
        setGuestName(matchedGuest.name);
        setPartySize(matchedGuest.partySize || 1);
        setDietary(matchedGuest.dietary || 'Standard');
        setRsvpStatus(matchedGuest.rsvpStatus || 'pending');
      } else {
        setGuestName('');
        setPartySize(1);
        setRsvpStatus('pending');
      }
      setLoading(false);
      return;
    }

    // Otherwise, perform cloud lookup
    lookupInvitationOrEventByCode(code)
      .then((res) => {
        if (!isMounted) return;
        if (res.event) setResolvedEvent(res.event);
        if (res.plan) setResolvedPlan(res.plan);
        if (res.invitation) {
          setResolvedInvitation(res.invitation);
          setGuestName(res.invitation.guestName);
          setPartySize(res.invitation.partySize || 1);
          setDietary(res.invitation.dietary || 'Standard');
          setRsvpStatus(res.invitation.rsvpStatus);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch invitation by code', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, code, activeEvent, activePlan]);

  if (!isOpen) return null;

  const event = resolvedEvent || activeEvent;
  const daysInfo = event ? getDaysRemaining(event.date) : null;

  const handleRsvpSubmit = async (status: 'attending' | 'declined') => {
    setRsvpStatus(status);
    setRsvpSubmitted(true);

    if (status === 'attending') {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    if (resolvedInvitation) {
      try {
        await updateGuestRsvp(resolvedInvitation.id, {
          rsvpStatus: status,
          partySize,
          dietary,
          notes,
        });
      } catch (e) {
        console.warn('RSVP updated locally', e);
      }
    }

    if (onRsvpSuccess) {
      onRsvpSuccess({
        name: guestName || 'Honored Guest',
        partySize,
        dietary: dietary as any,
        rsvpStatus: status,
      });
    }
  };

  const handleCopyPassLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-pass-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-3xl border border-amber-200/90 shadow-2xl overflow-hidden my-6">
        
        {/* Festive Golden Top Bar */}
        <div className="bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between border-b border-amber-300/40">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-200" />
            <h3 id="guest-pass-modal-title" className="font-display font-bold text-sm tracking-wide">
              Celebration Digital Invitation & Entry Pass
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close digital pass"
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {loading ? (
            <div className="py-16 text-center">
              <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-700">Verifying unique entry code...</p>
            </div>
          ) : !event ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Invalid or Expired Entry Code</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                We could not locate an active celebration with code <span className="font-mono font-bold text-stone-800">{code}</span>. Please verify with the event host.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Event Header Banner */}
              <div className="text-center relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2 border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{event.eventType} Celebration</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {event.title}
                </h2>

                <p className="font-serif-festive italic text-sm sm:text-base text-amber-800 font-medium mt-1.5 max-w-md mx-auto">
                  {event.invitationDetails?.welcomeMessage || `Warmly hosted by ${event.ownerName || 'The Host Family'}`}
                </p>
              </div>

              {/* Event Details Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-stone-700">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="block font-bold text-stone-900">Date</span>
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="block font-bold text-stone-900">Venue</span>
                    <span className="truncate max-w-[150px] block">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="block font-bold text-stone-900">Countdown</span>
                    <span>{daysInfo?.label || 'Celebration Soon'}</span>
                  </div>
                </div>
              </div>

              {/* Dress Code & Notes */}
              {event.invitationDetails?.dressCode && (
                <div className="text-xs bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                  <span className="font-bold text-stone-600 uppercase tracking-wider text-[11px]">Dress Code / Vibe:</span>
                  <span className="font-medium text-stone-800">{event.invitationDetails.dressCode}</span>
                </div>
              )}

              {/* DIGITAL ENTRY PASS / BOARDING PASS CARD */}
              <div className="relative rounded-3xl bg-linear-to-b from-stone-900 to-stone-950 text-white p-6 shadow-2xl border-2 border-amber-400/60 overflow-hidden">
                
                {/* Golden Holographic Security Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                        Official Admission Pass
                      </span>
                      <span className="font-display font-black text-sm text-stone-100">
                        {guestName || 'Honored Attendee'}
                      </span>
                    </div>
                  </div>

                  {resolvedInvitation?.checkedIn ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Admitted at Door
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                      VIP Entry Valid
                    </span>
                  )}
                </div>

                {/* Pass Details & Visual QR Simulation */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  
                  <div className="col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Entry Pass Code</span>
                      <span className="font-mono font-black text-xl text-amber-300 tracking-wider">
                        {code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-stone-400 block">Party Access</span>
                        <span className="font-bold text-stone-200">{partySize} Person(s)</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Seating Zone</span>
                        <span className="font-bold text-stone-200">{resolvedInvitation?.tableOrGroup || 'Open Seating'}</span>
                      </div>
                    </div>
                  </div>

                  {/* High-tech QR Visual */}
                  <div className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center text-stone-900 border border-amber-300 shadow-inner">
                    <QrCode className="w-16 h-16 text-stone-900" />
                    <span className="text-[9px] font-mono font-bold text-stone-600 mt-1 uppercase tracking-tighter">
                      Scan At Gate
                    </span>
                  </div>

                </div>

                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Present this screen or code at the celebration entrance</span>
                  <button
                    type="button"
                    onClick={handleCopyPassLink}
                    className="hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Link Copied' : 'Share Pass'}</span>
                  </button>
                </div>

              </div>

              {/* RSVP Form Section */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <PartyPopper className="w-4 h-4 text-amber-600" />
                    <span>RSVP Confirmation</span>
                  </h4>
                  {rsvpStatus !== 'pending' && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      rsvpStatus === 'attending' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rsvpStatus === 'attending' ? 'Attending with Joy' : 'Unable to Attend'}
                    </span>
                  )}
                </div>

                {rsvpSubmitted ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs text-emerald-900 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-bold">Thank you! Your RSVP has been confirmed.</p>
                    <p className="text-[11px] text-emerald-700">
                      Your entry pass code <span className="font-mono font-bold">{code}</span> is registered for admission.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    
                    {!guestName && (
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                          Your Full Name
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Rahul & Neha"
                          className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                          Party Headcount
                        </label>
                        <select
                          value={partySize}
                          onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
                          className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>{num} Person{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                          Dietary Preference
                        </label>
                        <select
                          value={dietary}
                          onChange={(e) => setDietary(e.target.value)}
                          className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                        >
                          {['Standard', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher'].map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleRsvpSubmit('attending')}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept & Attend</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRsvpSubmit('declined')}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                      >
                        Decline with Regret
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>

      </div>

    </div>
  );
};
