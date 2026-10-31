import React from 'react';
import { EventProfile, UserAccount } from '../types';
import { formatCurrency, getDaysRemaining, formatEventDate } from '../utils/formatters';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Share2, 
  PlusCircle, 
  Bot, 
  ChevronDown,
  Layers,
  Clock,
  LogOut,
  User as UserIcon,
  Trash2,
  Ticket,
  Cloud
} from 'lucide-react';

interface HeaderProps {
  user: UserAccount | null;
  onLogout: () => void;
  event: EventProfile | null;
  userEvents: EventProfile[];
  onSelectEvent: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenIntake: () => void;
  onOpenExport: () => void;
  onOpenCodeModal?: () => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  currency: string;
  onCurrencyChange: (curr: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  event,
  userEvents,
  onSelectEvent,
  onDeleteEvent,
  activeTab,
  setActiveTab,
  onOpenIntake,
  onOpenExport,
  onOpenCodeModal,
  isCopilotOpen,
  setIsCopilotOpen,
  currency,
  onCurrencyChange,
}) => {
  const daysInfo = event ? getDaysRemaining(event.date) : null;

  const tabs = [
    { id: 'budget', label: 'Budget Planner', icon: DollarSign, badge: null },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Clock, badge: null },
    { id: 'vendors', label: 'Vendor Hub', icon: Layers, badge: null },
    { id: 'ideas', label: 'Ideas Engine', icon: Sparkles, badge: 'AI' },
    { id: 'guests', label: 'Guest List', icon: Users, badge: null },
    { id: 'invitations', label: 'Invitations & Passes', icon: Ticket, badge: 'Gate' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Festive Brand Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/image_dc559869.png"
              alt="Aayojan Logo"
              className="w-11 h-11 object-contain rounded-xl shadow-xs border border-amber-200/90 bg-white p-0.5 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-stone-900">
                  Aayojan
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Events • Celebrations • Weddings
                </span>
              </div>
              <p className="font-serif-festive italic text-xs text-amber-800/80 hidden sm:block truncate max-w-xs">
                GenAI Planning Suite
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* User Events Switcher Dropdown (if user has events) */}
            {userEvents.length > 0 && event && (
              <div className="relative group">
                <button 
                  type="button" 
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 bg-amber-50/80 hover:bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                  title="Switch between your celebrations"
                >
                  <span className="hidden md:inline text-amber-700">Celebration:</span>
                  <span className="font-bold truncate max-w-[110px] sm:max-w-[150px]">
                    {event.title}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                </button>
                
                <div className="absolute right-0 mt-1 w-72 bg-white border border-amber-200 rounded-2xl shadow-xl p-2 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Your Celebrations</span>
                    <span>{userEvents.length} Total</span>
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                    {userEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          ev.id === event.id
                            ? 'bg-amber-100 text-amber-950 font-bold'
                            : 'hover:bg-amber-50 text-stone-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectEvent(ev.id)}
                          className="flex-1 text-left truncate mr-2"
                        >
                          <div className="truncate">{ev.title}</div>
                          <div className="text-[10px] font-normal text-stone-500">
                            {ev.eventType} • {ev.guestCount} guests
                          </div>
                        </button>
                        {onDeleteEvent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${ev.title}"?`)) {
                                onDeleteEvent(ev.id);
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                            title="Delete this event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={onOpenIntake}
                      className="w-full text-center py-1.5 px-3 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ Plan Another Event</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Currency selector */}
            <div className="flex items-center text-xs bg-amber-50/80 rounded-xl p-0.5 border border-amber-200">
              {['₹', '$', '€', '£'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCurrencyChange(c)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all ${
                    currency === c
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Cloud Storage Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-[10px] text-emerald-800 font-bold" title="Backed up permanently in Firebase Firestore cloud">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3 h-3 text-emerald-600" />
              <span>Firebase Cloud</span>
            </div>

            {/* Enter Unique Code / Guest Access Button */}
            {onOpenCodeModal && (
              <button
                type="button"
                onClick={onOpenCodeModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                title="Open invitation or check in using unique entry code"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Enter Code</span>
              </button>
            )}

            {/* AI Wizard / New Event Button */}
            <button
              type="button"
              onClick={onOpenIntake}
              className="flex items-center gap-1.5 text-xs font-bold bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">New Plan</span>
            </button>

            {/* Export & Share Button (if event exists) */}
            {event && (
              <button
                type="button"
                onClick={onOpenExport}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-amber-50/50 border border-stone-300 px-3 py-1.5 rounded-xl transition-colors"
                title="Export ICS Calendar, CSV Budget, or Share"
              >
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden md:inline">Export</span>
              </button>
            )}

            {/* Copilot Toggle Button (if event exists) */}
            {event && (
              <button
                type="button"
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isCopilotOpen
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                    : 'bg-amber-100/70 text-amber-950 border-amber-300 hover:bg-amber-200/70'
                }`}
              >
                <Bot className="w-4 h-4 animate-bounce text-amber-900" />
                <span className="hidden sm:inline">AI Co-pilot</span>
              </button>
            )}

            {/* User Profile & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-amber-200">
                <div
                  className="w-7 h-7 rounded-full bg-linear-to-tr from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                  title={`Signed in as ${user.name} (${user.email})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Sign out of Aayojan"
                  >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Current Active Event Banner Info (if event selected) */}
        {event && daysInfo && (
          <div className="py-2.5 border-t border-amber-100 flex flex-wrap items-center justify-between gap-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-600">
              <span className="font-display font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {event.title}
              </span>
              <span className="hidden md:inline text-amber-200">•</span>
              <span className="flex items-center gap-1 text-stone-700">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {formatEventDate(event.date)}
              </span>
              <span className="hidden md:inline text-amber-200">•</span>
              <span className="flex items-center gap-1 text-stone-700">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </span>
              <span className="hidden md:inline text-amber-200">•</span>
              <span className="flex items-center gap-1 text-stone-700">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                {event.guestCount} Guests
              </span>
              <span className="hidden md:inline text-amber-200">•</span>
              <span className="font-bold text-amber-950">
                Budget: {formatCurrency(event.totalBudget, currency)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                daysInfo.isPast 
                  ? 'bg-stone-100 text-stone-600'
                  : daysInfo.days <= 30
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                ⏳ {daysInfo.label}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs (if event selected) */}
        {event && (
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-amber-50/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
};
