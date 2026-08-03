// tests/unit/services/configGuards.test.js
// -----------------------------------------------------------------------
// These guards depend on whether an optional third-party API key is
// set (OPENWEATHER_API_KEY, GOOGLE_SEARCH_API_KEY, EMAIL_USER/
// EMAIL_APP_PASSWORD - see config/env.js, which deliberately does NOT
// require these at boot). To keep this test deterministic regardless
// of what a developer happens to have in their local .env, we delete
// those specific vars BEFORE dynamically importing the modules under
// test, forcing the "not configured" branch reliably every run.
// -----------------------------------------------------------------------

import { describe, it, expect, beforeAll } from '@jest/globals';

delete process.env.OPENWEATHER_API_KEY;
delete process.env.GOOGLE_SEARCH_API_KEY;
delete process.env.GOOGLE_SEARCH_ENGINE_ID;
delete process.env.EMAIL_USER;
delete process.env.EMAIL_APP_PASSWORD;

let getCurrentWeather;
let searchWeb;
let sendEmail;

beforeAll(async () => {
  ({ getCurrentWeather } = await import('../../../src/services/weatherService.js'));
  ({ searchWeb } = await import('../../../src/services/searchService.js'));
  ({ sendEmail } = await import('../../../src/services/emailService.js'));
});

describe('weatherService.getCurrentWeather without OPENWEATHER_API_KEY', () => {
  it('rejects with a clear configuration error, not a network attempt', async () => {
    await expect(getCurrentWeather('Delhi')).rejects.toThrow(/not configured/);
  });
});

describe('searchService.searchWeb without search API config', () => {
  it('rejects with a clear configuration error', async () => {
    await expect(searchWeb('latest AI news')).rejects.toThrow(/not configured/);
  });
});

describe('emailService.sendEmail without email config', () => {
  it('rejects with a clear configuration error', async () => {
    await expect(sendEmail({ to: 'friend@example.com', subject: 'Hi', body: 'test' })).rejects.toThrow(/not configured/);
  });
});
