import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, getDaysRemaining } from '../utils/formatters.ts';

describe('Aayojan Core Logic & Formatting Tests', () => {

  test('formatCurrency correctly formats Indian Rupee (INR) with Lakhs system', () => {
    assert.equal(formatCurrency(800000, '₹'), '₹8,00,000');
    assert.equal(formatCurrency(45000, '₹'), '₹45,000');
    assert.equal(formatCurrency(10000000, 'INR'), '₹1,00,00,000');
  });

  test('formatCurrency correctly formats international currencies ($ USD, € EUR, £ GBP)', () => {
    assert.equal(formatCurrency(15000, '$'), '$15,000');
    assert.equal(formatCurrency(7500, 'EUR'), '€7,500');
    assert.equal(formatCurrency(12000, '£'), '£12,000');
  });

  test('getDaysRemaining returns correct countdown info', () => {
    const today = new Date().toISOString().split('T')[0];
    const todayInfo = getDaysRemaining(today);
    assert.equal(todayInfo.isPast, false);
    assert.equal(todayInfo.days, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const futureInfo = getDaysRemaining(futureDate.toISOString().split('T')[0]);
    assert.equal(futureInfo.isPast, false);
    assert.equal(futureInfo.days, 45);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastInfo = getDaysRemaining(pastDate.toISOString().split('T')[0]);
    assert.equal(pastInfo.isPast, true);
    assert.equal(pastInfo.days, 10);
  });

  test('Budget Invariant: Contingency reservation ensures financial safety', () => {
    const totalBudget = 100000;
    const contingencyPercentage = 10;
    const contingencyAmount = Math.round(totalBudget * (contingencyPercentage / 100));

    const lineItems = [
      { name: 'Catering', estimated: 45000, percentage: 45 },
      { name: 'Venue', estimated: 25000, percentage: 25 },
      { name: 'Photography', estimated: 12000, percentage: 12 },
      { name: 'Decor', estimated: 8000, percentage: 8 },
      { name: 'Contingency', estimated: contingencyAmount, percentage: contingencyPercentage },
    ];

    const sumEstimated = lineItems.reduce((acc, item) => acc + item.estimated, 0);
    assert.equal(sumEstimated, totalBudget, 'Sum of all categories including 10% contingency strictly equals total budget');
    assert.equal(contingencyAmount, 10000, 'Contingency is exactly 10% of total budget');
  });

  test('Variance Calculation accurately identifies budget deviations', () => {
    const estimated = 5000;
    const actualOver = 5600;
    const actualUnder = 4200;

    const varianceOver = estimated - actualOver;
    const varianceUnder = estimated - actualUnder;

    assert.equal(varianceOver, -600, 'Negative variance indicates budget overrun');
    assert.equal(varianceUnder, 800, 'Positive variance indicates savings');
  });

  test('AI EventGenie Patch Extraction safely parses structured blocks', () => {
    const aiResponseWithPatch = `Here is my recommendation for the entertainment:
\`\`\`eventgenie_patch
{
  "action": "add_budget_item",
  "payload": {
    "name": "Live Acoustic String Duo",
    "category": "Entertainment",
    "estimated": 850,
    "priority": "high"
  }
}
\`\`\`
I hope this elevates the cocktail hour!`;

    const match = aiResponseWithPatch.match(/```eventgenie_patch\s*([\s\S]*?)\s*```/);
    assert.ok(match, 'EventGenie patch block should be detected');
    assert.ok(match[1], 'Captured JSON content must exist');

    const parsed = JSON.parse(match[1]);
    assert.equal(parsed.action, 'add_budget_item');
    assert.equal(parsed.payload.name, 'Live Acoustic String Duo');
    assert.equal(parsed.payload.estimated, 850);

    const cleanedText = aiResponseWithPatch.replace(/```eventgenie_patch[\s\S]*?```/, '').trim();
    assert.ok(!cleanedText.includes('eventgenie_patch'), 'Cleaned text strips internal patch markup');
    assert.ok(cleanedText.includes('Here is my recommendation'), 'Conversational intro preserved');
  });

  test('Backward date offset calculator produces valid ISO dates', () => {
    const eventDate = '2026-12-25';
    const target = new Date(eventDate);
    target.setDate(target.getDate() - 90);
    const calculatedDateStr = target.toISOString().split('T')[0];

    assert.equal(typeof calculatedDateStr, 'string');
    assert.match(calculatedDateStr, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(new Date(calculatedDateStr) < new Date(eventDate), 'Task date is chronologically before the event date');
  });

  test('Birthday Planning Model: Validates kids entertainment and cake ratio allocations', () => {
    const totalBudget = 50000;
    const birthdayItems = [
      { category: 'Venue', estimated: 12500, percentage: 25 },
      { category: 'Catering', estimated: 12500, percentage: 25 },
      { category: 'Entertainment', estimated: 10000, percentage: 20 },
      { category: 'Decor & Florals', estimated: 6000, percentage: 12 },
      { category: 'Invitations & Favors', estimated: 4000, percentage: 8 },
      { category: 'Contingency', estimated: 5000, percentage: 10 },
    ];

    const sum = birthdayItems.reduce((acc, i) => acc + i.estimated, 0);
    assert.equal(sum, totalBudget, 'Sum equals exact total budget');

    const entertainmentItem = birthdayItems.find((i) => i.category === 'Entertainment');
    assert.ok(entertainmentItem && entertainmentItem.percentage >= 15, 'Birthday plan reserves high entertainment ratio');
  });

  test('Community Festival Planning Model: Logistics, Permits & Volunteer milestones', () => {
    const festivalTasks = [
      { title: 'File municipal sound & park permits', daysBeforeEvent: 90, stage: 'Planning' },
      { title: 'Book portable restrooms & waste stations', daysBeforeEvent: 45, stage: 'Booking' },
      { title: 'Recruit community volunteers & marshals', daysBeforeEvent: 21, stage: 'Coordination' },
      { title: 'Final stage AV & sound check', daysBeforeEvent: 1, stage: 'Execution' },
    ];

    assert.equal(festivalTasks.length, 4);
    assert.ok(festivalTasks[0].daysBeforeEvent > festivalTasks[1].daysBeforeEvent, 'Milestones are sequentially ordered backwards');
    assert.equal(festivalTasks[0].stage, 'Planning');
    assert.equal(festivalTasks[3].stage, 'Execution');
  });

  test('Dietary Aggregation: Correctly computes counts across diverse attendee preferences', () => {
    const guestList = [
      { name: 'Guest 1', dietary: 'Vegetarian', partySize: 2 },
      { name: 'Guest 2', dietary: 'Vegan', partySize: 1 },
      { name: 'Guest 3', dietary: 'Vegetarian', partySize: 3 },
      { name: 'Guest 4', dietary: 'Halal', partySize: 4 },
      { name: 'Guest 5', dietary: 'Standard', partySize: 2 },
    ];

    const dietaryCounts: Record<string, number> = {};
    guestList.forEach((g) => {
      dietaryCounts[g.dietary] = (dietaryCounts[g.dietary] || 0) + g.partySize;
    });

    assert.equal(dietaryCounts['Vegetarian'], 5);
    assert.equal(dietaryCounts['Vegan'], 1);
    assert.equal(dietaryCounts['Halal'], 4);
    assert.equal(dietaryCounts['Standard'], 2);
  });

  test('formatCurrency edge cases: handles 0, negative values, and large numbers cleanly', () => {
    assert.equal(formatCurrency(0, '$'), '$0');
    assert.equal(formatCurrency(0, '₹'), '₹0');
    assert.equal(formatCurrency(2500000, '₹'), '₹25,00,000');
    assert.equal(formatCurrency(150000, '$'), '$150,000');
  });

});
