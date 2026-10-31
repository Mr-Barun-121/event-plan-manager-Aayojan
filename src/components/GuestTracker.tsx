import React, { useState, useMemo } from 'react';
import { GuestRecord, EventProfile } from '../types';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Plus, 
  Trash2, 
  UtensilsCrossed, 
  Mail, 
  Phone,
  Sparkles
} from 'lucide-react';

interface GuestTrackerProps {
  event: EventProfile;
  guests: GuestRecord[];
  setGuests: React.Dispatch<React.SetStateAction<GuestRecord[]>>;
  onAskCopilot: (prompt: string) => void;
}

export const GuestTracker: React.FC<GuestTrackerProps> = ({
  event,
  guests,
  setGuests,
  onAskCopilot,
}) => {
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [dietary, setDietary] = useState<GuestRecord['dietary']>('Standard');
  const [tableOrGroup, setTableOrGroup] = useState('Table 1');
  const [notes, setNotes] = useState('');

  // Metrics
  const attendingGuests = useMemo(() => guests.filter((g) => g.rsvpStatus === 'attending'), [guests]);
  const declinedGuests = useMemo(() => guests.filter((g) => g.rsvpStatus === 'declined'), [guests]);
  const pendingGuests = useMemo(() => guests.filter((g) => g.rsvpStatus === 'pending'), [guests]);

  const totalHeadcount = useMemo(() => {
    return attendingGuests.reduce((acc, g) => acc + (g.partySize || 1), 0);
  }, [attendingGuests]);

  // Dietary counts
  const dietaryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    attendingGuests.forEach((g) => {
      const diet = g.dietary || 'Standard';
      map[diet] = (map[diet] || 0) + (g.partySize || 1);
    });
    return map;
  }, [attendingGuests]);

  const filteredGuests = useMemo(() => {
    if (filterRsvp === 'all') return guests;
    return guests.filter((g) => g.rsvpStatus === filterRsvp);
  }, [guests, filterRsvp]);

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGuest: GuestRecord = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      partySize: parseInt(partySize, 10) || 1,
      rsvpStatus: 'pending',
      dietary,
      tableOrGroup: tableOrGroup.trim(),
      notes: notes.trim(),
    };

    setGuests((prev) => [...prev, newGuest]);
    setName('');
    setEmail('');
    setPhone('');
    setPartySize('1');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleUpdateStatus = (id: string, status: GuestRecord['rsvpStatus']) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, rsvpStatus: status } : g)));
  };

  const handleDeleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Header and RSVP Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Target vs Confirmed */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Guests</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {event.guestCount}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Target headcount for venue & catering
          </p>
        </div>

        {/* Attending Count */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs text-emerald-950">
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Attending</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black tracking-tight">
            {totalHeadcount} <span className="text-sm font-semibold text-emerald-700">headcount</span>
          </div>
          <p className="text-xs opacity-80 mt-2">
            {attendingGuests.length} parties attending
          </p>
        </div>

        {/* Pending RSVPs */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs text-amber-950">
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting RSVP</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black tracking-tight">
            {pendingGuests.length}
          </div>
          <p className="text-xs opacity-80 mt-2">
            Need reminder dispatch
          </p>
        </div>

        {/* Declined */}
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 shadow-xs text-stone-700">
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-semibold uppercase tracking-wider">Declined</span>
            <UserX className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {declinedGuests.length}
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Politely acknowledged
          </p>
        </div>

      </div>

      {/* Dietary Requirements Breakdown Bar */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs festive-card-glow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-bold text-stone-900 text-sm flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span>Catering Dietary Manifest for {totalHeadcount} Confirmed Guests</span>
          </h4>
          <button
            type="button"
            onClick={() => onAskCopilot(`Based on our confirmed dietary counts (${JSON.stringify(dietaryCounts)}), what specific menu adjustments should we order from our caterer?`)}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Menu Balance</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {Object.entries(dietaryCounts).map(([diet, count]) => (
            <div key={diet} className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold text-stone-800">{diet}:</span>
              <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">{count} guests</span>
            </div>
          ))}
          {Object.keys(dietaryCounts).length === 0 && (
            <p className="text-xs text-stone-400 italic">No confirmed dietary counts recorded yet.</p>
          )}
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-base">Guest Directory</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              {filteredGuests.length} listed
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl text-xs font-semibold border border-stone-200">
              {['all', 'attending', 'pending', 'declined'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterRsvp(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filterRsvp === st ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl transition-colors shadow-xs ml-auto sm:ml-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guest</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-400 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Party Size</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4">Dietary Preference</th>
                <th className="py-3 px-4">Table / Group</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="font-bold text-stone-800 text-xs">No guests in guestlist yet</p>
                      <p className="text-[11px] text-stone-500">
                        Click &quot;Add Guest / Party&quot; to build your attendee list, or share your Master Event Code in Invitations for guest self-registration.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => (
                <tr key={g.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-stone-900 block">{g.name}</span>
                    {g.notes && <span className="text-[11px] text-stone-400 block">{g.notes}</span>}
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-800 whitespace-nowrap">
                    {g.partySize} {g.partySize === 1 ? 'person' : 'people'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={g.rsvpStatus}
                      onChange={(e) => handleUpdateStatus(g.id, e.target.value as any)}
                      className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                        g.rsvpStatus === 'attending'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : g.rsvpStatus === 'declined'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="attending">Attending</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-stone-700">
                    {g.dietary}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-stone-600">
                    {g.tableOrGroup || '—'}
                  </td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap text-[11px]">
                    {g.email && <div>{g.email}</div>}
                    {g.phone && <div>{g.phone}</div>}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteGuest(g.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 mb-1">Add Guest or Party</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add guests to coordinate seating and meal catering.
            </p>

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram & Sunita Sharma"
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Dietary Requirement</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value as any)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                    <option value="Child">Child meal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Table or Group</label>
                  <input
                    type="text"
                    value={tableOrGroup}
                    onChange={(e) => setTableOrGroup(e.target.value)}
                    placeholder="e.g. Table 4 / Cousins"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Special Notes / Accessibility</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Highchair needed, allergic to shellfish..."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
