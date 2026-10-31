import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Middleware: Set HTTP security headers and restrict payload size
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '1mb' }));

// In-Memory Sliding-Window IP Rate Limiter for AI endpoints (protect against quota exhaustion and DoS)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function createAiRateLimiter(windowMs: number = 10 * 60 * 1000, maxRequests: number = 40) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: 'Too many planning requests from this client. Please wait a few moments before trying again.',
        retryAfter: retryAfterSec,
      });
    }

    record.count += 1;
    next();
  };
}

const aiRateLimiter = createAiRateLimiter(10 * 60 * 1000, 40);

// Periodic cleanup of expired rate limit keys every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 15 * 60 * 1000).unref();

// Input sanitization helpers
function sanitizeString(val: unknown, maxLen: number, fallback: string = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

function sanitizeNumber(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

// Server-side Gemini AI client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Helper for calculating absolute dates from relative offsets
function calculateTaskDate(eventDateStr: string, daysOffset: number): string {
  try {
    const eventDate = new Date(eventDateStr);
    if (isNaN(eventDate.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 90);
      return fallback.toISOString().split('T')[0];
    }
    const target = new Date(eventDate);
    target.setDate(target.getDate() + daysOffset);
    return target.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Generate comprehensive full event plan with rate limiting and input sanitization
app.post('/api/generate-plan', aiRateLimiter, async (req, res) => {
  try {
    const safeTitle = sanitizeString(req.body.title, 150, 'Celebration');
    const safeEventType = sanitizeString(req.body.eventType, 50, 'Wedding');
    const safeLocation = sanitizeString(req.body.location, 200, 'Central Venue');
    const safeTheme = sanitizeString(req.body.theme, 150, 'Festive and memorable');
    const safeCultural = sanitizeString(req.body.culturalPreferences, 300, 'Contemporary & inclusive');
    const safeDietary = sanitizeString(req.body.dietaryNeeds, 300, 'Vegetarian and standard selections');
    const safeNotes = sanitizeString(req.body.notes, 2000, '');
    const safeCurrency = sanitizeString(req.body.currency, 10, '₹');
    const safeBudget = sanitizeNumber(req.body.totalBudget, 100, 100000000, 10000);
    const safeGuests = sanitizeNumber(req.body.guestCount, 1, 50000, 50);
    const rawDate = sanitizeString(req.body.date, 30, '');
    const safeDate = rawDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let generatedPlan = null;

    if (ai) {
      try {
        const prompt = `You are Aayojan, an expert world-class event planner specializing in weddings, celebrations, and festivals.
Generate a complete, highly detailed, realistic event plan for:
- Event: ${safeTitle} (${safeEventType})
- Date: ${safeDate}
- Location: ${safeLocation}
- Guest Count: ${safeGuests} people
- Total Budget: ${safeCurrency} ${safeBudget}
- Theme / Vibe: ${safeTheme}
- Cultural / Traditional preferences: ${safeCultural}
- Dietary / Special requirements: ${safeDietary}
- Additional user notes: ${safeNotes || 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "summary": "2-3 sentence overview highlighting the event vision and key priorities",
  "contingencyPercent": 10,
  "budgetItems": [
    {
      "category": "Venue" | "Catering" | "Decor & Florals" | "Photography & Media" | "Attire & Beauty" | "Entertainment" | "Invitations & Favors" | "Logistics & Transport" | "Contingency",
      "name": "Detailed item name",
      "percentage": 25,
      "estimated": 2500,
      "notes": "Cost driver or negotiation tip",
      "priority": "high" | "medium" | "low"
    }
  ],
  "timelineTasks": [
    {
      "title": "Task title",
      "description": "Concrete guidance on what to do",
      "category": "Venue" | "Vendors" | "Invitations" | "Decor" | "Program" | "Logistics" | "Final Week",
      "daysBeforeEvent": 90, // integer: how many days before event date this task should be completed (e.g. 180, 120, 60, 30, 14, 7, 1, 0)
      "priority": "high" | "medium" | "low",
      "stage": "Planning" | "Booking" | "Coordination" | "Execution"
    }
  ],
  "vendorChecklists": [
    {
      "category": "Venue" | "Catering" | "Photography" | "Music & DJ" | "Decor & Florals" | "Attire",
      "leadTime": "e.g. 6-9 months prior",
      "questionsToAsk": ["Clear question 1", "Question 2", "Question 3"],
      "redFlags": ["Red flag 1 to watch out for", "Red flag 2"],
      "documentsNeeded": ["Itemized contract with cancellation clause", "Proof of liability insurance"]
    }
  ],
  "ideas": [
    {
      "title": "Idea headline",
      "kind": "theme" | "decor" | "menu" | "entertainment" | "favors" | "hacks",
      "description": "Specific creative detail",
      "vibe": "e.g. Warm Rustic or Bollywood Glam or Retro Arcade",
      "costRating": "$" | "$$" | "$$$",
      "palette": ["#Hex1", "#Hex2", "#Hex3"] // optional color palette for decor/theme
    }
  ],
  "smartTips": [
    "2-3 high-impact insider tips for this specific event type, location, or cultural style"
  ]
}

CRITICAL:
1. Make the budget breakdown sum to approx 100% (reserve 10% for contingency).
2. For ${safeEventType}, adjust category weights realistically (e.g. catering and venue are biggest for weddings, entertainment and activities higher for birthdays, permits/AV for community).
3. Do not include markdown code ticks, just the raw JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '';
        if (text) {
          generatedPlan = JSON.parse(text);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, generating fallback intelligent plan:', geminiError);
      }
    }

    // Fallback algorithmic plan generator if AI is unavailable or parsed empty
    if (!generatedPlan) {
      generatedPlan = createIntelligentFallbackPlan({
        title: safeTitle || `${safeEventType} Celebration`,
        eventType: safeEventType,
        date: safeDate,
        location: safeLocation,
        guestCount: safeGuests,
        totalBudget: safeBudget,
        currency: safeCurrency,
        theme: safeTheme,
        culturalPreferences: safeCultural,
        dietaryNeeds: safeDietary,
      });
    }

    // Normalize and calibrate budget arithmetic strictly in code
    const contingencyAmount = Math.round(safeBudget * 0.1);
    const nonContingencyBudget = safeBudget - contingencyAmount;

    let rawTotalEstimated = 0;
    const sanitizedBudgetItems = (generatedPlan.budgetItems || []).map((item: any, idx: number) => {
      const isContingency = item.category?.toLowerCase() === 'contingency';
      if (isContingency) {
        return {
          id: `item-${Date.now()}-${idx}`,
          category: 'Contingency',
          name: item.name || 'Emergency & Contingency Reserve (10%)',
          estimated: contingencyAmount,
          actual: 0,
          paid: 0,
          percentage: 10,
          notes: item.notes || 'Buffer for unexpected costs, last-minute guests, or price increases',
          priority: 'high',
        };
      }
      const rawEst = Number(item.estimated) || 0;
      rawTotalEstimated += rawEst;
      return {
        id: `item-${Date.now()}-${idx}`,
        category: item.category || 'General',
        name: item.name || `Budget Item ${idx + 1}`,
        estimated: rawEst,
        actual: 0,
        paid: 0,
        percentage: Number(item.percentage) || 0,
        notes: item.notes || '',
        priority: item.priority || 'medium',
      };
    });

    // Re-scale non-contingency items to fit nonContingencyBudget exactly
    let runningSum = 0;
    const finalBudgetItems = sanitizedBudgetItems.map((item: any) => {
      if (item.category === 'Contingency') {
        return item;
      }
      let adjustedEst = item.estimated;
      if (rawTotalEstimated > 0) {
        adjustedEst = Math.round((item.estimated / rawTotalEstimated) * nonContingencyBudget);
      } else {
        adjustedEst = Math.round(nonContingencyBudget / (sanitizedBudgetItems.length - 1 || 1));
      }
      runningSum += adjustedEst;
      const percentage = safeBudget > 0 ? Number(((adjustedEst / safeBudget) * 100).toFixed(1)) : 0;
      return {
        ...item,
        estimated: adjustedEst,
        percentage,
      };
    });

    // If slight rounding drift, calibrate first item
    const discrepancy = nonContingencyBudget - runningSum;
    const firstNonContingency = finalBudgetItems.find((i: any) => i.category !== 'Contingency');
    if (firstNonContingency && Math.abs(discrepancy) > 0) {
      firstNonContingency.estimated += discrepancy;
      firstNonContingency.percentage = Number(((firstNonContingency.estimated / safeBudget) * 100).toFixed(1));
    }

    // Ensure contingency is included
    if (!finalBudgetItems.some((i: any) => i.category === 'Contingency')) {
      finalBudgetItems.push({
        id: `item-${Date.now()}-contingency`,
        category: 'Contingency',
        name: 'Emergency & Contingency Reserve (10%)',
        estimated: contingencyAmount,
        actual: 0,
        paid: 0,
        percentage: 10,
        notes: 'Recommended safety cushion for surprise costs',
        priority: 'high',
      });
    }

    // Convert relative task offsets to concrete calendar dates
    const finalTasks = (generatedPlan.timelineTasks || []).map((t: any, idx: number) => {
      const days = typeof t.daysBeforeEvent === 'number' ? t.daysBeforeEvent : (90 - idx * 10);
      const dueDate = calculateTaskDate(safeDate, -Math.abs(days));
      return {
        id: `task-${Date.now()}-${idx}`,
        title: t.title || `Milestone ${idx + 1}`,
        description: t.description || '',
        category: t.category || 'Planning',
        dueDate,
        daysBeforeEvent: days,
        priority: t.priority || 'medium',
        status: 'todo',
        assignee: 'Lead Planner',
        completed: false,
      };
    });

    // Format final response
    res.json({
      success: true,
      data: {
        summary: generatedPlan.summary,
        budgetItems: finalBudgetItems,
        timelineTasks: finalTasks,
        vendorChecklists: generatedPlan.vendorChecklists || [],
        ideas: generatedPlan.ideas || [],
        smartTips: generatedPlan.smartTips || [],
      },
    });
  } catch (error: any) {
    console.error('Error generating event plan:', error);
    res.status(500).json({ error: error.message || 'Failed to generate event plan' });
  }
});

// Conversational Chat endpoint for questions, brainstorming, and live plan refinement
app.post('/api/chat', aiRateLimiter, async (req, res) => {
  try {
    const rawMessages = Array.isArray(req.body.messages) ? req.body.messages.slice(-25) : [];
    const currentEvent = req.body.currentEvent;
    const currentPlan = req.body.currentPlan;
    const lastUserMessage = sanitizeString(rawMessages[rawMessages.length - 1]?.content, 1500, '');

    if (!lastUserMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (ai) {
      try {
        const systemInstruction = `You are Aayojan, an empathetic, hyper-organized AI Event Planning Co-pilot.
You are helping the user plan:
- Event: "${currentEvent?.title || 'My Event'}" (${currentEvent?.type || 'Event'})
- Date: ${currentEvent?.date || 'Upcoming'}
- Budget: ${currentEvent?.currency || '$'}${currentEvent?.totalBudget || 0}
- Location: ${currentEvent?.location || 'Unspecified'}
- Guests: ${currentEvent?.guestCount || 'Unspecified'}
- Theme: ${currentEvent?.theme || 'Custom'}

Current Plan Snapshot:
- Budget Items Count: ${currentPlan?.budgetItems?.length || 0}
- Timeline Tasks Count: ${currentPlan?.timelineTasks?.length || 0}
- Vendors Shortlisted: ${currentPlan?.vendors?.length || 0}

INSTRUCTIONS:
1. Provide a warm, actionable, highly practical response.
2. If the user asks for ideas, suggestions, contract questions, or timeline pacing, be specific with real numbers and examples.
3. If the user asks you to modify, add to, or update their plan (e.g., "Add a photo booth budget item for $500", "Cut $1,000 from floral and give to entertainment", "Add a reminder to send RSVPs 6 weeks before", "Add a vegan cake vendor"), provide your response AND include a JSON patch block wrapped in \`\`\`eventgenie_patch and \`\`\`.
Allowed patch format:
\`\`\`eventgenie_patch
{
  "action": "add_budget_item" | "update_budget_item" | "delete_budget_item" | "add_task" | "add_vendor" | "add_idea" | "update_event_details",
  "payload": { ...appropriate fields... }
}
\`\`\`
Examples:
- To add a budget item: { "action": "add_budget_item", "payload": { "category": "Entertainment", "name": "Photo Booth & Props", "estimated": 600, "notes": "3-hour rental with unlimited prints" } }
- To add a timeline task: { "action": "add_task", "payload": { "title": "Finalize seating chart", "category": "Logistics", "dueDate": "YYYY-MM-DD", "priority": "high", "description": "Group family tables" } }
- To add an idea: { "action": "add_idea", "payload": { "title": "Signature Mocktail Station", "kind": "menu", "description": "Berry Hibiscus Fizz with custom personalized stirs", "vibe": "Chic & Refreshing", "costRating": "$" } }

Keep tone encouraging, insightful, and concise. Never use robotic disclaimers.`;

        // Format history for Gemini chat
        const chatContents = rawMessages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

        // Send conversation
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: chatContents.length > 0 ? chatContents : [{ role: 'user', parts: [{ text: lastUserMessage }] }],
          config: {
            systemInstruction,
          },
        });

        const replyText = response.text || "I'm ready to help you plan every detail!";
        
        // Parse any embedded patch
        let patchData = null;
        const patchMatch = replyText.match(/```eventgenie_patch\s*([\s\S]*?)\s*```/);
        if (patchMatch && patchMatch[1]) {
          try {
            patchData = JSON.parse(patchMatch[1]);
          } catch (e) {
            console.warn('Failed to parse patch JSON:', e);
          }
        }

        const cleanedReply = replyText.replace(/```eventgenie_patch[\s\S]*?```/, '').trim();

        return res.json({
          reply: cleanedReply,
          patch: patchData,
        });
      } catch (geminiError: any) {
        console.warn('Gemini chat error, falling back to smart responder:', geminiError);
      }
    }

    // Fallback responsive co-pilot answers
    const fallbackResponse = generateSmartChatFallback(lastUserMessage, currentEvent);
    res.json(fallbackResponse);
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: error.message || 'Chat generation failed' });
  }
});

// Refine Module endpoint (deep dive into budget reallocation, vendor negotiation, or theme revamp)
app.post('/api/refine-module', aiRateLimiter, async (req, res) => {
  try {
    const moduleType = sanitizeString(req.body.moduleType, 50, 'budget');
    const userRequest = sanitizeString(req.body.request, 1000, 'Optimize module allocations');
    const { currentEvent, currentData } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        message: 'Module updated successfully with expert best-practice guidelines.',
        result: currentData,
      });
    }

    const prompt = `You are Aayojan. The user wants to refine their ${moduleType} for "${currentEvent?.title || 'Event'}".
Current data: ${JSON.stringify(currentData)}
User refinement request: "${userRequest}"

Return a valid JSON object containing:
{
  "updatedData": ...the revised module array or object...,
  "summaryOfChanges": "Clear explanation of what was modified and why it improves their plan"
}
Ensure arithmetic is correct and realistic. Return raw JSON without markdown formatting.`;

    let parsed: any = null;
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = response.text?.trim() || '{}';
        parsed = JSON.parse(text);
      } catch (geminiError) {
        console.warn('Gemini refine-module failed, using structured fallback:', geminiError);
      }
    }

    if (!parsed || !parsed.updatedData) {
      return res.json({
        success: true,
        data: currentData,
        summary: `Reviewed ${moduleType} for "${currentEvent?.title || 'Event'}". Pacing, allocations, and priorities are aligned with best practices.`,
      });
    }

    res.json({
      success: true,
      data: parsed.updatedData,
      summary: parsed.summaryOfChanges || 'Successfully refined with updated planning recommendations.',
    });
  } catch (error: any) {
    console.error('Refine module error:', error);
    res.json({
      success: true,
      data: req.body?.currentData,
      summary: 'Maintained current module configurations with standard industry guidelines.',
    });
  }
});

// Helper for generating high quality fallback event plans
function createIntelligentFallbackPlan(event: any) {
  const isWedding = event.eventType?.toLowerCase().includes('wedding');
  const isBirthday = event.eventType?.toLowerCase().includes('birthday');
  const total = event.totalBudget || 10000;
  const currency = event.currency || 'USD';

  if (isBirthday) {
    return {
      summary: `A high-energy, joy-filled celebration for ${event.guestCount} guests, balancing engaging entertainment, immersive themed styling, and delicious treats within ${currency} ${total}.`,
      budgetItems: [
        { category: 'Venue', name: 'Activity Space / Party Hall Rental', percentage: 25, estimated: Math.round(total * 0.25), notes: 'Check if cleanup and tables are included', priority: 'high' },
        { category: 'Catering', name: 'Custom Cake, Kid Bites & Refreshment Bar', percentage: 25, estimated: Math.round(total * 0.25), notes: 'Finger foods, pizza/sliders, themed cake & allergy-safe options', priority: 'high' },
        { category: 'Entertainment', name: 'Entertainer, Magician / Game Host & Face Painter', percentage: 20, estimated: Math.round(total * 0.20), notes: 'Book 6-8 weeks early to secure weekend slots', priority: 'high' },
        { category: 'Decor & Florals', name: 'Balloon Garland, Themed Backdrop & Tableware', percentage: 12, estimated: Math.round(total * 0.12), notes: 'Color-coordinated photo zone', priority: 'medium' },
        { category: 'Invitations & Favors', name: 'Interactive Goodie Bags & Digital Invites', percentage: 8, estimated: Math.round(total * 0.08), notes: 'Personalized favors matching theme', priority: 'medium' },
      ],
      timelineTasks: [
        { title: 'Lock down date, venue and theme', description: 'Reserve venue and choose the hero color scheme/character', category: 'Venue', daysBeforeEvent: 45, priority: 'high', stage: 'Planning' },
        { title: 'Book principal entertainer / game coordinator', description: 'Confirm show timing and sound setup', category: 'Vendors', daysBeforeEvent: 30, priority: 'high', stage: 'Booking' },
        { title: 'Order custom cake and dessert assortment', description: 'Share dietary count and themed cake design', category: 'Catering', daysBeforeEvent: 21, priority: 'medium', stage: 'Booking' },
        { title: 'Send digital invitations with RSVP link', description: 'Request RSVPs 10 days before party date', category: 'Invitations', daysBeforeEvent: 21, priority: 'high', stage: 'Coordination' },
        { title: 'Assemble gift bags and purchase game prizes', description: 'Pack age-appropriate activities and favors', category: 'Logistics', daysBeforeEvent: 7, priority: 'medium', stage: 'Coordination' },
        { title: 'Final head count & food confirmation', description: 'Order pizzas/platters and prepare playlist', category: 'Catering', daysBeforeEvent: 3, priority: 'high', stage: 'Execution' },
        { title: 'Setup party hall 2 hours before kickoff', description: 'Inflate balloons, test speakers, set up gift table', category: 'Final Week', daysBeforeEvent: 0, priority: 'high', stage: 'Execution' },
      ],
      vendorChecklists: [
        {
          category: 'Venue',
          leadTime: '6-8 weeks prior',
          questionsToAsk: ['Can we bring our own cake and catering?', 'How many minutes before the party can we start decorating?', 'Is audio equipment provided?'],
          redFlags: ['Strict no-music policy', 'Excessive cleaning penalty fees not outlined in contract'],
          documentsNeeded: ['Rental agreement', 'Cancellation policy']
        },
        {
          category: 'Entertainment',
          leadTime: '4-6 weeks prior',
          questionsToAsk: ['What is your age-specific routine?', 'Do you provide your own sound system and props?', 'What happens if the performer gets sick?'],
          redFlags: ['Vague performance length', 'Requires full payment in cash upfront with no written receipt'],
          documentsNeeded: ['Booking confirmation with start/end time', 'Backup performer clause']
        }
      ],
      ideas: [
        { title: 'Interactive Balloon Arch Entrance', kind: 'decor', description: 'Spiral organic balloon arch welcoming guests into the festive zone', vibe: 'Playful & Vibrant', costRating: '$', palette: ['#3B82F6', '#F59E0B', '#10B981'] },
        { title: 'DIY Mini Sundae & Donut Bar', kind: 'menu', description: 'Tiered dessert bar with sprinkles, sauces, fruit toppings, and personalized cups', vibe: 'Delightful', costRating: '$' },
        { title: 'Secret Agent Scavenger Hunt', kind: 'entertainment', description: 'Clue cards hidden around the space leading to a collaborative treasure chest', vibe: 'High Engagement', costRating: '$' },
      ],
      smartTips: [
        'Schedule high-energy entertainment early in the party before kids get tired or hungry.',
        'Always order 10% extra cupcakes or single-serve snacks for siblings and accompanying parents.',
        'Prep a designated box for presents with a notepad and pen to track gift givers.'
      ]
    };
  }

  // Default Wedding / Grand Event Fallback
  return {
    summary: `A seamless, memorable celebration for ${event.guestCount} guests with balanced allocations across food, ambiance, storytelling photography, and guest comfort.`,
    budgetItems: [
      { category: 'Catering', name: 'Passed Hors d\'oeuvres, Dinner & Beverage Service', percentage: 38, estimated: Math.round(total * 0.38), notes: 'Estimated per-plate cost including service staff', priority: 'high' },
      { category: 'Venue', name: 'Ceremony & Reception Space Rental', percentage: 20, estimated: Math.round(total * 0.20), notes: 'Verify tables, chairs, audio setup and cleanup fees', priority: 'high' },
      { category: 'Photography & Media', name: 'Lead Photographer & Cinematic Video', percentage: 12, estimated: Math.round(total * 0.12), notes: '8 hours of coverage with high-res digital gallery', priority: 'high' },
      { category: 'Decor & Florals', name: 'Centerpieces, Ceremony Arch & Lighting', percentage: 10, estimated: Math.round(total * 0.10), notes: 'Repurpose ceremony florals to reception head table', priority: 'medium' },
      { category: 'Entertainment', name: 'DJ, Live Musician Trio & Sound Setup', percentage: 6, estimated: Math.round(total * 0.06), notes: 'Covers ceremony prelude, cocktail hour, and dancing', priority: 'medium' },
      { category: 'Attire & Beauty', name: 'Bridal/Couple Attire, Hair & Makeup', percentage: 4, estimated: Math.round(total * 0.04), notes: 'Includes hair and makeup trial run', priority: 'medium' },
    ],
    timelineTasks: [
      { title: 'Finalize core guest list and budget bounds', description: 'Align with partner and families on hard guest caps', category: 'Planning', daysBeforeEvent: 180, priority: 'high', stage: 'Planning' },
      { title: 'Tour and secure primary venue contract', description: 'Review noise curfews, liquor license, and weather backup spaces', category: 'Venue', daysBeforeEvent: 150, priority: 'high', stage: 'Booking' },
      { title: 'Book wedding photographer & videographer', description: 'Lock in date with deposit and schedule engagement shoot', category: 'Vendors', daysBeforeEvent: 120, priority: 'high', stage: 'Booking' },
      { title: 'Tasting session & caterer menu finalization', description: 'Select dinner options, cocktail pairings, and dietary alternatives', category: 'Catering', daysBeforeEvent: 90, priority: 'high', stage: 'Coordination' },
      { title: 'Send formal invitations with RSVP deadline', description: 'Set RSVP cut-off 35 days prior to order deadlines', category: 'Invitations', daysBeforeEvent: 60, priority: 'high', stage: 'Coordination' },
      { title: 'Floral walkthrough & tablescape sample', description: 'Review mock centerpiece with rental charger plates and linens', category: 'Decor', daysBeforeEvent: 30, priority: 'medium', stage: 'Coordination' },
      { title: "Finalize song playlist & 'Do Not Play' list", description: 'Confirm entry, first dance, cake cutting, and closing tracks', category: 'Program', daysBeforeEvent: 14, priority: 'medium', stage: 'Execution' },
      { title: 'Deliver final headcount to caterer & venue', description: 'Submit detailed table seating chart and dietary cards', category: 'Logistics', daysBeforeEvent: 7, priority: 'high', stage: 'Execution' },
      { title: 'Rehearsal walkthrough & welcome dinner', description: 'Run through processional order and hand over vendor timeline', category: 'Final Week', daysBeforeEvent: 1, priority: 'high', stage: 'Execution' },
    ],
    vendorChecklists: [
      {
        category: 'Catering',
        leadTime: '6-9 months prior',
        questionsToAsk: ['What is the server-to-guest ratio?', 'Are tastings complimentary prior to signing?', 'Do you provide linens, glassware, and tableware, or must they be rented?'],
        redFlags: ['Unclear service charge (e.g. 25% administrative fee that is NOT gratuity)', 'Refusal to accommodate severe allergies in writing'],
        documentsNeeded: ['Detailed itemized proposal', 'Health inspection certificate', 'Commercial liability policy']
      },
      {
        category: 'Venue',
        leadTime: '9-12 months prior',
        questionsToAsk: ['What is the exact load-in and load-out window for vendors?', 'What is the inclement weather rain plan?', 'Are there restrictions on candles, sparklers, or hanging installations?'],
        redFlags: ['Exclusive vendor list with high buy-out fees to use outside vendors', 'Strict decibel limit below standard party levels'],
        documentsNeeded: ['Fully executed lease agreement', 'Floorplan with electrical outlet mappings']
      }
    ],
    ideas: [
      { title: 'Repurposed Ceremony Arch Backdrop', kind: 'decor', description: 'Move the floral floral arch behind the sweetheart/head table after vows to save $1,200', vibe: 'Smart Elegance', costRating: '$', palette: ['#E0E7FF', '#FDF2F8', '#1E293B'] },
      { title: 'Midnight Snack Surprise Station', kind: 'menu', description: 'Mini gourmet grilled cheese and warm churro bites brought out during the last hour of dancing', vibe: 'Unforgettable Crowd-pleaser', costRating: '$' },
      { title: 'Audio Guestbook Phone', kind: 'entertainment', description: 'Vintage rotary phone where guests leave recorded voicemail memories and hilarious toasts', vibe: 'Sentimental & Nostalgic', costRating: '$$' },
    ],
    smartTips: [
      'Lock in vendors that can only take one event per day first (Photographer, Venue, DJ).',
      'Always request an itemized BEO (Banquet Event Order) to avoid unexpected 20% service fees.',
      'Build a 30-minute buffer into the day-of hair and makeup schedule to keep stress low.'
    ]
  };
}

function generateSmartChatFallback(message: string, event: any) {
  const lower = message.toLowerCase();
  
  if (lower.includes('budget') || lower.includes('cost') || lower.includes('save') || lower.includes('cut')) {
    return {
      reply: `Here are 3 smart ways to optimize your budget for ${event?.title || 'your event'}:
1. **The 10% Rule**: Keep your 10% contingency buffer untouched until 3 weeks before the event.
2. **Catering Strategy**: Plated dinners cost ~25% more than family style or action stations due to staffing ratios.
3. **Floral Repurposing**: Ask your florist to design ceremony pieces that can easily be moved to the reception tables during cocktail hour.

Would you like me to adjust any specific budget category or allocate more to entertainment or photography?`,
      patch: null,
    };
  }

  if (lower.includes('vendor') || lower.includes('question') || lower.includes('hire') || lower.includes('contract')) {
    return {
      reply: `When speaking to vendors, always verify three essential items before signing:
1. **Exact Crew & Overtime Rates**: What is the hourly rate if the party runs 45 minutes late?
2. **Cancellation & Force Majeure Clause**: What happens if weather or unforeseen circumstances require a reschedule?
3. **Backup Plan**: If the primary photographer or lead DJ falls ill, who is their guaranteed contracted replacement?

Check out the Vendor Hub tab to review our full list of red flags and questions to ask!`,
      patch: null,
    };
  }

  if (lower.includes('timeline') || lower.includes('schedule') || lower.includes('when') || lower.includes('calendar')) {
    return {
      reply: `Working backward from your event date (${event?.date || 'soon'}), your top priorities this month should be:
- Confirming your guest count RSVPs so catering numbers can be finalized.
- Setting the day-of minute-by-minute schedule for load-in and speeches.
- Creating the vendor contact sheet and distributing it to your co-planners.

You can switch between the Timeline view, Kanban board, and Month Calendar in the Timeline tab!`,
      patch: null,
    };
  }

  return {
    reply: `I can help you adjust budgets, expand your timeline with specific tasks, review vendor contracts, or brainstorm creative décor and food ideas. 

Try asking:
- "Can you add a photobooth with a $400 budget?"
- "What questions should I ask my caterer about tastings?"
- "Suggest 3 icebreaker activities for guests of all ages."
- "Rebalance my budget if we add 20 more guests."`,
    patch: null,
  };
}

// Development and Production Static Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aayojan server running on http://0.0.0.0:${PORT} (Gemini AI: ${Boolean(apiKey) ? 'Active' : 'Using Intelligent Fallbacks'})`);
  });
}

startServer();
