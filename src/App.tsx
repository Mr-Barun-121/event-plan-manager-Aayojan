import React, { useState, useEffect } from 'react';
import { 
  EventProfile, 
  CompletePlan, 
  BudgetItem, 
  TimelineTask, 
  VendorRecord, 
  IdeaItem, 
  GuestRecord, 
  ChatMessage,
  UserAccount,
  UserEventStore
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { CelebrationLaunchpad } from './components/CelebrationLaunchpad';
import { Header } from './components/Header';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelinePlanner } from './components/TimelinePlanner';
import { VendorHub } from './components/VendorHub';
import { IdeasEngine } from './components/IdeasEngine';
import { GuestTracker } from './components/GuestTracker';
import { CopilotDrawer } from './components/CopilotDrawer';
import { IntakeModal } from './components/IntakeModal';
import { ExportModal } from './components/ExportModal';
import { EditEventModal } from './components/EditEventModal';
import { InvitationHub } from './components/InvitationHub';
import { GuestPassModal } from './components/GuestPassModal';
import { EnterCodeModal } from './components/EnterCodeModal';
import { 
  auth, 
  saveEventToFirestore, 
  deleteEventFromFirestore, 
  subscribeUserEvents, 
  testConnection, 
  generateUniqueCode 
} from './utils/firebase';
import { signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { 
  Sparkles, 
  Lightbulb, 
  Bot, 
  Edit3, 
  PartyPopper, 
  CheckCircle2, 
  X,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerGrandCelebration, triggerMilestoneCelebration } from './utils/celebration';

const USER_SESSION_KEY = 'eventgenie_user_session_v2';
const USER_EVENTS_PREFIX = 'eventgenie_events_v2_';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_SESSION_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // User's Events State (Empty by default for each user - No predefined data)
  const [userStores, setUserStores] = useState<UserEventStore[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Active Event Workspace Data
  const [activeEvent, setActiveEvent] = useState<EventProfile | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [vendorChecklists, setVendorChecklists] = useState<any[]>([]);
  const [smartTips, setSmartTips] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [currency, setCurrency] = useState<string>('₹');

  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState<string>('budget');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [intakePreset, setIntakePreset] = useState<Partial<EventProfile> | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [celebrationNotification, setCelebrationNotification] = useState<{
    title: string;
    subtitle: string;
    icon?: string;
  } | null>(null);

  // Invitation & Unique Entry Pass Modals
  const [isEnterCodeModalOpen, setIsEnterCodeModalOpen] = useState(false);
  const [activeGuestPassCode, setActiveGuestPassCode] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(true);

  // AI Co-pilot Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 1. Connection check and URL invite code listener on boot
  useEffect(() => {
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    // Check if user/guest arrived with ?code=EVT-XXXX or #code=...
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setActiveGuestPassCode(codeParam.trim().toUpperCase());
    }
  }, []);

  // 2. Firebase Auth session listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setCurrentUser((prev) => {
          const account: UserAccount = {
            id: fbUser.uid,
            name: fbUser.displayName || prev?.name || 'Celebration Host',
            email: fbUser.email || prev?.email || '',
            preferredCurrency: prev?.preferredCurrency || '₹',
            avatarColor: prev?.avatarColor || '#F59E0B',
          };
          try {
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(account));
          } catch (e) {
            console.warn('Could not cache session', e);
          }
          return account;
        });
      } else {
        // Unauthenticated visitor must see the clean login interface
        setCurrentUser(null);
        setUserStores([]);
        setActiveEvent(null);
        setActiveEventId(null);
        setBudgetItems([]);
        setTimelineTasks([]);
        setVendors([]);
        setIdeas([]);
        setGuests([]);
        setVendorChecklists([]);
        setSmartTips([]);
        setSummary('');
        try {
          localStorage.removeItem(USER_SESSION_KEY);
        } catch {
          // ignore
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Load user's saved events from local storage, and Firestore when authenticated
  useEffect(() => {
    if (!currentUser) {
      setUserStores([]);
      setActiveEventId(null);
      setActiveEvent(null);
      setBudgetItems([]);
      setTimelineTasks([]);
      setVendors([]);
      setIdeas([]);
      setGuests([]);
      setVendorChecklists([]);
      setSmartTips([]);
      setSummary('');
      return;
    }

    // First load from local cache for instant UI rendering
    try {
      const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: UserEventStore[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setUserStores(parsed);
          const first = parsed[0];
          setActiveEventId(first.event.id);
          setActiveEvent(first.event);
          setBudgetItems(first.plan.budgetItems || []);
          setTimelineTasks(first.plan.timelineTasks || []);
          setVendors(first.plan.vendors || []);
          setIdeas(first.plan.ideas || []);
          setGuests(first.plan.guests || []);
          setVendorChecklists(first.plan.vendorChecklists || []);
          setSmartTips(first.plan.smartTips || []);
          setSummary(first.plan.summary || '');
          setCurrency(first.event.currency || currentUser.preferredCurrency || '₹');
        } else {
          setUserStores([]);
          setActiveEventId(null);
          setActiveEvent(null);
        }
      } else {
        // Clean slate for new user: completely empty
        setUserStores([]);
        setActiveEventId(null);
        setActiveEvent(null);
        setBudgetItems([]);
        setTimelineTasks([]);
        setVendors([]);
        setIdeas([]);
        setGuests([]);
        setVendorChecklists([]);
        setSmartTips([]);
        setSummary('');
      }
    } catch (e) {
      console.warn('Local cache read error', e);
      setUserStores([]);
      setActiveEventId(null);
      setActiveEvent(null);
    }

    // Only subscribe to permanent cloud Firestore when Firebase Auth session is active & matches current user
    if (!firebaseUser || firebaseUser.uid !== currentUser.id) {
      return;
    }

    let unsubscribeFirestore: (() => void) | null = null;
    try {
      unsubscribeFirestore = subscribeUserEvents(
        currentUser.id,
        (cloudEvents) => {
          if (cloudEvents && cloudEvents.length > 0) {
            setUserStores(cloudEvents);
            // Cache to local storage
            try {
              const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
              localStorage.setItem(key, JSON.stringify(cloudEvents));
            } catch (err) {
              console.warn('Could not cache cloud events', err);
            }

            // If no active event or active event was updated, sync it
            setActiveEventId((currentActiveId) => {
              const target = cloudEvents.find((e) => e.event.id === currentActiveId) || cloudEvents[0];
              if (target) {
                setActiveEvent(target.event);
                setBudgetItems(target.plan.budgetItems || []);
                setTimelineTasks(target.plan.timelineTasks || []);
                setVendors(target.plan.vendors || []);
                setIdeas(target.plan.ideas || []);
                setGuests(target.plan.guests || []);
                setVendorChecklists(target.plan.vendorChecklists || []);
                setSmartTips(target.plan.smartTips || []);
                setSummary(target.plan.summary || '');
                setCurrency(target.event.currency || currentUser.preferredCurrency || '₹');
                return target.event.id;
              }
              return currentActiveId;
            });
          } else {
            // New user or user with 0 events: guaranteed clean slate with no phantom events
            setUserStores([]);
            setActiveEventId(null);
            setActiveEvent(null);
            setBudgetItems([]);
            setTimelineTasks([]);
            setVendors([]);
            setIdeas([]);
            setGuests([]);
            setVendorChecklists([]);
            setSmartTips([]);
            setSummary('');
            try {
              const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
              localStorage.removeItem(key);
            } catch (err) {
              console.warn('Could not clear local cache', err);
            }
          }
        },
        (err) => {
          console.warn('Firestore subscription fallback to local cache', err);
        }
      );
    } catch (e) {
      console.warn('Could not establish Firestore subscription', e);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [currentUser, firebaseUser]);

  // Sync active event changes back to userStores, localStorage, and Firestore cloud
  useEffect(() => {
    if (!currentUser || !activeEvent) return;

    // Ensure event has a unique entry code
    const ensuredEntryCode = activeEvent.entryCode || generateUniqueCode(activeEvent.eventType.slice(0, 3));
    const eventWithCode = activeEvent.entryCode === ensuredEntryCode ? activeEvent : { ...activeEvent, entryCode: ensuredEntryCode };

    const currentPlan: CompletePlan = {
      summary,
      budgetItems,
      timelineTasks,
      vendorChecklists,
      ideas,
      smartTips,
      vendors,
      guests,
    };

    setUserStores((prev) => {
      const updated = prev.map((store) => {
        if (store.event.id === eventWithCode.id) {
          return {
            event: { ...eventWithCode, currency },
            plan: currentPlan,
          };
        }
        return store;
      });

      try {
        const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save user events', e);
      }

      return updated;
    });

    // Cloud Firestore synchronization (debounced, only if authenticated as owner)
    const timer = setTimeout(() => {
      if (auth.currentUser && auth.currentUser.uid === currentUser.id) {
        saveEventToFirestore(
          { ...eventWithCode, currency },
          currentPlan,
          currentUser.id
        ).catch((err) => {
          console.warn('Background Firestore sync', err);
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentUser, activeEvent, budgetItems, timelineTasks, vendors, ideas, guests, vendorChecklists, smartTips, summary, currency]);

  // Handle Login
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrency(user.preferredCurrency || '₹');
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not persist user session', e);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign-out exception', e);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    setUserStores([]);
    setActiveEvent(null);
    setActiveEventId(null);
    setBudgetItems([]);
    setTimelineTasks([]);
    setVendors([]);
    setIdeas([]);
    setGuests([]);
    setVendorChecklists([]);
    setSmartTips([]);
    setSummary('');
    try {
      localStorage.removeItem(USER_SESSION_KEY);
    } catch (e) {
      console.warn('Could not remove user session', e);
    }
  };

  // Switch between celebrations
  const handleSelectEvent = (eventId: string) => {
    const selected = userStores.find((s) => s.event.id === eventId);
    if (!selected) return;

    setActiveEventId(selected.event.id);
    setActiveEvent(selected.event);
    setBudgetItems(selected.plan.budgetItems || []);
    setTimelineTasks(selected.plan.timelineTasks || []);
    setVendors(selected.plan.vendors || []);
    setIdeas(selected.plan.ideas || []);
    setGuests(selected.plan.guests || []);
    setVendorChecklists(selected.plan.vendorChecklists || []);
    setSmartTips(selected.plan.smartTips || []);
    setSummary(selected.plan.summary || '');
    setCurrency(selected.event.currency || '₹');

    setChatMessages([
      {
        id: `switch-${Date.now()}`,
        sender: 'assistant',
        content: `Switched to **${selected.event.title}**! You have **${selected.plan.budgetItems?.length || 0} budget items** and **${selected.plan.timelineTasks?.length || 0} timeline tasks** loaded. How can I assist?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Delete an event
  const handleDeleteEvent = (eventId: string) => {
    if (!currentUser) return;
    const remaining = userStores.filter((s) => s.event.id !== eventId);
    setUserStores(remaining);
    try {
      const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Could not update events after delete', e);
    }

    // Delete from Firestore Cloud Database
    deleteEventFromFirestore(eventId).catch((err) => {
      console.warn('Could not delete event from Firestore', err);
    });

    if (remaining.length > 0) {
      handleSelectEvent(remaining[0].event.id);
    } else {
      setActiveEvent(null);
      setActiveEventId(null);
    }
  };

  // Save newly generated plan
  const handlePlanGenerated = (newEvent: EventProfile, newPlan: CompletePlan) => {
    if (!currentUser) return;

    // Ensure unique entry code is assigned
    const entryCode = newEvent.entryCode || generateUniqueCode(newEvent.eventType.slice(0, 3));
    const eventWithCode: EventProfile = {
      ...newEvent,
      entryCode,
      ownerId: currentUser.id,
    };

    const newStore: UserEventStore = {
      event: eventWithCode,
      plan: newPlan,
    };

    const updated = [newStore, ...userStores];
    setUserStores(updated);
    setActiveEventId(eventWithCode.id);
    setActiveEvent(eventWithCode);
    setBudgetItems(newPlan.budgetItems);
    setTimelineTasks(newPlan.timelineTasks);
    setVendors(newPlan.vendors);
    setIdeas(newPlan.ideas);
    setGuests(newPlan.guests);
    setVendorChecklists(newPlan.vendorChecklists);
    setSmartTips(newPlan.smartTips);
    setSummary(newPlan.summary);
    setCurrency(eventWithCode.currency);

    try {
      const key = `${USER_EVENTS_PREFIX}${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist new plan', e);
    }

    // Persist immediately to Firebase Firestore
    saveEventToFirestore(eventWithCode, newPlan, currentUser.id).catch((err) => {
      console.warn('Could not persist to Firestore cloud', err);
    });

    setChatMessages([
      {
        id: `gen-${Date.now()}`,
        sender: 'assistant',
        content: `🎉 Your master plan for **${newEvent.title}** has been generated! I've populated your budget, backward countdown schedule, vendor questions, and theme ideas. Ask me anytime to adjust numbers or add tasks!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Trigger elaborate, persistent fireworks & multi-cannon celebration
    triggerGrandCelebration(newEvent.title);

    setCelebrationNotification({
      title: '🎉 Celebration Blueprint Mastered!',
      subtitle: `Congratulations, ${currentUser.name}! Your master plan for "${newEvent.title}" has been successfully created.`,
      icon: '🍾',
    });
    setTimeout(() => {
      setCelebrationNotification(null);
    }, 6500);
  };

  // Natural Language Prompt Generation from Launchpad
  const handleQuickGeneratePrompt = async (promptText: string) => {
    if (!currentUser) return;
    setIsGeneratingPrompt(true);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${currentUser.name}'s Celebration`,
          eventType: 'Celebration',
          currency,
          notes: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Plan generation failed');
      }

      const resData = await response.json();
      const planData = resData.data;

      const newEvent: EventProfile = {
        id: `event-${Date.now()}`,
        title: `${currentUser.name}'s Celebration`,
        eventType: 'Celebration',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Celebration Venue',
        guestCount: 100,
        totalBudget: currency === '₹' ? 500000 : 15000,
        currency,
        theme: 'Joyful & Elegant Celebration',
        culturalPreferences: 'Festive & Inclusive',
        dietaryNeeds: 'Standard & Vegetarian selections',
        notes: promptText,
        ownerName: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      const completePlan: CompletePlan = {
        summary: planData.summary || `Personalized event plan created for ${currentUser.name}.`,
        budgetItems: planData.budgetItems || [],
        timelineTasks: planData.timelineTasks || [],
        vendorChecklists: planData.vendorChecklists || [],
        ideas: planData.ideas || [],
        smartTips: planData.smartTips || [],
        vendors: [],
        guests: [],
      };

      handlePlanGenerated(newEvent, completePlan);
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Quick generate prompt error:', err);
      // Fallback: open wizard with prompt in notes
      setIntakePreset({ notes: promptText });
      setIsIntakeModalOpen(true);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Major milestone task completion handler
  const handleMilestoneComplete = (task: TimelineTask) => {
    triggerMilestoneCelebration();
    setCelebrationNotification({
      title: '🏆 Major Milestone Conquered!',
      subtitle: `Outstanding progress! "${task.title}" (${task.category}) is now officially completed.`,
      icon: '✨',
    });
    setTimeout(() => {
      setCelebrationNotification(null);
    }, 5500);
  };

  // Save edited active event
  const handleSaveEditedEvent = (updated: EventProfile) => {
    setActiveEvent(updated);
    setCurrency(updated.currency);
    // Re-scale budget percentages if budget changed
    if (updated.totalBudget > 0) {
      setBudgetItems((prev) =>
        prev.map((item) => ({
          ...item,
          percentage: Number(((item.estimated / updated.totalBudget) * 100).toFixed(1)),
        }))
      );
    }
  };

  // Convert an idea to a budget item
  const handleSaveIdeaToBudget = (idea: IdeaItem) => {
    if (!activeEvent) return;
    const total = activeEvent.totalBudget || 10000;
    const multiplier = idea.costRating === '$$$' ? 0.08 : idea.costRating === '$$' ? 0.04 : 0.02;
    const estimated = Math.max(Math.round(total * multiplier), 100);
    const categoryMap: Record<string, string> = {
      menu: 'Catering',
      decor: 'Decor & Florals',
      entertainment: 'Entertainment',
      favors: 'Invitations & Favors',
      theme: 'Decor & Florals',
      hacks: 'General',
    };

    const newBudgetItem: BudgetItem = {
      id: `budget-from-idea-${Date.now()}`,
      name: idea.title,
      category: categoryMap[idea.kind] || 'General',
      estimated,
      actual: 0,
      paid: 0,
      percentage: Number(((estimated / total) * 100).toFixed(1)),
      notes: `Added from Idea: ${idea.description}`,
      priority: 'medium',
    };

    setBudgetItems((prev) => [...prev, newBudgetItem]);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Co-pilot Chat Patch Handler
  const handleApplyPatch = (patch: { action: string; payload: any }) => {
    const { action, payload } = patch;
    if (!payload || !activeEvent) return;

    if (action === 'add_budget_item') {
      const newItem: BudgetItem = {
        id: `item-${Date.now()}`,
        category: payload.category || 'General',
        name: payload.name || 'New Budget Item',
        estimated: Number(payload.estimated) || 500,
        actual: 0,
        paid: 0,
        percentage: Number(((Number(payload.estimated || 500) / (activeEvent.totalBudget || 1)) * 100).toFixed(1)),
        notes: payload.notes || 'Added via AI Co-Pilot',
        priority: payload.priority || 'medium',
      };
      setBudgetItems((prev) => [...prev, newItem]);
    } else if (action === 'update_budget_item') {
      setBudgetItems((prev) =>
        prev.map((item) => {
          if (item.id === payload.id || item.name.toLowerCase() === payload.name?.toLowerCase()) {
            return { ...item, ...payload };
          }
          return item;
        })
      );
    } else if (action === 'delete_budget_item') {
      setBudgetItems((prev) =>
        prev.filter((item) => item.id !== payload.id && item.name.toLowerCase() !== payload.name?.toLowerCase())
      );
    } else if (action === 'add_task') {
      const newTask: TimelineTask = {
        id: `task-${Date.now()}`,
        title: payload.title || 'New Milestone',
        description: payload.description || '',
        category: payload.category || 'Planning',
        dueDate: payload.dueDate || activeEvent.date,
        priority: payload.priority || 'medium',
        status: 'todo',
        assignee: payload.assignee || currentUser?.name || 'Lead Host',
        completed: false,
      };
      setTimelineTasks((prev) => [...prev, newTask]);
    } else if (action === 'add_idea') {
      const newIdea: IdeaItem = {
        id: `idea-${Date.now()}`,
        title: payload.title || 'New Idea',
        kind: payload.kind || 'theme',
        description: payload.description || '',
        vibe: payload.vibe || 'Creative',
        costRating: payload.costRating || '$$',
        palette: payload.palette,
        saved: true,
      };
      setIdeas((prev) => [newIdea, ...prev]);
    } else if (action === 'add_vendor') {
      const newVendor: VendorRecord = {
        id: `v-${Date.now()}`,
        name: payload.name || 'New Vendor',
        category: payload.category || 'General',
        status: payload.status || 'shortlisted',
        quoteAmount: Number(payload.quoteAmount) || 0,
        advancePaid: 0,
        notes: payload.notes || '',
      };
      setVendors((prev) => [...prev, newVendor]);
    } else if (action === 'update_event_details') {
      const updated: EventProfile = { ...activeEvent, ...payload };
      handleSaveEditedEvent(updated);
    }
  };

  // Direct ask from any tab to Copilot
  const handleAskCopilot = (prompt: string) => {
    setIsCopilotOpen(true);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...chatMessages, userMsg],
        currentEvent: activeEvent,
        currentPlan: { budgetItems, timelineTasks, vendors },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            content: data.reply || 'Here is my planning guidance!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patch: data.patch,
          },
        ]);
      })
      .catch((err) => {
        console.error('Co-pilot direct ask failed:', err);
      });
  };

  // Convert an idea to a task
  const handleSaveIdeaToPlan = (idea: IdeaItem) => {
    if (!activeEvent) return;
    const correspondingTask: TimelineTask = {
      id: `task-from-idea-${idea.id}`,
      title: `Plan & Coordinate: ${idea.title}`,
      description: idea.description,
      category: idea.kind === 'menu' ? 'Catering' : idea.kind === 'entertainment' ? 'Program' : 'Decor',
      dueDate: activeEvent.date,
      priority: 'medium',
      status: 'todo',
      assignee: currentUser?.name || 'Lead Host',
      completed: false,
    };
    setTimelineTasks((prev) => {
      if (prev.some((t) => t.id === correspondingTask.id)) return prev;
      return [...prev, correspondingTask];
    });
  };

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (activeEvent) {
      setActiveEvent((prev) => (prev ? { ...prev, currency: newCurr } : null));
    }
  };

  // REQUIREMENT 1: User MUST log in to access the features
  if (!currentUser) {
    return (
      <>
        <AuthScreen 
          onLogin={handleLogin} 
          onOpenCodeModal={() => setIsEnterCodeModalOpen(true)}
        />
        <EnterCodeModal
          isOpen={isEnterCodeModalOpen}
          onClose={() => setIsEnterCodeModalOpen(false)}
          onSubmitCode={(code) => {
            setIsEnterCodeModalOpen(false);
            setActiveGuestPassCode(code);
          }}
        />
        <GuestPassModal
          isOpen={!!activeGuestPassCode}
          onClose={() => setActiveGuestPassCode(null)}
          code={activeGuestPassCode || ''}
          activeEvent={null}
          activePlan={null}
        />
      </>
    );
  }

  // Active complete plan object for modals
  const completePlan: CompletePlan = {
    summary,
    budgetItems,
    timelineTasks,
    vendorChecklists,
    ideas,
    smartTips,
    vendors,
    guests,
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-stone-900 flex flex-col font-sans">
      
      {/* Header with Festival Fonts & Celebration Styling */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        event={activeEvent}
        userEvents={userStores.map((s) => s.event)}
        onSelectEvent={handleSelectEvent}
        onDeleteEvent={handleDeleteEvent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIntake={() => {
          setIntakePreset(null);
          setIsIntakeModalOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenCodeModal={() => setIsEnterCodeModalOpen(true)}
        isCopilotOpen={isCopilotOpen}
        setIsCopilotOpen={setIsCopilotOpen}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Persistent Milestone & Event Creation Celebration Toast Banner */}
        {celebrationNotification && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-xl shadow-orange-500/20 border-2 border-amber-300 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl p-2 rounded-2xl bg-white/20 backdrop-blur-md shadow-xs shrink-0">
                {celebrationNotification.icon || '🎉'}
              </span>
              <div>
                <h4 className="font-display font-extrabold text-base sm:text-lg tracking-tight">
                  {celebrationNotification.title}
                </h4>
                <p className="font-serif-festive italic text-xs sm:text-sm text-amber-100 mt-0.5">
                  {celebrationNotification.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationNotification(null)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss celebration message"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* REQUIREMENT 2: NO PRE-DEFINED DATA */}
        {/* If the user has not created any events yet, show the celebratory Launchpad */}
        {!activeEvent ? (
          <CelebrationLaunchpad
            user={currentUser}
            currency={currency}
            onOpenIntake={(preset) => {
              setIntakePreset(preset || null);
              setIsIntakeModalOpen(true);
            }}
            onQuickGeneratePrompt={handleQuickGeneratePrompt}
            isGeneratingPrompt={isGeneratingPrompt}
          />
        ) : (
          /* User has an active celebration workspace */
          <>
            {/* Executive Vision & Tips Banner */}
            <div className="bg-white rounded-3xl border border-amber-200/90 p-5 shadow-xs mb-6 relative overflow-hidden festive-card-glow">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-display uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-xs">
                      Celebration Vision
                    </span>
                    <span className="text-xs text-amber-900 font-bold font-serif-festive">
                      {activeEvent.theme || 'Celebratory'}
                    </span>
                  </div>
                  <p className="font-serif-festive text-stone-800 leading-relaxed text-sm sm:text-base font-medium">
                    {summary || `Custom celebration blueprint for ${activeEvent.title}.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs font-bold bg-white hover:bg-amber-50 text-stone-800 border border-amber-300 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Edit celebration date, target budget, or headcount"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskCopilot(`How can we make "${activeEvent.title}" extra memorable for our ${activeEvent.guestCount} guests within ${currency}${activeEvent.totalBudget}?`)}
                    className="text-xs font-bold bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ask Co-Pilot</span>
                  </button>
                </div>
              </div>

              {smartTips && smartTips.length > 0 && (
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-start gap-2 text-xs text-stone-600">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-amber-950">Planner Insight: </span>
                    <span className="text-stone-700">{smartTips[0]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Workspace Modules */}
            {activeTab === 'budget' && (
              <BudgetPlanner
                event={activeEvent}
                budgetItems={budgetItems}
                setBudgetItems={setBudgetItems}
                currency={currency}
                onAskCopilot={handleAskCopilot}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePlanner
                event={activeEvent}
                tasks={timelineTasks}
                setTasks={setTimelineTasks}
                onMilestoneComplete={handleMilestoneComplete}
                onAskCopilot={handleAskCopilot}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorHub
                event={activeEvent}
                vendors={vendors}
                setVendors={setVendors}
                categoryGuides={vendorChecklists}
                currency={currency}
                onAskCopilot={handleAskCopilot}
              />
            )}

            {activeTab === 'ideas' && (
              <IdeasEngine
                event={activeEvent}
                ideas={ideas}
                setIdeas={setIdeas}
                onSaveToPlan={handleSaveIdeaToPlan}
                onAddIdeaToBudget={handleSaveIdeaToBudget}
                onAskCopilot={handleAskCopilot}
              />
            )}

            {activeTab === 'guests' && (
              <GuestTracker
                event={activeEvent}
                guests={guests}
                setGuests={setGuests}
                onAskCopilot={handleAskCopilot}
              />
            )}

            {activeTab === 'invitations' && (
              <InvitationHub
                event={activeEvent}
                setEvent={setActiveEvent}
                plan={completePlan}
                guests={guests}
                setGuests={setGuests}
                userId={currentUser?.id}
                onPreviewGuestPass={(passCode) => setActiveGuestPassCode(passCode)}
              />
            )}
          </>
        )}

      </main>

      {/* Floating Co-pilot Launcher Button (When active event & closed) */}
      {activeEvent && !isCopilotOpen && (
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-stone-900 hover:bg-stone-800 text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-amber-400/40 hover:scale-105 transition-all group"
          title="Open AI Event Planning Co-pilot"
        >
          <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-stone-900 shadow-xs">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold pr-1 tracking-tight">AI Co-pilot</span>
        </button>
      )}

      {/* Co-Pilot Drawer */}
      {activeEvent && (
        <CopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          event={activeEvent}
          plan={completePlan}
          messages={chatMessages}
          setMessages={setChatMessages}
          onApplyPatch={handleApplyPatch}
        />
      )}

      {/* Intake Modal (New Plan Wizard) */}
      <IntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onPlanGenerated={handlePlanGenerated}
        currency={currency}
        initialPreset={intakePreset}
      />

      {/* Export & Share Modal */}
      {activeEvent && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          event={activeEvent}
          plan={completePlan}
          currency={currency}
        />
      )}

      {/* Edit Event Parameters Modal */}
      {activeEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={activeEvent}
          onSave={handleSaveEditedEvent}
        />
      )}

      {/* Enter Unique Code / Guest Access Modal */}
      <EnterCodeModal
        isOpen={isEnterCodeModalOpen}
        onClose={() => setIsEnterCodeModalOpen(false)}
        onSubmitCode={(code) => {
          setIsEnterCodeModalOpen(false);
          setActiveGuestPassCode(code);
        }}
      />

      {/* Guest Digital Invitation & Entry Pass Modal */}
      <GuestPassModal
        isOpen={!!activeGuestPassCode}
        onClose={() => setActiveGuestPassCode(null)}
        code={activeGuestPassCode || ''}
        activeEvent={activeEvent}
        activePlan={completePlan}
        onRsvpSuccess={(updatedGuest) => {
          if (updatedGuest.name) {
            setGuests((prev) => {
              const match = prev.find((g) => g.name.toLowerCase() === updatedGuest.name?.toLowerCase());
              if (match) {
                return prev.map((g) =>
                  g.id === match.id
                    ? {
                        ...g,
                        rsvpStatus: updatedGuest.rsvpStatus || g.rsvpStatus,
                        partySize: updatedGuest.partySize || g.partySize,
                        dietary: updatedGuest.dietary || g.dietary,
                      }
                    : g
                );
              }
              return prev;
            });
          }
        }}
      />

      {/* Festive Footer */}
      <footer className="mt-auto border-t border-amber-200/60 bg-[#FFFDF9] py-4 text-center text-xs text-amber-900/60 font-serif-festive">
        <p className="flex items-center justify-center gap-2">
          <img src="/assets/aistudio/image_dc559869.png" alt="Aayojan" className="w-4 h-4 object-contain inline-block" />
          <span>Aayojan — Powered by Google Gemini 3.8 Flash • Designed for Weddings, Milestones &amp; Grand Celebrations</span>
        </p>
      </footer>

    </div>
  );
}
