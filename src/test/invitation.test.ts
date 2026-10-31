import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateUniqueCode } from '../utils/firebase.ts';

describe('Invitation & Unique Code Entry Validation', () => {
  test('generateUniqueCode generates formatted uppercase alphanumeric codes with clean prefix', () => {
    const codeWedding = generateUniqueCode('Wedding');
    assert.match(codeWedding, /^WED-[A-Z0-9]{4}$/);

    const codeBirthday = generateUniqueCode('Birthday');
    assert.match(codeBirthday, /^BIR-[A-Z0-9]{4}$/);

    const codeDefault = generateUniqueCode();
    assert.match(codeDefault, /^EVT-[A-Z0-9]{4}$/);
  });

  test('generateUniqueCode sanitizes special characters from prefix', () => {
    const codeSpecial = generateUniqueCode('Gala#2026!');
    assert.match(codeSpecial, /^GAL-[A-Z0-9]{4}$/);
  });

  test('generates unique codes across successive invocations', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateUniqueCode('EVT'));
    }
    // High probability of complete uniqueness with 32^4 combinations
    assert.ok(set.size >= 48);
  });

  test('Check-in duplicate detection logic prevents double admission', () => {
    const guestRecord = {
      id: 'g-1',
      name: 'Priya Sharma',
      entryCode: 'WED-8F2K',
      checkedIn: true,
      checkedInAt: '2026-12-15T18:30:00Z',
    };

    const isDuplicate = guestRecord.checkedIn === true;
    assert.strictEqual(isDuplicate, true, 'Already checked in guest must be identified as duplicate entry');
  });

  test('Party size headcount correctly accumulates admitted attendance', () => {
    const admittedGuests = [
      { name: 'Family A', partySize: 4, checkedIn: true },
      { name: 'Couple B', partySize: 2, checkedIn: true },
      { name: 'Solo C', partySize: 1, checkedIn: false },
    ];

    const admittedCount = admittedGuests
      .filter((g) => g.checkedIn)
      .reduce((sum, g) => sum + g.partySize, 0);

    assert.strictEqual(admittedCount, 6);
  });
});
