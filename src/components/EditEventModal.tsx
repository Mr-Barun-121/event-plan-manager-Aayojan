import React, { useState, useEffect } from 'react';
import { EventProfile } from '../types';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Sparkles, 
  Check, 
  HeartHandshake, 
  Utensils 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventProfile;
  onSave: (updatedEvent: EventProfile) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
}) => {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [location, setLocation] = useState(event.location);
  const [guestCount, setGuestCount] = useState(String(event.guestCount));
  const [totalBudget, setTotalBudget] = useState(String(event.totalBudget));
  const [theme, setTheme] = useState(event.theme || '');
  const [culturalPreferences, setCulturalPreferences] = useState(event.culturalPreferences || '');
  const [dietaryNeeds, setDietaryNeeds] = useState(event.dietaryNeeds || '');

  useEffect(() => {
    setTitle(event.title);
    setDate(event.date);
    setLocation(event.location);
    setGuestCount(String(event.guestCount));
    setTotalBudget(String(event.totalBudget));
    setTheme(event.theme || '');
    setCulturalPreferences(event.culturalPreferences || '');
    setDietaryNeeds(event.dietaryNeeds || '');
  }, [event, isOpen]);

  // Escape key handler for accessibility
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EventProfile = {
      ...event,
      title: title.trim() || event.title,
      date,
      location: location.trim() || event.location,
      guestCount: parseInt(guestCount, 10) || event.guestCount,
      totalBudget: parseFloat(totalBudget) || event.totalBudget,
      theme: theme.trim(),
      culturalPreferences: culturalPreferences.trim(),
      dietaryNeeds: dietaryNeeds.trim(),
    };

    onSave(updated);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
    >
      <div className="bg-[#FFFDF9] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-200/90 my-8 relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close edit celebration modal"
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-amber-100/50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-700 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 id="edit-event-title" className="font-display font-black text-xl text-stone-900 tracking-tight">
              Edit Celebration Parameters
            </h3>
            <p className="text-xs text-stone-500">
              Update headcount, target budget, or date for real-time recalculations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Celebration Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Event Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" /> City / Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" /> Target Headcount
              </label>
              <input
                type="number"
                min="1"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Total Budget ({event.currency})
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Theme / Styling Vision
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Traditional Royal with Pastel touches"
              className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-amber-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
