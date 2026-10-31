import React, { useState } from 'react';
import { IdeaItem, EventProfile } from '../types';
import { 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  RefreshCw, 
  Palette, 
  Utensils, 
  PartyPopper, 
  Gift, 
  Lightbulb, 
  Plus, 
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IdeasEngineProps {
  event: EventProfile;
  ideas: IdeaItem[];
  setIdeas: React.Dispatch<React.SetStateAction<IdeaItem[]>>;
  onSaveToPlan: (idea: IdeaItem) => void;
  onAddIdeaToBudget?: (idea: IdeaItem) => void;
  onAskCopilot: (prompt: string) => void;
}

export const IdeasEngine: React.FC<IdeasEngineProps> = ({
  event,
  ideas,
  setIdeas,
  onSaveToPlan,
  onAddIdeaToBudget,
  onAskCopilot,
}) => {
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const filterKinds = [
    { id: 'all', label: 'All Ideas', icon: Sparkles },
    { id: 'theme', label: 'Themes & Styling', icon: Palette },
    { id: 'menu', label: 'Menu & Tastings', icon: Utensils },
    { id: 'entertainment', label: 'Entertainment & Games', icon: PartyPopper },
    { id: 'favors', label: 'Favors & Gifts', icon: Gift },
    { id: 'hacks', label: 'Cost-Saving Hacks', icon: Lightbulb },
  ];

  const filteredIdeas = ideas.filter((idea) => {
    const matchKind = kindFilter === 'all' || idea.kind === kindFilter;
    const matchCost = costFilter === 'all' || idea.costRating === costFilter;
    return matchKind && matchCost;
  });

  const handleToggleSave = (idea: IdeaItem) => {
    const nextSaved = !idea.saved;
    setIdeas((prev) =>
      prev.map((i) => (i.id === idea.id ? { ...i, saved: nextSaved } : i))
    );
    if (nextSaved) {
      onSaveToPlan(idea);
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
    }
  };

  const handleRequestMoreIdeas = async () => {
    setIsRegenerating(true);
    onAskCopilot(`Brainstorm 4 new creative, personalized ideas for ${event.title} (${event.eventType}) covering menu items, interactive games, and unique favors matching our "${event.theme}" theme.`);
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-amber-600 via-orange-600 to-rose-700 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400/40">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100 shadow-xs border border-white/30">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-200" />
            </span>
            <h3 className="font-display font-black text-xl sm:text-2xl tracking-tight">Celebration Inspiration Engine</h3>
          </div>
          <p className="font-serif-festive italic text-xs sm:text-sm text-amber-100/90 mt-1.5 max-w-xl">
            AI-curated sensory themes, festive color palettes, culinary concepts, and delightful guest interaction rituals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestMoreIdeas}
          disabled={isRegenerating}
          className="text-xs font-bold bg-white text-stone-900 hover:bg-amber-50 px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-600' : 'text-stone-700'}`} />
          <span>{isRegenerating ? 'Generating...' : 'Brainstorm More Ideas'}</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Kind Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filterKinds.map((k) => {
            const Icon = k.icon;
            const isActive = kindFilter === k.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKindFilter(k.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cost Rating Filter */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
          <span className="text-[11px] text-stone-400 font-semibold px-2">Budget:</span>
          {['all', '$', '$$', '$$$'].map((cost) => (
            <button
              key={cost}
              type="button"
              onClick={() => setCostFilter(cost)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                costFilter === cost ? 'bg-amber-100 text-amber-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {cost === 'all' ? 'Any' : cost}
            </button>
          ))}
        </div>
      </div>

      {/* Idea Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.map((idea) => {
          const isSaved = idea.saved;

          return (
            <div
              key={idea.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isSaved
                  ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              <div>
                {/* Header Tag and Budget */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {idea.kind}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      Cost: {idea.costRating}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSave(idea)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSaved
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                      }`}
                      title={isSaved ? 'Saved to Plan' : 'Save to Plan'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-extrabold text-stone-900 text-base leading-snug mb-1">
                  {idea.title}
                </h4>

                {/* Vibe badge */}
                <div className="text-[11px] font-semibold text-amber-800 mb-2">
                  ✨ Vibe: {idea.vibe}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {idea.description}
                </p>

                {/* Color Palette (if present) */}
                {idea.palette && idea.palette.length > 0 && (
                  <div className="mb-4 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">
                      Suggested Color Palette
                    </span>
                    <div className="flex items-center gap-2">
                      {idea.palette.map((color, cIdx) => (
                        <div key={cIdx} className="flex flex-col items-center gap-1">
                          <span
                            className="w-7 h-7 rounded-lg shadow-xs border border-white"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                          <span className="text-[9px] font-mono text-stone-400">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSave(idea)}
                    className={`font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                      isSaved ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isSaved ? 'Saved as Task' : 'Save as Task'}</span>
                  </button>

                  {onAddIdeaToBudget && (
                    <button
                      type="button"
                      onClick={() => onAddIdeaToBudget(idea)}
                      className="font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                      title="Add this idea as an item in your budget breakdown"
                    >
                      + Add to Budget
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onAskCopilot(`How can we implement the "${idea.title}" idea specifically into our timeline tasks and budget for ${event.title}?`)}
                  className="text-amber-800 hover:text-amber-950 font-bold ml-auto"
                >
                  AI Advice →
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
