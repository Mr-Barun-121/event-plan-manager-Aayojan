import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, EventProfile, CompletePlan } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventProfile;
  plan: CompletePlan;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onApplyPatch: (patch: { action: string; payload: any }) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  event,
  plan,
  messages,
  setMessages,
  onApplyPatch,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedPatches, setAppliedPatches] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Suggest 5 creative ways to save 15% on catering',
    'What critical questions should I ask during a venue tour?',
    'Add an interactive Photo Booth budget item for $500',
    'Compress my timeline tasks into a 6-week countdown',
    'Recommend unique return gift favors for guests of all ages',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentEvent: event,
          currentPlan: {
            budgetItems: plan.budgetItems,
            timelineTasks: plan.timelineTasks,
            vendors: plan.vendors,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI co-pilot');
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        content: data.reply || "I've reviewed your request!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patch: data.patch,
      };

      setMessages((prev) => [...prev, botMessage]);

      // If there is an automatic patch, trigger slight celebration if auto-applied or notify
      if (data.patch) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err: any) {
      console.error('Co-pilot error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `I hit a brief snag, but here is my planning advice: Ensure your primary vendor deposits are secured first and always keep 10% in contingency. Try re-sending your question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (messageId: string, patch: any) => {
    if (!patch) return;
    onApplyPatch(patch);
    setAppliedPatches((prev) => ({ ...prev, [messageId]: true }));
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        content: `Hi there! I'm your Aayojan GenAI co-pilot for **${event.title}**. Ask me to analyze your budget, write contract questions for vendors, suggest themes, or generate backwards timeline milestones!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

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

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] lg:w-[480px] bg-white shadow-2xl border-l border-stone-200 flex flex-col transition-all duration-300"
      role="region"
      aria-label="Aayojan AI Co-pilot Chat Workspace"
    >
      
      {/* Header */}
      <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/image_dc559869.png"
            alt="Aayojan Logo"
            className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm">Aayojan Co-Pilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[11px] text-stone-400">
              Gemini 3.8 Flash • Contextual to {event.eventType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            className="p-1.5 text-stone-400 hover:text-white rounded-md hover:bg-stone-800 transition-colors"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-md hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        
        {/* Context Chip */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Active Event:</span> {event.title} ({event.guestCount} guests, budget {event.currency}{event.totalBudget}). You can ask me to directly adjust budget allocations or inject tasks into your timeline!
          </div>
        </div>

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-stone-900 text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Interactive Action Patch Card */}
                {msg.patch && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-stone-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Plan Update Available:
                    </div>
                    <p className="text-xs text-stone-600 mb-2 font-mono">
                      {msg.patch.action?.replace(/_/g, ' ').toUpperCase()}: {msg.patch.payload?.name || msg.patch.payload?.title || 'Custom update'}
                    </p>
                    <button
                      type="button"
                      disabled={appliedPatches[msg.id]}
                      onClick={() => handleApply(msg.id, msg.patch)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        appliedPatches[msg.id]
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {appliedPatches[msg.id] ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Applied to Workspace!
                        </>
                      ) : (
                        <>
                          <span>Apply to Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-500 bg-white border border-stone-200 px-3 py-2 rounded-xl w-fit">
            <Bot className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>Aayojan is thinking &amp; crunching numbers...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-stone-100/70 border-t border-stone-200">
        <div className="text-[11px] font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-600" />
          <span>Quick actions:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${event.title}...`}
            className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
