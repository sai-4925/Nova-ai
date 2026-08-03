# NOVA AI — Deployment Guide

This guide deploys the backend to **Render**, the frontend to **Vercel**, and the vector store to **Chroma Cloud** (recommended for production — see why below). All prices/limits noted here were verified in July 2026; check each provider's current pricing page before committing, since free-tier terms change.

---

## 0. Architecture recap

```
Vercel (React frontend)  →  Render (Express + LangGraph backend)  →  MongoDB Atlas
                                        ↓                              Chroma Cloud
                                  Google APIs (Calendar/Gmail/Search)
                                  Gemini API
                                        ↑
                          Local companion app (System Agent, WhatsApp)
                          — runs on the USER'S OWN machine, connects
                            outbound via WebSocket (Module 19)
```

---

## 1. Prerequisites — accounts you'll need

| Service | Why | Free tier? |
|---|---|---|
| [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Primary database | Yes (M0, 512MB) |
| [Firebase](https://console.firebase.google.com) | Authentication | Yes |
| [Google Cloud Console](https://console.cloud.google.com) | Gemini API key, OAuth client (Calendar/Gmail), Custom Search API | Yes, with usage limits |
| [Google Programmable Search Engine](https://programmablesearchengine.google.com) | Search Agent's `cx` (engine ID) | Yes |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather Agent | Yes (1,000 calls/day) |
| [Chroma Cloud](https://www.trychroma.com) | Vector store for the PDF/RAG and Memory agents | Free trial credits, then usage-based |
| [Render](https://render.com) | Backend hosting | Yes (Hobby tier — see caveats below) |
| [Vercel](https://vercel.com) | Frontend hosting | Yes (Hobby tier) |
| Gmail account + [App Password](https://myaccount.google.com/apppasswords) | Email Agent sending | Free |

---

## 2. Database — MongoDB Atlas

1. Create a free M0 cluster.
2. Database Access → add a user with a strong password.
3. Network Access → add `0.0.0.0/0` (Render's IPs aren't static on the free tier) — for a tighter setup later, Render offers static outbound IPs on paid plans.
4. Copy the connection string → this is your `MONGO_URI`.

## 3. Authentication — Firebase

1. Create a Firebase project → enable **Authentication** → enable **Email/Password** and **Google** sign-in providers.
2. **Project Settings → General** → add a Web App → copy the config object. These become your `VITE_FIREBASE_*` frontend env vars (Module 6).
3. **Project Settings → Service Accounts** → Generate new private key → downloads a JSON file. From it:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes exactly as downloaded when pasting into Render's env var UI)

## 4. Google Cloud Console — Gemini, OAuth, Search

1. **Gemini API key**: [aistudio.google.com](https://aistudio.google.com) → Get API Key → this is `GEMINI_API_KEY`.
2. **OAuth Client** (for Calendar + Gmail, Modules 13/16): APIs & Services → Credentials → Create OAuth Client ID → type "Web application" → add authorized redirect URI: `https://<your-render-backend>.onrender.com/api/calendar/oauth/callback`. Enable the **Google Calendar API** and **Gmail API** under APIs & Services → Library.
3. **Custom Search** (Module 14): enable the **Custom Search API**, generate an API key → `GOOGLE_SEARCH_API_KEY`. Then create a search engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com), configured to search the entire web → its ID is `GOOGLE_SEARCH_ENGINE_ID`.

## 5. Vector store — Chroma Cloud (recommended) or self-hosted

**Why Chroma Cloud over self-hosting on Render**: Module 15 flagged that Render's free-tier disk is ephemeral — a redeploy wipes any self-hosted Chroma data. Chroma Cloud is a managed, serverless offering from the same team behind the open-source project (same API, no code changes) with free trial credits to start. For a personal-assistant-scale deployment (thousands, not millions, of vectors), this comfortably avoids the disk problem without needing to manage a VPS.

1. Sign up at [trychroma.com](https://www.trychroma.com) → create a database → copy the connection details.
2. Set `CHROMA_URL` accordingly (or, if Chroma Cloud requires API-key auth in addition to a URL by the time you set this up, check their current docs — this is the one place in this guide most likely to have shifted since verification).

**Alternative**: self-host via this repo's `docker-compose.yml` on a small always-on VPS (Hetzner, DigitalOcean) with persistent storage — reasonable if you're already running the WhatsApp companion or System Agent relay somewhere with a persistent disk anyway.

## 6. Backend — Render

1. New → Web Service → connect your GitHub repo → set **Root Directory** to `server`.
2. **Build Command**: `npm install --legacy-peer-deps` — the `--legacy-peer-deps` flag is required (not optional), because `chromadb` declares a peer dependency on an older `@google/generative-ai` version than the one this project actually uses (flagged in Module 3 when this was first caught).
3. **Start Command**: `npm start`
4. **Health Check Path**: `/health` (Module 2's endpoint).
5. Add every environment variable from the checklist in §8 below.
6. Deploy. Note the resulting URL (`https://<something>.onrender.com`) — you'll need it for:
   - The OAuth redirect URI (§4.2)
   - The frontend's `VITE_API_BASE_URL`
   - The companion app's `backendWsUrl` (Module 19)

**Free tier realities (verified July 2026, subject to change)**: 512MB RAM, 0.1 CPU, **5GB bandwidth/month**, free services **spin down after 15 minutes of inactivity** (cold start 30-60s on the next request), no persistent disk. For a demo/personal-use deployment this is fine; if the spin-down cold start becomes annoying, Render's paid tier removes it.

## 7. Frontend — Vercel

1. Import the repo → set **Root Directory** to `client` → framework preset auto-detects Vite.
2. Add the `VITE_*` env vars (Firebase config + `VITE_API_BASE_URL` pointing at your Render backend).
3. **Important**: this repo already includes `client/vercel.json` with a SPA rewrite rule. Without it, refreshing the browser on `/chat` or `/dashboard` (any non-root route) 404s, because Vercel doesn't rewrite client-side routes to `index.html` automatically for a plain Vite SPA.
4. Deploy. Update the backend's `CLIENT_URL` env var on Render to match this Vercel URL exactly (needed for CORS — Module 2's `app.js` locks CORS to this one origin).

## 8. Full environment variable checklist

**Backend (Render)** — consolidated from every module:

```
PORT, NODE_ENV=production, CLIENT_URL
MONGO_URI
JWT_SECRET, JWT_EXPIRES_IN
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
GEMINI_API_KEY, GEMINI_MODEL
CHROMA_URL
EMAIL_USER, EMAIL_APP_PASSWORD
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
OPENWEATHER_API_KEY
GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID
WHATSAPP_ENABLED=false (unless you're running it on a persistent host - Module 17)
WHATSAPP_SESSION_PATH
```

**Frontend (Vercel)**:

```
VITE_API_BASE_URL
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
```

## 9. Post-deployment smoke test

1. `GET https://<backend>.onrender.com/health` → should return `{"success":true,"data":{"status":"ok"}}`.
2. Register a new account on the deployed frontend → confirm login works and `/api/auth/me` returns your profile.
3. Send Nova a plain message ("hello") → confirms Gemini + the graph's `general` route work.
4. Ask "what's the weather in \<your city\>" → confirms the Weather Agent + routing.
5. Upload a small PDF, wait for status to flip to `ready`, ask a question about it → confirms Chroma Cloud connectivity end-to-end.
6. Connect Google Calendar from the dashboard → confirms the OAuth redirect URI is configured correctly.

## 10. Production hardening notes

These are the caveats flagged throughout the build — gathered here so nothing gets missed at deploy time:

- **`--legacy-peer-deps` is required** for `npm install` (§6.2) — a plain `npm install` will fail on the chromadb/@google-generative-ai peer conflict.
- **`googleRefreshToken` is stored in plaintext** in MongoDB (Module 3's model comment flags this as a TODO). For a real production deployment handling other people's OAuth tokens, encrypt this field at rest (e.g., via MongoDB's field-level encryption or an application-level encryption library) before going further than personal use.
- **Cookies require HTTPS in production** — `generateToken.js` (Module 4) already sets `secure: true` and `sameSite: 'none'` when `NODE_ENV=production`, which is what allows the cross-origin Vercel↔Render cookie to work at all. Both Render and Vercel provide HTTPS by default, so this should just work — but if you ever see login succeed and then immediately appear logged out, check this first.
- **`firebase-admin` is pinned to `^12.3.0` deliberately** (Module 4) — v13+ replaced the classic `admin.initializeApp()` API with a modular one. Don't let a routine `npm update` silently break auth.
- **WhatsApp and the System Agent both need a persistent host**, not Render's free tier (Modules 17/19 cover this in depth) — a small always-on VPS or your own machine, not the same place as the main backend necessarily.
- **Rate limiting is already in place** (Module 2/4 — global + stricter auth-specific limits) but tune the numbers for your actual expected traffic before a public launch.
- **Uploaded PDFs live on local disk** (Module 15) — ephemeral on Render's free tier. A redeploy wipes uploaded files (though Chroma vectors + Mongo metadata survive, now orphaned). For anything beyond personal use, swap `uploadMiddleware.js`'s local disk storage for a free-tier object storage bucket (Cloudflare R2, Supabase Storage).
