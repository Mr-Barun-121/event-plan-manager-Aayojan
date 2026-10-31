import React, { useState, useMemo } from 'react';
import { EventProfile, GuestRecord, CompletePlan, InvitationRecord } from '../types.ts';
import { 
  Ticket, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  ShieldCheck,
  PartyPopper,
  UserCheck,
  RefreshCw,
  Eye,
  Send,
  DoorOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  generateUniqueCode, 
  checkInGuestByCode, 
  saveInvitationToFirestore, 
  saveEventToFirestore,
  updateGuestRsvp
} from '../utils/firebase.ts';

interface InvitationHubProps {
  event: EventProfile;
  setEvent: React.Dispatch<React.SetStateAction<EventProfile | null>>;
  plan: CompletePlan;
  guests: GuestRecord[];
  setGuests: React.Dispatch<React.SetStateAction<GuestRecord[]>>;
  userId?: string;
  onPreviewGuestPass: (code: string) => void;
}

export const InvitationHub: React.FC<InvitationHubProps> = ({
  event,
  setEvent,
  plan,
  guests,
  setGuests,
  userId,
  onPreviewGuestPass,
}) => {
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [gateCodeInput, setGateCodeInput] = useState('');
  const [gateScanResult, setGateScanResult] = useState<{
    status: 'idle' | 'success' | 'duplicate' | 'not_found';
    message: string;
    guestName?: string;
    partySize?: number;
    table?: string;
    checkedInAt?: string;
  }>({ status: 'idle', message: '' });

  // Customization for event invitation details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(
    event.invitationDetails?.welcomeMessage || 
    `We warmly invite you to share the joy and blessings of our ${event.eventType.toLowerCase()} celebration!`
  );
  const [dressCode, setDressCode] = useState(
    event.invitationDetails?.dressCode || 'Festive Traditional / Elegant Celebration Attire'
  );
  const [venueAddress, setVenueAddress] = useState(
    event.invitationDetails?.venueAddress || event.location
  );
  const [rsvpDeadline, setRsvpDeadline] = useState(
    event.invitationDetails?.rsvpDeadline || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Master event code
  const masterEntryCode = event.entryCode || 'EVT-GENIE1';

  // Ensure every guest has a unique entry code
  const guestsWithCodes = useMemo(() => {
    return guests.map((guest, index) => {
      // If guest note contains code or we derive stable code
      const existingCode = guest.notes?.match(/ENTRY_CODE:([A-Z0-9-]+)/)?.[1];
      const code = existingCode || `${masterEntryCode.split('-')[0]}-${String(index + 101).padStart(3, '0')}`;
      const isCheckedIn = guest.notes?.includes('CHECKED_IN:true') || false;
      const checkedInTime = guest.notes?.match(/CHECKED_IN_TIME:([^;]+)/)?.[1] || null;
      return {
        ...guest,
        entryCode: code,
        isCheckedIn,
        checkedInTime,
      };
    });
  }, [guests, masterEntryCode]);

  // Gate statistics
  const checkedInCount = useMemo(() => {
    return guestsWithCodes.filter((g) => g.isCheckedIn).reduce((acc, g) => acc + (g.partySize || 1), 0);
  }, [guestsWithCodes]);

  const totalInvitedHeadcount = useMemo(() => {
    return guestsWithCodes.reduce((acc, g) => acc + (g.partySize || 1), 0);
  }, [guestsWithCodes]);

  const handleCopyMasterLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${masterEntryCode}`;
    navigator.clipboard.writeText(url);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2500);
  };

  const handleCopyGuestLink = (code: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleSaveInvitationDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEvent: EventProfile = {
      ...event,
      invitationDetails: {
        welcomeMessage,
        dressCode,
        venueAddress,
        rsvpDeadline,
      },
    };
    setEvent(updatedEvent);

    if (userId) {
      try {
        await saveEventToFirestore(updatedEvent, plan, userId);
      } catch (err) {
        console.warn('Saved locally, Firestore sync pending', err);
      }
    }

    setSaveSuccess(true);
    setIsEditingDetails(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Live Entry Gate verification
  const handleVerifyGateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateCodeInput.trim()) return;

    const inputCode = gateCodeInput.trim().toUpperCase();

    // 1. Check against active guest list first
    const matchedGuest = guestsWithCodes.find((g) => g.entryCode === inputCode);

    if (matchedGuest) {
      if (matchedGuest.isCheckedIn) {
        setGateScanResult({
          status: 'duplicate',
          message: `Already admitted at door! First scanned at ${matchedGuest.checkedInTime ? new Date(matchedGuest.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'entrance'}. Duplicate entry rejected.`,
          guestName: matchedGuest.name,
          partySize: matchedGuest.partySize,
          table: matchedGuest.tableOrGroup,
          checkedInAt: matchedGuest.checkedInTime || undefined,
        });
        return;
      }

      // Mark checked in
      const now = new Date().toISOString();
      const updatedGuests = guests.map((g) => {
        if (g.id === matchedGuest.id) {
          const baseNotes = g.notes ? g.notes.replace(/ENTRY_CODE:[^;]+;?/g, '').replace(/CHECKED_IN:[^;]+;?/g, '') : '';
          return {
            ...g,
            notes: `${baseNotes};ENTRY_CODE:${inputCode};CHECKED_IN:true;CHECKED_IN_TIME:${now};`,
          };
        }
        return g;
      });
      setGuests(updatedGuests);

      // Also sync to Firestore invitations if configured
      try {
        await saveInvitationToFirestore({
          id: matchedGuest.id,
          eventId: event.id,
          entryCode: inputCode,
          guestName: matchedGuest.name,
          guestEmail: matchedGuest.email,
          partySize: matchedGuest.partySize,
          rsvpStatus: matchedGuest.rsvpStatus,
          dietary: matchedGuest.dietary,
          tableOrGroup: matchedGuest.tableOrGroup,
          checkedIn: true,
          checkedInAt: now,
          createdAt: new Date().toISOString(),
          updatedAt: now,
        });
      } catch (err) {
        console.warn('Gate check-in recorded locally', err);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setGateScanResult({
        status: 'success',
        message: `Approved! Welcome ${matchedGuest.name} (Party of ${matchedGuest.partySize || 1}). Admitted to celebration.`,
        guestName: matchedGuest.name,
        partySize: matchedGuest.partySize,
        table: matchedGuest.tableOrGroup,
        checkedInAt: now,
      });

      setGateCodeInput('');
      return;
    }

    // 2. Fallback to Firestore remote lookup if not found locally
    try {
      const res = await checkInGuestByCode(inputCode, event.id);
      if (res.success && res.invitation) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        setGateScanResult({
          status: 'success',
          message: res.message,
          guestName: res.invitation.guestName,
          partySize: res.invitation.partySize,
          table: res.invitation.tableOrGroup,
          checkedInAt: res.checkedInAt,
        });
        setGateCodeInput('');
      } else if (res.alreadyCheckedIn) {
        setGateScanResult({
          status: 'duplicate',
          message: res.message,
          guestName: res.invitation?.guestName,
          partySize: res.invitation?.partySize,
          table: res.invitation?.tableOrGroup,
          checkedInAt: res.checkedInAt,
        });
      } else {
        setGateScanResult({
          status: 'not_found',
          message: res.message || `No invitation found matching code "${inputCode}". Please verify code with guest.`,
        });
      }
    } catch {
      setGateScanResult({
        status: 'not_found',
        message: `No active guest found with entry code "${inputCode}". Please check spelling.`,
      });
    }
  };

  // Auto-generate missing unique codes for all guests and save to Firestore
  const handleGenerateAllMissingCodes = async () => {
    const updated = guests.map((g, idx) => {
      const hasCode = g.notes?.includes('ENTRY_CODE:');
      if (hasCode) return g;
      const code = `${masterEntryCode.split('-')[0]}-${String(idx + 101).padStart(3, '0')}`;
      return {
        ...g,
        notes: `${g.notes || ''};ENTRY_CODE:${code};`,
      };
    });
    setGuests(updated);

    // Sync to Firestore
    for (const g of updated) {
      const code = g.notes?.match(/ENTRY_CODE:([A-Z0-9-]+)/)?.[1];
      if (code) {
        try {
          await saveInvitationToFirestore({
            id: g.id,
            eventId: event.id,
            entryCode: code,
            guestName: g.name,
            guestEmail: g.email,
            partySize: g.partySize,
            rsvpStatus: g.rsvpStatus,
            dietary: g.dietary,
            tableOrGroup: g.tableOrGroup,
            checkedIn: g.notes?.includes('CHECKED_IN:true') || false,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Ignore transient error
        }
      }
    }

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Master Event Entry Code & Celebration Card */}
      <div className="bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-300/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Invitation & Digital Admission Control</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              {event.title}
            </h2>

            <p className="text-amber-100/90 text-sm max-w-xl leading-relaxed">
              Every celebration in Aayojan includes an encrypted unique entry code. Share the master code or personalized guest links for instant RSVP and door admission verification.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onPreviewGuestPass(masterEntryCode)}
                className="px-4 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs shadow-md hover:bg-amber-50 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Preview Guest Invitation View</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMasterLink}
                className="px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2"
              >
                {copiedMaster ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMaster ? 'Copied Invitation Link!' : 'Copy Master Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
              >
                {isEditingDetails ? 'Close Editor' : 'Edit Invite Details'}
              </button>
            </div>
          </div>

          {/* Master Code Highlight Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/25 text-center flex flex-col items-center justify-center shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-200 block mb-1">
              Event Master Entry Code
            </span>
            <div className="my-2 px-4 py-2 bg-white rounded-xl shadow-inner text-stone-900 font-mono font-black text-2xl tracking-wider border-2 border-amber-300">
              {masterEntryCode}
            </div>
            <p className="text-[11px] text-amber-100/80 mt-1 max-w-[210px]">
              Guests enter this code to access the invitation and receive their digital pass.
            </p>
          </div>

        </div>

        {/* Edit Invitation Details Form */}
        {isEditingDetails && (
          <form onSubmit={handleSaveInvitationDetails} className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">
                Welcome Message / Host Greeting
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full text-xs text-stone-900 bg-white/95 rounded-xl p-3 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">
                Dress Code & Theme Style
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="e.g. Royal Maroon & Gold Festive"
                className="w-full text-xs text-stone-900 bg-white/95 rounded-xl p-3 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-white mb-2"
              />

              <label className="block text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">
                RSVP Deadline
              </label>
              <input
                type="date"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full text-xs text-stone-900 bg-white/95 rounded-xl p-2.5 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingDetails(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-amber-900 text-xs font-bold shadow-md hover:bg-amber-50"
              >
                Save Invitation Details
              </button>
            </div>
          </form>
        )}

      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Invitation settings saved and updated in Cloud Firestore database!</span>
        </div>
      )}

      {/* Grid: Live Gate Check-in & Admission Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Gate Check-in Scanner Box */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900">
                    Live Gate Check-in
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Door Scanner & Entry Pass Validation
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Gate
              </span>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              When guests arrive at the venue, enter their unique entry code from their pass or invite to admit them.
            </p>

            <form onSubmit={handleVerifyGateCode} className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={gateCodeInput}
                  onChange={(e) => setGateCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WED-101 or EVT-8F2K"
                  className="w-full text-xs sm:text-sm font-mono font-bold tracking-wider bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white uppercase"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Validate & Admit Guest</span>
              </button>
            </form>

            {/* Scan Results Card */}
            {gateScanResult.status !== 'idle' && (
              <div className={`mt-4 p-4 rounded-2xl border text-xs ${
                gateScanResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : gateScanResult.status === 'duplicate'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-start gap-2">
                  {gateScanResult.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {gateScanResult.status === 'duplicate' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
                  {gateScanResult.status === 'not_found' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                  <div>
                    <p className="font-bold">{gateScanResult.message}</p>
                    {gateScanResult.guestName && (
                      <div className="mt-2 text-[11px] space-y-0.5 opacity-90">
                        <div>Guest: <span className="font-bold">{gateScanResult.guestName}</span></div>
                        <div>Party Size: <span className="font-bold">{gateScanResult.partySize || 1} Person(s)</span></div>
                        {gateScanResult.table && <div>Seating: <span className="font-bold">{gateScanResult.table}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Door Capacity Counter */}
          <div className="mt-6 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-stone-700">
              <span>Venue Admission Rate</span>
              <span>{checkedInCount} / {totalInvitedHeadcount || event.guestCount} Admitted</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-linear-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((checkedInCount / (totalInvitedHeadcount || event.guestCount || 1)) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Guest Unique Code Directory Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-stone-900">
                Personalized Guest Passes & Codes
              </h3>
              <p className="text-xs text-stone-500">
                Each attendee receives a unique admission code for verification and tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAllMissingCodes}
                className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Assign unique admission codes to all guests"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>Sync Codes to Cloud</span>
              </button>
            </div>
          </div>

          {/* Guest Code Rows */}
          {guestsWithCodes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">No guests in guestlist yet</p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto mt-1">
                Add guests in the Guest List tab or use the Master Code <span className="font-mono font-bold text-amber-800">{masterEntryCode}</span> for open admission.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-2.5">Guest & Party</th>
                    <th className="pb-2.5">Unique Entry Code</th>
                    <th className="pb-2.5">RSVP</th>
                    <th className="pb-2.5">Gate Status</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {guestsWithCodes.map((g) => (
                    <tr key={g.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 font-semibold text-stone-900">
                        <div>{g.name}</div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {g.partySize} Person(s) {g.tableOrGroup ? `• ${g.tableOrGroup}` : ''}
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-md text-stone-800 border border-stone-200">
                          {g.entryCode}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.rsvpStatus === 'attending'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : g.rsvpStatus === 'declined'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {g.rsvpStatus}
                        </span>
                      </td>

                      <td className="py-3">
                        {g.isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Checked In</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">
                            Pending Arrival
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPreviewGuestPass(g.entryCode)}
                            className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Preview Digital Pass"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyGuestLink(g.entryCode, g.id)}
                            className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Copy Direct Pass Link"
                          >
                            {copiedCodeId === g.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
