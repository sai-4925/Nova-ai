// tests/integration/health.test.js
// -----------------------------------------------------------------------
// Exercises the real Express app (app.js) end-to-end via Supertest, for
// the routes that don't need a live database connection - schema
// definitions (Mongoose models) load fine without one; only actual
// queries would hang/fail, which /health and the 404 handler never trigger.
// -----------------------------------------------------------------------

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /health', () => {
  it('returns 200 with a status ok payload', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });
});

describe('unknown routes', () => {
  it('returns a 404 with a consistent error envelope', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Route not found/);
  });
});

describe('protected routes without a session', () => {
  it('rejects with 401 when no auth cookie/token is present', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
