# NOVA AI - Testing Strategy

This document explains what's tested, how, and — just as importantly — what **can't** be tested without live credentials/infrastructure, so nobody mistakes "the test suite is green" for "every integration works end to end."

## Layers

### 1. Backend unit tests (Jest) — `server/tests/unit/`

Pure logic only: no live database, no live third-party API. Covers:

- **`utils/`** — `ApiError`/`ApiResponse`/`asyncHandler` (the shared error-handling contract every controller relies on)
- **`agents/`** — the graph's `toolMetadata` mapping (empty/single/multi-tool cases), the memory-augmented system instruction builder, and a **route consistency check** that fails the build if the Planner's `AVAILABLE_ROUTES` and `graph.js`'s `routeMap` ever drift apart — the kind of bug that would otherwise misroute silently at runtime
- **`services/`** — every service's input-validation guards (invalid dates, end-before-start, missing config) — all of these throw *before* touching a database or network call, which is what makes them safe to test without mocking Mongoose/axios/Gemini
- **PDF text splitting/cleaning** — chunk reassembly correctness, no content lost across boundaries, page-marker stripping

Run with:
```bash
cd server
npm install
npm test
```

### 2. Backend integration tests (Jest + Supertest) — `server/tests/integration/`

Exercises the real `app.js` end-to-end via HTTP, for routes that don't require live third-party credentials: the health check, the 404 handler, and unauthenticated access to a protected route. `tests/setup.js` provides throwaway (but validly-formatted) env vars and a real disposable RSA keypair for Firebase Admin's cert parsing, so importing `app.js` in a test never crashes the test runner — a real risk we caught: `config/env.js` calls `process.exit(1)` on missing required vars, and `config/firebase.js` throws immediately on a malformed private key.

**What's deliberately NOT covered here**: any route that needs a live MongoDB connection to actually persist/query data (e.g. creating a reminder, sending a chat message end-to-end). Adding that requires either a real MongoDB Memory Server (an in-memory Mongo instance spun up per test run) or a test database — a natural next step once you have infrastructure to point it at, intentionally left out of this module to keep the suite runnable with zero external dependencies.

### 3. Frontend unit tests (Vitest) — `client/src/**/*.test.js`

- **`wakeWordDetector.test.js`** — every phrasing variant (aliases, punctuation, case), including the "longest alias wins" rule that prevents a stray "hey" leaking into an extracted command
- **`chatApi.test.js`** — the hand-rolled SSE frame parser, including the exact "a frame splits across two network reads" scenario that looks fine in a demo and breaks in production

Run with:
```bash
cd client
npm install
npm test
```

## What genuinely needs live credentials/infrastructure (not fakeable)

Every module's build-out flagged these as they came up — collected here for one clear reference:

| Feature | What's needed to test live |
|---|---|
| Weather, Search, Research | Real `OPENWEATHER_API_KEY` / `GOOGLE_SEARCH_API_KEY` |
| Calendar, Email reading | A connected Google account (OAuth flow completed) |
| Email sending | A real Gmail app password |
| PDF/RAG | A running ChromaDB instance + real Gemini embedding calls |
| WhatsApp | A scanned QR code, a real WhatsApp account, and (per Module 17) ideally a host with a persistent filesystem |
| System Agent | A real desktop running the companion app - this sandbox correctly has none |
| Memory distillation quality | Real Gemini calls - the *mechanism* (storage, recall, graceful degradation) is unit tested; the *quality* of what Gemini chooses to remember is not something a unit test can meaningfully assert |

None of these are gaps in effort — they're the honest boundary between "logic we wrote" and "third-party services we integrate with." The right way to validate them is a manual smoke test against your own API keys before deploying, not a mocked unit test that would just prove our mock behaves the way we told it to.

## Recommended CI setup (for the deployment module)

```yaml
# illustrative - wired up properly in the Deployment Guide module
- run: cd server && npm ci && npm test
- run: cd client && npm ci && npm test && npm run build
```

Both suites are fast (seconds, not minutes) and have zero external dependencies, so there's no reason not to run them on every push.
