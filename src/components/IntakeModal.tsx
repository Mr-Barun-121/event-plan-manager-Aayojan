import React, { useState, useEffect } from 'react';
import { EventProfile, CompletePlan } from '../types';
import { 
  Sparkles, 
  X, 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  HeartHandshake, 
  Utensils, 
  Bot,
  ArrowRight,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (event: EventProfile, plan: CompletePlan) => void;
  currency: string;
  initialPreset?: Partial<EventProfile> | null;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
  currency: defaultCurrency,
  initialPreset,
}) => {
  const [eventType, setEventType] = useState('Wedding');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [totalBudget, setTotalBudget] = useState('15000');
  const [currency, setCurrency] = useState(defaultCurrency || '₹');
  const [theme, setTheme] = useState('');
  const [culturalPreferences, setCulturalPreferences] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [notes, setNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  useEffect(() => {
    if (initialPreset) {
      if (initialPreset.eventType) setEventType(initialPreset.eventType);
      if (initialPreset.title) setTitle(initialPreset.title);
      if (initialPreset.date) setDate(initialPreset.date);
      if (initialPreset.location) setLocation(initialPreset.location);
      if (initialPreset.guestCount) setGuestCount(String(initialPreset.guestCount));
      if (initialPreset.totalBudget) setTotalBudget(String(initialPreset.totalBudget));
      if (initialPreset.currency) setCurrency(initialPreset.currency);
      if (initialPreset.theme) setTheme(initialPreset.theme);
      if (initialPreset.culturalPreferences) setCulturalPreferences(initialPreset.culturalPreferences);
      if (initialPreset.dietaryNeeds) setDietaryNeeds(initialPreset.dietaryNeeds);
      if (initialPreset.notes) setNotes(initialPreset.notes);
    }
  }, [initialPreset, isOpen]);

  const eventTypes = [
    'Wedding',
    'Birthday',
    'Community Festival',
    'Anniversary',
    'Corporate Gala',
    'Baby Shower',
    'Dinner Party',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationStep('Engaging Gemini 3.8 Flash model...');

    const timer1 = setTimeout(() => {
      setGenerationStep('Calculating category proportions & 10% contingency buffer...');
    }, 900);

    const timer2 = setTimeout(() => {
      setGenerationStep('Constructing backwards countdown timeline tasks...');
    }, 1800);

    const timer3 = setTimeout(() => {
      setGenerationStep('Drafting vendor red-flag checklists & personalized theme palettes...');
    }, 2700);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || `${eventType} Celebration`,
          eventType,
          date,
          location: location.trim() || 'Central Venue',
          guestCount: parseInt(guestCount, 10) || 50,
          totalBudget: parseFloat(totalBudget) || 10000,
          currency,
          theme: theme.trim() || 'Warm & Elegant Celebration',
          culturalPreferences: culturalPreferences.trim() || 'Modern & Inclusive',
          dietaryNeeds: dietaryNeeds.trim() || 'Vegetarian and standard selections',
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const resData = await response.json();
      const planData = resData.data;

      const newEvent: EventProfile = {
        id: `event-${Date.now()}`,
        title: title.trim() || `${eventType} Celebration`,
        eventType,
        date,
        location: location.trim() || 'Central Venue',
        guestCount: parseInt(guestCount, 10) || 50,
        totalBudget: parseFloat(totalBudget) || 10000,
        currency,
        theme: theme.trim() || 'Warm & Elegant Celebration',
        culturalPreferences: culturalPreferences.trim() || 'Modern & Inclusive',
        dietaryNeeds: dietaryNeeds.trim() || 'Vegetarian and standard selections',
        notes: notes.trim(),
        ownerName: 'Lead Host',
        createdAt: new Date().toISOString(),
      };

      const completePlan: CompletePlan = {
        summary: planData.summary || `Personalized master celebration plan for ${newEvent.title}.`,
        budgetItems: planData.budgetItems || [],
        timelineTasks: planData.timelineTasks || [],
        vendorChecklists: planData.vendorChecklists || [],
        ideas: planData.ideas || [],
        smartTips: planData.smartTips || [],
        vendors: [],
        guests: [],
      };

      onPlanGenerated(newEvent, completePlan);
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
      onClose();
    } catch (err) {
      console.error('Error generating event plan:', err);
      alert('Could not complete automated plan creation. Please try again.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-modal-title"
    >
      <div className="bg-[#FFFDF9] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-200/90 my-8 relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close celebration designer"
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-amber-100/50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 border border-amber-300">
            <Sparkles className="w-6 h-6 animate-pulse text-amber-100" />
          </div>
          <div>
            <h3 id="intake-modal-title" className="font-display text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Design New Celebration Plan
            </h3>
            <p className="font-serif-festive italic text-xs text-amber-800 font-medium">
              Powered by Google Gemini 3.8 Flash
            </p>
          </div>
        </div>

        {/* Loading overlay during AI generation */}
        {isGenerating ? (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin flex items-center justify-center" />
              <img
                src="/assets/aistudio/image_dc559869.png"
                alt="Aayojan Logo"
                className="w-12 h-12 object-contain absolute inset-0 m-auto"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-extrabold text-stone-900 text-lg">
                Aayojan is Crafting Your Master Plan
              </h4>
              <p className="font-serif-festive italic text-xs text-amber-800 font-semibold animate-pulse">
                {generationStep}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-5">
            
            {/* Event Type Pills */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Celebration Type
              </label>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      eventType === type
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-amber-50/70 text-stone-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Celebration Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diya & Kabir's Sunset Wedding / Leo's Galactic 7th Birthday"
                className="w-full text-xs sm:text-sm bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Date, Location, Guests, Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" /> Target Date
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
                  <MapPin className="w-3.5 h-3.5 text-amber-600" /> City / Destination
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Udaipur or Goa or San Francisco"
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-600" /> Expected Guest Count
                </label>
                <input
                  type="number"
                  min="5"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Target Total Budget
                </label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-20 text-xs font-bold bg-amber-50 border border-stone-300 rounded-xl px-2 py-2"
                  >
                    <option value="₹">₹ INR</option>
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                  </select>
                  <input
                    type="number"
                    min="100"
                    required
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    placeholder="e.g. 800000 or 25000"
                    className="flex-1 text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Theme, Culture & Dietary */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Theme & Decor Styling
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Royal Marigold Courtyard, Boho Chic, or Outer Space"
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-600" /> Cultural Rituals & Elements
                  </label>
                  <input
                    type="text"
                    value={culturalPreferences}
                    onChange={(e) => setCulturalPreferences(e.target.value)}
                    placeholder="e.g. Sangeet + Mehendi, sunset vows, dhol entry"
                    className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" /> Dietary & Must-Haves
                  </label>
                  <input
                    type="text"
                    value={dietaryNeeds}
                    onChange={(e) => setDietaryNeeds(e.target.value)}
                    placeholder="e.g. Vegetarian buffet, live chaat, eggless cake"
                    className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-amber-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 text-white shadow-lg transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Generate Master Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
