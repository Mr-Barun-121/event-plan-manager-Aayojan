import React, { useState } from 'react';
import { UserAccount } from '../types.ts';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Ticket,
  LogIn,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  googleProvider, 
  saveUserProfile 
} from '../utils/firebase.ts';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInAnonymously,
  signOut
} from 'firebase/auth';

interface AuthScreenProps {
  onLogin: (user: UserAccount) => void;
  onOpenCodeModal?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onOpenCodeModal }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-In via Firebase Auth
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const account: UserAccount = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Celebration Host',
        email: fbUser.email || '',
        preferredCurrency: currency,
        avatarColor: '#F59E0B',
      };

      // Save user credentials & profile to Firestore database
      await saveUserProfile(account);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      onLogin(account);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      // If popup blocked or cancelled or configuration error
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else {
        setError(err.message || 'Google sign-in failed. You can also sign in with Email/Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Authentication via Firebase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Create user in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });

        const account: UserAccount = {
          id: cred.user.uid,
          name: name.trim(),
          email: email.trim(),
          preferredCurrency: currency,
          avatarColor: '#F59E0B',
        };

        // Persist profile to Firestore
        await saveUserProfile(account);

        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        onLogin(account);
      } else {
        // Sign in user with Firebase Auth
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const displayName = cred.user.displayName || email.split('@')[0];

        const account: UserAccount = {
          id: cred.user.uid,
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          email: cred.user.email || email.trim(),
          preferredCurrency: currency,
          avatarColor: '#F59E0B',
        };

        // Ensure profile updated in Firestore
        await saveUserProfile(account);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });

        onLogin(account);
      }
    } catch (err: any) {
      console.warn('Firebase Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please switch to Sign In.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again or create an account.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        // Fallback for offline or local preview
        const fallbackName = mode === 'signup' ? name.trim() : email.split('@')[0];
        const fallbackAccount: UserAccount = {
          id: `usr-fb-${Date.now()}`,
          name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
          email: email.trim(),
          preferredCurrency: currency,
          avatarColor: '#F59E0B',
        };
        onLogin(fallbackAccount);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlannerLogin = async (plannerName: string, defaultCurr: string) => {
    setLoading(true);
    try {
      // Sign out any prior anonymous session to prevent inheriting previously created test events
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
      }

      let uid = `usr-guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      try {
        const anon = await signInAnonymously(auth);
        uid = anon.user.uid;
      } catch {
        // Fallback to isolated unique guest session ID
      }

      const account: UserAccount = {
        id: uid,
        name: plannerName,
        email: `${plannerName.toLowerCase().replace(/\s+/g, '')}@planner.com`,
        preferredCurrency: defaultCurr,
        avatarColor: '#D97706',
      };

      try {
        await saveUserProfile(account);
      } catch {
        // Local session OK
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      onLogin(account);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col justify-center relative overflow-hidden px-4 py-10">
      
      {/* Decorative festive ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-linear-to-b from-amber-200/40 via-orange-100/20 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-200/30 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-amber-200/30 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-md w-full mx-auto relative z-10">
        
        {/* Festive Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-2 rounded-3xl bg-white shadow-xl shadow-amber-500/15 border-2 border-amber-200/80 inline-block">
              <img
                src="/assets/aistudio/image_dc559869.png"
                alt="Aayojan Logo"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl"
              />
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Aayojan
          </h1>
          <p className="font-serif-festive italic text-base text-amber-800 font-medium mt-1">
            Events • Celebrations • Weddings
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Cloud Storage & Auth Enabled</span>
          </div>
        </div>

        {/* Guest Code Quick Access Banner */}
        {onOpenCodeModal && (
          <div className="mb-4 bg-linear-to-r from-amber-100/90 to-orange-100/90 border border-amber-300 rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-800 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-amber-950 block">Have an Invitation Code?</span>
                <span className="text-[10px] text-amber-800">Check in or view your invitation</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCodeModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Enter Code
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-amber-200/70 p-6 sm:p-7 shadow-2xl festive-card-glow">
          
          {/* Google One-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 mb-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-xs transition-all hover:border-stone-300 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider relative">
              Or with Email
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-stone-100/80 p-1 rounded-2xl mb-5 border border-stone-200/70">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div 
              role="alert" 
              aria-live="assertive"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma or Marcus Vance"
                    className="w-full text-xs sm:text-sm bg-stone-50/80 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="planner@celebrations.com"
                  className="w-full text-xs sm:text-sm bg-stone-50/80 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs sm:text-sm bg-stone-50/80 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Default Event Currency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: '₹', label: '₹ INR' },
                    { code: '$', label: '$ USD' },
                    { code: '€', label: '€ EUR' },
                    { code: '£', label: '£ GBP' },
                  ].map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrency(curr.code)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        currency === curr.code
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-linear-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 text-white shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Connecting...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Account & Begin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick Demo Options */}
          <div className="mt-5 pt-4 border-t border-stone-100 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-2.5">
              Quick Launch Options
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickPlannerLogin('Celebration Host', '₹')}
                disabled={loading}
                className="flex-1 py-1.5 px-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                🪔 Host Planner (₹)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPlannerLogin('Lead Coordinator', '$')}
                disabled={loading}
                className="flex-1 py-1.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                ✨ Guest Planner ($)
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
