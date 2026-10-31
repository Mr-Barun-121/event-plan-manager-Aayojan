import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import type { EventProfile, CompletePlan, UserAccount, InvitationRecord } from '../types.ts';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const viteEnv = ((import.meta as unknown) as { env?: Record<string, string> }).env || {};

const resolvedConfig = {
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'YOUR_FIREBASE_PROJECT_ID',
  appId: viteEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId || 'YOUR_FIREBASE_APP_ID',
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || 'YOUR_FIREBASE_API_KEY',
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || 'YOUR_FIREBASE_PROJECT_ID.firebaseapp.com',
  firestoreDatabaseId: viteEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)',
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || 'YOUR_FIREBASE_PROJECT_ID.firebasestorage.app',
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '',
  measurementId: viteEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId || '',
  oAuthClientId: viteEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfig.oAuthClientId || '',
  recaptchaSiteKey: viteEnv.VITE_FIREBASE_RECAPTCHA_SITE_KEY || firebaseConfig.recaptchaSiteKey || '',
};

export const isFirebaseConfigured = Boolean(
  resolvedConfig.apiKey &&
  !resolvedConfig.apiKey.includes('YOUR_') &&
  resolvedConfig.projectId &&
  !resolvedConfig.projectId.includes('YOUR_')
);

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);

export const db = resolvedConfig.firestoreDatabaseId && resolvedConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test as required by skill
export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited.');
    }
    return false;
  }
}

// Generate human-friendly unique entry code (e.g., WED-8429, EVT-9K3L)
export function generateUniqueCode(prefix: string = 'EVT'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefix = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 3) || 'EVT';
  return `${cleanPrefix}-${rand}`;
}

// ---------------- USER CREDENTIALS & PROFILE ----------------
export async function saveUserProfile(user: UserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        id: user.id,
        name: user.name,
        email: user.email,
        preferredCurrency: user.preferredCurrency || '₹',
        avatarColor: user.avatarColor || 'indigo',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(userId: string): Promise<UserAccount | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ---------------- EVENT DETAILS PERSISTENCE ----------------
export async function saveEventToFirestore(
  event: EventProfile,
  plan: CompletePlan,
  userId: string
): Promise<void> {
  const path = `events/${event.id}`;
  const code = event.entryCode || generateUniqueCode(event.eventType.slice(0, 3));
  const eventDocData = {
    ...event,
    entryCode: code,
    ownerId: userId,
    plan,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'events', event.id), eventDocData, { merge: true });

    // Store public entry access record in invitations collection for guest passes & QR codes
    const masterPass: InvitationRecord = {
      id: `master_${event.id}`,
      eventId: event.id,
      entryCode: code,
      guestName: `${event.title} Entry Pass`,
      partySize: 1,
      rsvpStatus: 'attending',
      checkedIn: false,
      notes: `Master entrance access for ${event.title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'invitations', masterPass.id), masterPass, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEventFromFirestore(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
    try {
      await deleteDoc(doc(db, 'invitations', `master_${eventId}`));
    } catch {
      // Best-effort cleanup
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserEvents(
  userId: string,
  onUpdate: (events: { event: EventProfile; plan: CompletePlan }[]) => void,
  onError?: (err: any) => void
) {
  const path = 'events';

  // Guard: If the client is not authenticated with Firebase Auth or UID mismatch, avoid firing an unauthorized query
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    const warning = `Firestore subscription postponed: auth.currentUser (${auth.currentUser?.uid || 'none'}) is not signed in as ${userId}.`;
    console.info(warning);
    if (onError) onError(new Error(warning));
    return () => {};
  }

  const q = query(collection(db, 'events'), where('ownerId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const results: { event: EventProfile; plan: CompletePlan }[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const plan = data.plan || {
          summary: '',
          budgetItems: [],
          timelineTasks: [],
          vendorChecklists: [],
          ideas: [],
          smartTips: [],
          vendors: [],
          guests: [],
        };
        const { plan: _omitPlan, ...eventProfile } = data;
        results.push({
          event: eventProfile as EventProfile,
          plan: plan as CompletePlan,
        });
      });
      onUpdate(results);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getEventByEntryCode(
  entryCode: string
): Promise<{ event: EventProfile; plan: CompletePlan } | null> {
  const cleanCode = entryCode.trim().toUpperCase();
  const path = 'events';
  try {
    // 1. Check invitations collection first since invitations has public read access
    const invQuery = query(collection(db, 'invitations'), where('entryCode', '==', cleanCode));
    const invSnap = await getDocs(invQuery);
    if (!invSnap.empty) {
      const invData = invSnap.docs[0].data() as InvitationRecord;
      const eventDoc = await getDoc(doc(db, 'events', invData.eventId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const plan = data.plan || {
          summary: '',
          budgetItems: [],
          timelineTasks: [],
          vendorChecklists: [],
          ideas: [],
          smartTips: [],
          vendors: [],
          guests: [],
        };
        const { plan: _omitPlan, ...eventProfile } = data;
        return {
          event: eventProfile as EventProfile,
          plan: plan as CompletePlan,
        };
      }
    }

    // 2. If authenticated as an owner, query own events
    if (auth.currentUser) {
      const q = query(
        collection(db, 'events'),
        where('ownerId', '==', auth.currentUser.uid),
        where('entryCode', '==', cleanCode)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        const plan = data.plan || {
          summary: '',
          budgetItems: [],
          timelineTasks: [],
          vendorChecklists: [],
          ideas: [],
          smartTips: [],
          vendors: [],
          guests: [],
        };
        const { plan: _omitPlan, ...eventProfile } = data;
        return {
          event: eventProfile as EventProfile,
          plan: plan as CompletePlan,
        };
      }
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ---------------- INVITATIONS & UNIQUE ENTRY ACCESS ----------------
export async function saveInvitationToFirestore(invitation: InvitationRecord): Promise<void> {
  const path = `invitations/${invitation.id}`;
  try {
    await setDoc(doc(db, 'invitations', invitation.id), invitation, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeEventInvitations(
  eventId: string,
  onUpdate: (invitations: InvitationRecord[]) => void,
  onError?: (err: any) => void
) {
  const path = 'invitations';
  const q = query(collection(db, 'invitations'), where('eventId', '==', eventId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: InvitationRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as InvitationRecord);
      });
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function lookupInvitationOrEventByCode(
  code: string
): Promise<{
  invitation: InvitationRecord | null;
  event: EventProfile | null;
  plan: CompletePlan | null;
}> {
  const cleanCode = code.trim().toUpperCase();
  const path = 'invitations';
  try {
    // 1. Look for matching guest invitation code
    const invQuery = query(collection(db, 'invitations'), where('entryCode', '==', cleanCode));
    const invSnap = await getDocs(invQuery);

    if (!invSnap.empty) {
      const invitation = invSnap.docs[0].data() as InvitationRecord;
      // Fetch associated event
      const eventDoc = await getDoc(doc(db, 'events', invitation.eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const plan = eventData.plan || null;
        const { plan: _omitPlan, ...eventProfile } = eventData;
        return {
          invitation,
          event: eventProfile as EventProfile,
          plan: plan as CompletePlan,
        };
      }
      return { invitation, event: null, plan: null };
    }

    // 2. Look for matching event master entry code
    const eventResult = await getEventByEntryCode(cleanCode);
    if (eventResult) {
      return {
        invitation: null,
        event: eventResult.event,
        plan: eventResult.plan,
      };
    }

    return { invitation: null, event: null, plan: null };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateGuestRsvp(
  invitationId: string,
  data: {
    rsvpStatus: 'attending' | 'declined';
    partySize?: number;
    dietary?: string;
    notes?: string;
  }
): Promise<void> {
  const path = `invitations/${invitationId}`;
  try {
    await updateDoc(doc(db, 'invitations', invitationId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkInGuestByCode(
  code: string,
  targetEventId?: string
): Promise<{
  success: boolean;
  message: string;
  alreadyCheckedIn?: boolean;
  checkedInAt?: string;
  invitation?: InvitationRecord;
}> {
  const cleanCode = code.trim().toUpperCase();
  const path = 'invitations';
  try {
    const q = query(collection(db, 'invitations'), where('entryCode', '==', cleanCode));
    const snap = await getDocs(q);

    if (snap.empty) {
      return {
        success: false,
        message: `No entry pass found with code "${cleanCode}". Please check and try again.`,
      };
    }

    const docRef = snap.docs[0].ref;
    const inv = snap.docs[0].data() as InvitationRecord;

    if (targetEventId && inv.eventId !== targetEventId) {
      return {
        success: false,
        message: 'This entry code belongs to a different celebration.',
      };
    }

    if (inv.checkedIn) {
      return {
        success: false,
        alreadyCheckedIn: true,
        checkedInAt: inv.checkedInAt || undefined,
        invitation: inv,
        message: `Already checked in at ${inv.checkedInAt ? new Date(inv.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'door'}. Duplicate entry rejected!`,
      };
    }

    const now = new Date().toISOString();
    await updateDoc(docRef, {
      checkedIn: true,
      checkedInAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Verified! Welcome ${inv.guestName} (Party of ${inv.partySize || 1})${inv.tableOrGroup ? ` - Table: ${inv.tableOrGroup}` : ''}. Admitted to event.`,
      checkedInAt: now,
      invitation: { ...inv, checkedIn: true, checkedInAt: now },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
