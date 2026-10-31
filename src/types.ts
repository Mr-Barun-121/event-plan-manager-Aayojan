export type EventType =
  | 'Wedding'
  | 'Birthday'
  | 'Anniversary'
  | 'Community Festival'
  | 'Corporate Gala'
  | 'Baby Shower'
  | 'Graduation'
  | 'Dinner Party';

export interface EventProfile {
  id: string;
  title: string;
  eventType: EventType | string;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  theme: string;
  culturalPreferences: string;
  dietaryNeeds: string;
  notes: string;
  ownerName: string;
  ownerId?: string;
  entryCode?: string;
  invitationDetails?: {
    welcomeMessage?: string;
    dressCode?: string;
    venueAddress?: string;
    scheduleHighlights?: string[];
    rsvpDeadline?: string;
    allowPlusOnes?: boolean;
  };
  coPlanners?: string[];
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  estimated: number;
  actual: number;
  paid: number;
  percentage: number;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  daysBeforeEvent?: number;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  assignee: string;
  completed?: boolean;
}

export interface VendorCategoryGuide {
  category: string;
  leadTime: string;
  questionsToAsk: string[];
  redFlags: string[];
  documentsNeeded: string[];
}

export type VendorStatus = 'shortlisted' | 'contacted' | 'booked' | 'paid';

export interface VendorRecord {
  id: string;
  category: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: VendorStatus;
  quoteAmount: number;
  advancePaid: number;
  notes?: string;
  rating?: number;
}

export interface IdeaItem {
  id: string;
  title: string;
  kind: 'theme' | 'decor' | 'menu' | 'entertainment' | 'favors' | 'hacks';
  description: string;
  vibe: string;
  costRating: '$' | '$$' | '$$$';
  palette?: string[];
  saved?: boolean;
}

export interface GuestRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: 'attending' | 'declined' | 'pending';
  partySize: number;
  dietary: 'Standard' | 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Halal' | 'Kosher' | 'Child';
  tableOrGroup?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  patch?: {
    action: string;
    payload: any;
  } | null;
}

export interface CompletePlan {
  summary: string;
  budgetItems: BudgetItem[];
  timelineTasks: TimelineTask[];
  vendorChecklists: VendorCategoryGuide[];
  ideas: IdeaItem[];
  smartTips: string[];
  vendors: VendorRecord[];
  guests: GuestRecord[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  preferredCurrency?: string;
}

export interface UserEventStore {
  event: EventProfile;
  plan: CompletePlan;
}

export interface InvitationRecord {
  id: string;
  eventId: string;
  entryCode: string;
  guestName: string;
  guestEmail?: string;
  partySize: number;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  dietary?: string;
  tableOrGroup?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

