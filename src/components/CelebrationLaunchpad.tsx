import React, { useState } from 'react';
import { UserAccount, EventProfile, CompletePlan } from '../types';
import { 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  HeartHandshake, 
  Cake, 
  PartyPopper, 
  Flame, 
  GlassWater,
  Send,
  Bot,
  Lightbulb
} from 'lucide-react';

interface CelebrationLaunchpadProps {
  user: UserAccount;
  currency: string;
  onOpenIntake: (preset?: Partial<EventProfile>) => void;
  onQuickGeneratePrompt: (promptText: string) => void;
  isGeneratingPrompt: boolean;
}

export const CelebrationLaunchpad: React.FC<CelebrationLaunchpadProps> = ({
  user,
  currency,
  onOpenIntake,
  onQuickGeneratePrompt,
  isGeneratingPrompt,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');

  const celebrationPicks = [
    {
      title: 'Grand Wedding & Sangeet',
      type: 'Wedding',
      icon: '💍',
      tagline: 'Multi-day ceremonies, mandap decor & catering',
      defaultBudget: currency === '₹' ? 800000 : 25000,
      defaultGuests: 150,
      theme: 'Royal Heritage with Modern Pastel Elegance',
      cultural: 'Sangeet dance performances, sunset ceremony, live counters',
      vibeGradient: 'from-amber-500/15 via-rose-500/10 to-amber-50/50',
      borderAccent: 'hover:border-amber-400',
    },
    {
      title: 'Milestone Birthday Party',
      type: 'Birthday',
      icon: '🎂',
      tagline: 'Themed styling, custom bakery cake & live entertainer',
      defaultBudget: currency === '₹' ? 45000 : 1800,
      defaultGuests: 35,
      theme: 'Galactic Space Explorer / Retro Arcade',
      cultural: 'Family friendly, kid safety first, interactive games',
      vibeGradient: 'from-purple-500/15 via-indigo-500/10 to-purple-50/50',
      borderAccent: 'hover:border-purple-400',
    },
    {
      title: 'Festival & Community Fair',
      type: 'Community Festival',
      icon: '🪔',
      tagline: 'Cultural food stalls, municipal permits & stage audio',
      defaultBudget: currency === '₹' ? 250000 : 7500,
      defaultGuests: 300,
      theme: 'Autumn Harvest & Global Cultural Marketplace',
      cultural: 'Multicultural booths, inclusive zero-waste access',
      vibeGradient: 'from-emerald-500/15 via-amber-500/10 to-emerald-50/50',
      borderAccent: 'hover:border-emerald-400',
    },
    {
      title: 'Anniversary or Dinner Gala',
      type: 'Anniversary',
      icon: '🍾',
      tagline: 'Acoustic strings, wine pairings & plated banquet',
      defaultBudget: currency === '₹' ? 350000 : 12000,
      defaultGuests: 80,
      theme: 'Vintage Candlelit Vineyard Elegance',
      cultural: 'Toasts, memory slideshow, custom cocktail pairings',
      vibeGradient: 'from-rose-500/15 via-orange-500/10 to-rose-50/50',
      borderAccent: 'hover:border-rose-400',
    },
  ];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || isGeneratingPrompt) return;
    onQuickGeneratePrompt(quickPrompt.trim());
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      
      {/* Warm Celebration Hero Banner */}
      <div className="text-center relative py-8 px-4">
        
        {/* Festive badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Your Celebration Workspace</span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Welcome, {user.name}!
        </h2>
        <p className="font-serif-festive italic text-lg sm:text-xl text-amber-800 font-semibold mt-2">
          Every great celebration begins with an inspired idea.
        </p>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto mt-2 leading-relaxed">
          You currently have no events. You can start with a clean conversational prompt below, or pick a festive template to instantly generate a budget, backwards timeline, and vendor checklists!
        </p>

        {/* Natural Language AI Prompt Input Box */}
        <div className="max-w-2xl mx-auto mt-8">
          <form
            onSubmit={handlePromptSubmit}
            className="bg-white rounded-2xl p-2.5 shadow-xl border-2 border-amber-300/80 focus-within:border-amber-500 transition-all flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-2 flex-1 px-3 w-full">
              <Bot className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                disabled={isGeneratingPrompt}
                placeholder="Describe your event: 'A 150-guest Jaipur wedding in December with ₹10 Lakh budget'..."
                className="w-full text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!quickPrompt.trim() || isGeneratingPrompt}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{isGeneratingPrompt ? 'AI Planning...' : 'Craft Master Plan'}</span>
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-stone-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Try: "7th astronaut birthday for 30 kids with cake & magician"</span>
          </div>
        </div>

      </div>

      {/* Or Select a Festive Category Blueprint */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
              <span>Choose a Celebration Category</span>
            </h3>
            <p className="text-xs text-stone-500">
              Launch a structured AI plan with realistic industry budget allocations and vendor leads.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenIntake()}
            className="text-xs font-bold text-stone-800 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Custom Blank Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {celebrationPicks.map((pick, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border border-stone-200/90 bg-linear-to-br ${pick.vibeGradient} ${pick.borderAccent} transition-all shadow-xs hover:shadow-md flex flex-col justify-between group cursor-pointer`}
              onClick={() => {
                onOpenIntake({
                  eventType: pick.type,
                  title: `${user.name}'s ${pick.title}`,
                  guestCount: pick.defaultGuests,
                  totalBudget: pick.defaultBudget,
                  currency,
                  theme: pick.theme,
                  culturalPreferences: pick.cultural,
                });
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-3xl p-2 rounded-2xl bg-white shadow-xs border border-stone-100">
                    {pick.icon}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-900 text-white uppercase tracking-wider">
                    {pick.type}
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                  {pick.title}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {pick.tagline}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-stone-500">
                  <span>Guests: <strong>{pick.defaultGuests}</strong></span>
                  <span>•</span>
                  <span>Est Budget: <strong>{currency}{pick.defaultBudget.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-bold text-amber-900 group-hover:translate-x-0.5 transition-transform">
                <span>Start with this Blueprint</span>
                <ArrowRight className="w-4 h-4 text-amber-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
