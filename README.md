# Aayojan (EventGenie) — GenAI Event Planning Assistant

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.3.3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-16%20Passing-10B981)](#-testing)

> **Problem Statement Alignment:**  
> *"Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."*

**Aayojan (आयोजन)** is a production-grade, AI-driven event planning workspace engineered to orchestrate **Weddings**, **Milestone Birthdays**, and **Community Festivals & Galas** with mathematical financial guardrails, automated backward countdown timeline milestones, vendor scrutiny checklists, digital admission entry passes, and creative concept engines powered by **Google Gemini 3.8 Flash**.

---

## 📋 Table of Contents
1. [Key Capabilities & Feature Modules](#-key-capabilities--feature-modules)
2. [Environment Variables & Configuration Guide](#-environment-variables--configuration-guide)
3. [User Guide: How to Use the Website Properly](#-user-guide-how-to-use-the-website-properly)
4. [Architecture & Technology Stack](#-architecture--technology-stack)
5. [Security & Protection Guardrails](#-security--protection-guardrails)
6. [Accessibility (A11y) Conformance](#-accessibility-a11y-conformance)
7. [Installation & Local Setup](#-installation--local-setup)
8. [Testing](#-testing)

---

## 🌟 Key Capabilities & Feature Modules

### 1. 🤖 GenAI Planning Co-Pilot
- **Fast Multimodal Generation:** Leverages `@google/genai` with `gemini-3.8-flash` for low-latency (<2s) plan generation and conversational co-planning.
- **Bi-directional Patching:** The chat drawer interprets conversational commands (e.g., *"Add a photo booth for $600"* or *"Cut $1,000 from floral and give to entertainment"*) and generates structured `eventgenie_patch` payloads that apply directly to the active plan.
- **Resilient Fallbacks:** Deterministic fallback engines (`createIntelligentFallbackPlan` & `generateSmartChatFallback`) ensure uninterrupted operation if API keys or quotas are limited.

### 2. 💰 Intelligent Budget Planner & Guardrails
- **10% Smart Contingency Guardrail:** Automatically reserves and recalibrates an untouchable 10% emergency buffer to protect hosts from unexpected vendor fees or guest surges.
- **Interactive SVG Donut & Bar Charts:** Custom trigonometric SVG donut chart with hover slice detection and keyboard accessibility, alongside comparative category bars.
- **Variance Tracking:** Live calculation of Estimated vs. Actual Committed vs. Paid Advances.
- **Multi-Currency:** Native formatting for Indian Rupee (`₹` Lakhs/Crores system: `₹8,00,000`), USD (`$`), Euro (`€`), and British Pound (`£`).
- **Data Export:** Instant itemized spreadsheet download via `.CSV`.

### 3. ⏳ Countdown Timeline & Task Pacing
- **Backwards Milestones:** Tasks are backward-calculated from the event date into concrete calendar due dates.
- **Triple-View Layout:** Switch seamlessly between:
  - **Timeline:** Chronological node view with overdue alerts.
  - **Kanban Board:** 3-column workflow (To Do, In Progress, Done).
  - **Calendar Alignment:** Event countdown positioning.
- **Calendar Synchronization:** One-click `.ICS` file export directly into Google Calendar, Outlook, and Apple Calendar.
- **Milestone Fanfare:** Persistent multi-cannon fireworks and confetti animations upon milestone achievements.

### 4. 🛡️ Vendor Hub & Contract Shield
- **AI Category Guides:** Specialized guidelines for Venues, Catering, Photography, Music/DJ, Decor, and Attire.
- **Checklists & Red Flags:** Crucial questions to ask before signing contracts, non-negotiable clauses (BEO itemization, overtime rates, backup performers), and warning signs to walk away from.
- **Quote Comparison Matrix:** Side-by-side vendor quotes with "AI Rate Check" market comparisons.

### 5. 💡 Inspiration & Idea Engine
- **Categorized Brainstorming:** Curated ideas across Themes & Styling, Menus & Tastings, Entertainment & Games, Favors, and Cost-Saving Hacks.
- **Vibe & Palettes:** Includes cost ratings (`$`, `$$`, `$$$`), vibe tags, and hex color palettes.
- **One-Click Conversion:** Instantly convert any creative idea into an actionable Timeline Task or Budget line item.

### 6. 🎟️ Digital Invitations & Gate Admission Pass
- **Unique Entry Codes:** Generates human-friendly encrypted codes (e.g. `WED-8429`, `EVT-9K3L`) and visual QR pass cards.
- **Door Check-In Verification:** Door check-in gate terminal verifies codes and detects duplicate entries to prevent double admission.
- **Guest Registry & Dietary Manifest:** Aggregates guest headcounts and dietary restrictions (Vegetarian, Vegan, Halal, Kosher, Gluten-Free) for catering orders.

---

## 🔑 Environment Variables & Configuration Guide

All sensitive API keys and connection details are externalized into environment variables and sanitized configuration templates. **No credentials are hardcoded into git.**

### 1. The `.env` Configuration File

Create a `.env` file in the root directory by copying the provided `.env.example`:

```bash
cp .env.example .env
```

Here is a breakdown of every variable and how to configure it:

| Variable | Required? | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Recommended** | `AIzaSy...` | Powers Gemini AI plan generation & the conversational Co-pilot drawer. |
| `PORT` | Optional | `3000` | Port for the backend Express server. |
| `NODE_ENV` | Optional | `development` | Node environment (`development` or `production`). |
| `APP_URL` | Optional | `http://localhost:3000` | Base application URL for invitation links & OAuth callbacks. |
| `VITE_FIREBASE_API_KEY` | Optional | `AIzaSy...` | Firebase Web API key for cloud synchronization. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | `your-app.firebaseapp.com` | Firebase Authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Optional | `your-project-id` | Firebase Project identifier. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Optional | `your-app.firebasestorage.app` | Firebase Storage bucket for event assets. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | `1234567890` | Firebase Cloud Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | Optional | `1:123456:web:abcdef` | Firebase Web App application identifier. |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Optional | `(default)` | Cloud Firestore database ID. |
| `VITE_FIREBASE_OAUTH_CLIENT_ID` | Optional | `123456...apps.googleusercontent.com` | Google Sign-in OAuth client ID. |

---

### 2. How to Obtain a Free Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API Key"** and choose or create a Google Cloud Project.
4. Copy the generated key and paste it into your `.env` file:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeneratedGeminiKeyHere"
   ```
> **Note:** If no key is provided, Aayojan will automatically switch to **Intelligent Offline Fallback Mode**, generating realistic event budgets, timelines, and ideas using built-in deterministic algorithms!

---

### 3. How to Configure Firebase (Optional Cloud Sync)

Aayojan comes with a **Dual-Storage Engine**:
- **Offline / Local Mode (Default):** The application works 100% out of the box using browser `localStorage` without requiring Firebase credentials.
- **Cloud Mode (Optional):** If you want multi-device synchronization and Google Authentication, configure Firebase:

#### Option A: Via Environment Variables (Recommended)
Add your Firebase keys to `.env` (prefixed with `VITE_`):
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="(default)"
```

#### Option B: Via `firebase-applet-config.json`
Edit `firebase-applet-config.json` directly with your project details (a sanitized template is already included).

#### Setting Up Firebase Console:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and follow the prompts.
3. In **Authentication** → **Sign-in method**, enable **Email/Password** and **Google**.
4. In **Firestore Database**, click **Create Database** (start in production mode) and apply `firestore.rules`.
5. In **Project Settings** → **General**, scroll to **Your apps**, click the `</>` (Web) icon, and register the app to view your config parameters.

---

## 📖 User Guide: How to Use the Website Properly

### Step 1: Authentication & Launching Your Workspace
1. When you first open `http://localhost:3000`, you will see the **Aayojan Authentication Screen**.
2. You can access the workspace in 3 different ways:
   - **Google Sign-In:** Click *"Continue with Google"* for seamless single-click cloud login.
   - **Email & Password:** Switch between *"Sign In"* and *"Create Account"*, select your preferred default currency (`₹`, `$`, `€`, or `£`), and register.
   - **Quick Launch (Guest/Demo Mode):** Click **🪔 Host Planner (₹)** or **✨ Guest Planner ($)** to instantly enter the workspace without registering. All data will be saved to your browser's local storage.
3. If you received a guest invitation pass, click **"Have an Invitation Code? Enter Code"** to check in immediately.

---

### Step 2: Creating Your First Celebration Plan
You have three flexible ways to craft a plan:

1. **Natural Language AI Prompt (Fastest):**
   Type your celebration vision into the hero prompt bar:
   > *"A 150-guest Jaipur royal palace wedding in December with ₹10 Lakh budget and Rajasthani live folk music"*
   
   Click **"Craft Master Plan"** — Gemini AI will generate an end-to-end plan within 2 seconds!

2. **Curated Celebration Blueprints:**
   Click any of the pre-configured celebration cards:
   - **Grand Wedding & Sangeet** (150 guests, multi-day ceremonies, mandap decor, catering)
   - **Milestone Birthday Party** (35 guests, themed styling, entertainer, custom bakery cake)
   - **Festival & Community Fair** (300 attendees, permits, sound stage, multicultural food stalls)
   - **Anniversary or Dinner Gala** (80 guests, acoustic strings, wine pairings, plated banquet)

3. **Custom Blank Plan:**
   Click **"Custom Blank Plan"** to open the multi-step intake wizard.

---

### Step 3: Managing the Event Budget
1. Click the **"Budget"** tab in the top navigation.
2. **10% Emergency Contingency:** Aayojan automatically reserves 10% of your total budget.
3. **Visual Donut Breakdown:** Hover over or click slices on the SVG donut chart to inspect spending by category.
4. **Itemized Table:** Click **"+ Add Item"** to insert custom expenses. Mark vendor advances as **"Paid"** with the checkmark.
5. **CSV Export:** Click **"Export CSV"** to download the complete budget spreadsheet.

---

### Step 4: Tracking Timeline & Milestones
1. Click the **"Timeline"** tab.
2. **Switch Views:** Toggle between **Timeline**, **Kanban Board**, and **Calendar Mode**.
3. **Sync with Mobile Calendar:** Click **"Export .ICS"** to download a calendar file that imports into Google Calendar, Apple Calendar, or Outlook.

---

### Step 5: Vetting Vendors & Contracts
1. Click the **"Vendor Hub"** tab.
2. Select a category tab (Venues, Catering, Photography, DJ, Decor) to read **AI Category Vetting Guides**.
3. Review the **"Red Flags"** and **"Must-Have Contract Clauses"** before signing any agreement.

---

### Step 6: Creative Inspiration Engine
1. Click the **"Inspiration"** tab.
2. Filter ideas by Theme, Menu, Entertainment, or Cost-Saving Hacks.
3. Click **"+ Add to Tasks"** or **"+ Add to Budget"** to convert any concept directly into your active checklist or budget!

---

### Step 7: Guest List, RSVPs & Gate Check-In Passes
1. Click the **"Guests"** tab.
2. **Dietary Manifest:** Review the live dietary aggregation counter for accurate catering headcounts.
3. **Digital Entry Passes:** Click **"View Pass"** on any guest to see their unique entry code (e.g. `WED-8429`).
4. **Door Check-In:** On event day, use the **Gate Terminal** to verify codes and block duplicate check-in attempts.

---

### Step 8: Using the AI Co-Pilot Chat
1. Click the **"✨ AI Co-Pilot"** button to open the assistant drawer.
2. Ask any question or command:
   - *"We just got 20 more guests, adjust my catering and cake budgets."*
   - *"What should I ask my wedding photographer before paying the deposit?"*
   - *"Cut ₹50,000 from decor and reallocate it to live music."*
3. The Co-Pilot will respond and optionally provide an **"Apply AI Patch"** button to automatically modify your active plan in real time!

---

## 🏛️ System Architecture

```
├── server.ts                       # Express backend server with rate-limiting, security headers & Gemini API
├── firebase-applet-config.json     # Sanitized Firebase client configuration template
├── firebase-blueprint.json         # Data schemas for UserProfile, Event, and Invitation
├── firestore.rules                 # Cloud Firestore security rules (strict default deny)
├── src/
│   ├── App.tsx                     # Main client workspace coordinator & state engine
│   ├── types.ts                    # Centralized TypeScript domain interfaces
│   ├── components/
│   │   ├── AuthScreen.tsx          # Firebase Auth (Google + Email/Password + Guest Sessions)
│   │   ├── BudgetPlanner.tsx       # Itemized budget table, 10% contingency & SVG donut chart
│   │   ├── TimelinePlanner.tsx     # Timeline, Kanban, Calendar views & ICS export
│   │   ├── VendorHub.tsx           # Vendor quote tracker, contract shield & red flag guides
│   │   ├── IdeasEngine.tsx         # Theme generator, color palettes & idea converter
│   │   ├── GuestTracker.tsx        # Guest headcount, RSVP states & dietary requirement manifest
│   │   ├── InvitationHub.tsx       # Master invitation link, entry passes & live gate check-in
│   │   └── CopilotDrawer.tsx       # Conversational AI assistant with real-time plan patching
│   └── utils/
│       ├── firebase.ts             # Firebase Auth & Firestore client with offline cache sync
│       └── formatters.ts           # Pure currency, date diff, ICS and CSV utilities
```

---

## 🔒 Security & Protection Guardrails

1. **Server-Side API Key Isolation:** `GEMINI_API_KEY` is strictly managed server-side in `server.ts` and never leaked to browser client bundles.
2. **API Rate Limiting:** In-memory sliding-window IP rate limiter caps AI endpoints at 40 requests per 10 minutes per IP.
3. **HTTP Security Headers:** `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
4. **Input Sanitization:** String fields are clamped to prevent prompt injection and memory overload.
5. **Body Payload Limit:** Express body-parser restricted to 1MB.
6. **Firestore Security Rules:** Strict user isolation — event updates restricted to owners; guest updates restricted to RSVP fields only.

---

## ♿ Accessibility (A11y) Conformance

- **Dialogs & Modals:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `Escape` keyboard dismissal.
- **Dynamic Alerts:** `role="alert"` and `aria-live="assertive"` / `aria-live="polite"` for screen-reader announcements.
- **SVG Charts:** `role="img"`, `<title>`, `<desc>`, ARIA labels on slices, full keyboard navigation (`Enter` / `Space`).
- **Focus States:** High-contrast Tailwind focus rings (`focus-visible:ring-2 focus-visible:ring-amber-500`).

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js:** v20.0.0 or higher (Node.js 24 compatible)
- **npm:** v9.0.0 or higher

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/Mr-Barun-121/event-plan-manager-Aayojan.git
cd event-plan-manager-Aayojan

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the development server
npm run dev
# Open http://localhost:3000

# 5. Run tests & type check
npm test
npm run lint
```

---

## 🧪 Testing

```bash
$ npm test

▶ Invitation & Unique Code Entry Validation
  ✔ generateUniqueCode generates formatted uppercase alphanumeric codes with clean prefix
  ✔ generateUniqueCode sanitizes special characters from prefix
  ✔ generates unique codes across successive invocations
  ✔ Check-in duplicate detection logic prevents double admission
  ✔ Party size headcount correctly accumulates admitted attendance
✔ Invitation & Unique Code Entry Validation

▶ Aayojan Core Logic & Formatting Tests
  ✔ formatCurrency correctly formats Indian Rupee (INR) with Lakhs system
  ✔ formatCurrency correctly formats international currencies ($ USD, € EUR, £ GBP)
  ✔ getDaysRemaining returns correct countdown info
  ✔ Budget Invariant: Contingency reservation ensures financial safety
  ✔ Variance Calculation accurately identifies budget deviations
  ✔ AI EventGenie Patch Extraction safely parses structured blocks
  ✔ Backward date offset calculator produces valid ISO dates
  ✔ Birthday Planning Model: Validates kids entertainment and cake ratio allocations
  ✔ Community Festival Planning Model: Logistics, Permits & Volunteer milestones
  ✔ Dietary Aggregation: Correctly computes counts across diverse attendee preferences
  ✔ formatCurrency edge cases: handles 0, negative values, and large numbers cleanly
✔ Aayojan Core Logic & Formatting Tests

ℹ tests 16 | pass 16 | fail 0
```

---

## 📄 License
MIT License. Open-source and ready for celebrations worldwide! 🎉
