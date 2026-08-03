// tests/unit/services/validationGuards.test.js
// -----------------------------------------------------------------------
// Every assertion here exercises a guard clause that runs BEFORE any
// database query or network call - that's what makes these safe to
// test without mocking Mongoose/axios/Gemini. Guards that require a
// live DB/API to reach (e.g. "reminder not found") belong in
// integration tests instead.
// -----------------------------------------------------------------------

import { describe, it, expect } from '@jest/globals';
import { createReminder } from '../../../src/services/reminderService.js';
import { createCalendarEvent } from '../../../src/services/calendarService.js';

describe('reminderService.createReminder validation', () => {
  it('rejects an unparseable date string', async () => {
    await expect(createReminder({ userId: 'u1', title: 'test', remindAt: 'not a real date' })).rejects.toThrow(
      /isn't a date\/time/
    );
  });

  it('rejects a date in the past', async () => {
    await expect(createReminder({ userId: 'u1', title: 'test', remindAt: '2020-01-01T10:00:00Z' })).rejects.toThrow(
      /in the past/
    );
  });
});

describe('calendarService.createCalendarEvent validation', () => {
  const fakeClient = {}; // never reached - validation throws first

  it('rejects unparseable start/end times', async () => {
    await expect(
      createCalendarEvent(fakeClient, { title: 'test', startISO: 'garbage', endISO: 'also garbage' })
    ).rejects.toThrow(/start or end time/);
  });

  it('rejects an end time before the start time', async () => {
    await expect(
      createCalendarEvent(fakeClient, {
        title: 'test',
        startISO: '2026-08-01T18:00:00Z',
        endISO: '2026-08-01T17:00:00Z',
      })
    ).rejects.toThrow(/end time must be after/);
  });
});
