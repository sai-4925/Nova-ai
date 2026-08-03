# NOVA AI

A voice-controlled, multi-agent personal assistant. Chat with it or talk to it — Nova plans, routes, and executes across email, calendar, reminders, weather, web search, your own PDFs, research, code, and (with a local companion app) your actual desktop.

Built on a real **LangGraph** agent graph (not a single prompt with tool descriptions bolted on): a Planner node classifies intent, a Memory node recalls relevant long-term context, a Tool Selection node routes to the right specialist, and a Response node shapes the final answer — with a conditional loop-back for requests that need more than one tool in sequence.

---

## Features

| Area | What it does |
|---|---|
| **Auth** | Email/password + Google sign-in via Firebase, backend-issued JWT session, protected routes |
| **AI Chat** | Gemini-powered conversation, streamed live via SSE, full history persisted per conversation |
| **Voice Assistant** | Wake-word ("Nova") detection, Web Speech API recognition + synthesis, hands-free start-to-finish |
| **Email Agent** | Send (shared account), read & summarize your own inbox (Gmail API via OAuth) |
| **WhatsApp Agent** | Send messages, search contacts, read chats — via a shared connected account |
| **Reminder Agent** | Create, list, delete — natural-language date/time resolution |
| **Calendar Agent** | Add, list, delete Google Calendar events, via your own OAuth grant |
| **Weather Agent** | Current conditions for any city (OpenWeatherMap) |
| **Search Agent** | Google Custom Search, summarized results |
| **PDF / RAG Agent** | Upload a PDF, ask questions grounded in its actual content (Gemini embeddings + ChromaDB) |
| **Research Agent** | Breaks a topic into sub-questions, reads real source pages, synthesizes a cited summary |
| **Coding Agent** | Explain, generate, and debug code |
| **System Agent** | Open apps, take screenshots, shutdown/restart — via a local companion app on your own machine |
| **Memory** | Short-term (recent conversation) and long-term (distilled durable facts, recalled across sessions) |

---

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express (ES Modules, MVC)
- **Database**: MongoDB + Mongoose
- **Auth**: Firebase Authentication + JWT
- **AI**: Google Gemini API
- **Agent framework**: LangGraph JS + LangChain JS
- **Vector store**: ChromaDB (self-hosted or Chroma Cloud)
- **Voice**: Web Speech API (recognition + synthesis)
- **Testing**: Jest + Supertest (backend), Vitest (frontend)
- **Deployment**: Render (backend), Vercel (frontend)

---

## Architecture

```
START → Planner → Memory → Tool Selection ─┬→ Email / WhatsApp / Reminder / Calendar
                                             ├→ Weather / Search / PDF / Research
                                             ├→ Coding / System
                                             └→ (general, no tool) ─┐
                        ▲                                           │
                        └──── loop back if another tool is needed ──┤
                                                                     ▼
                                                                Response → END
```

- **Planner** classifies intent and extracts parameters, resolving relative dates ("tomorrow at 6pm") using the current server time.
- **Memory** embeds the incoming message and recalls relevant long-term facts from that user's own vector collection — skipped entirely (no embedding call) for a user with no stored memories yet.
- **Tool Selection** routes to the matching specialist node; each specialist node can set `needsAnotherTool` to loop back for a multi-step request ("check the weather, then email it to me").
- **Response** either surfaces a tool's output directly, or generates a direct conversational reply augmented with recalled memories.
- Every specialist node follows the same shape: a `service` (raw integration), a `tool` (LangChain-wrapped, schema-validated), and the `node` itself (dispatches, handles its own failure modes, never trusts user-identity fields from the LLM — see the security note in `tools/reminderTool.js`).

## Project Structure

```
nova-ai/
├── client/                     React (Vite) frontend
│   └── src/
│       ├── components/         common/ chat/ voice/ agents/
│       ├── context/            Auth, Chat, Voice
│       ├── hooks/               useAuth, useChat, useVoice, useSpeech*
│       ├── pages/               Login, Register, Dashboard, ChatPage
│       ├── router/              AppRouter, ProtectedRoute
│       └── services/            axios + per-feature API modules
│
├── server/                     Node.js + Express backend
│   ├── src/
│   │   ├── agents/              graph/ (state, graph.js), nodes/, prompts/
│   │   ├── config/              db, firebase, gemini, chroma, whatsapp, env
│   │   ├── controllers/ routes/ middleware/
│   │   ├── memory/               short-term + long-term memory
│   │   ├── models/               Mongoose schemas
│   │   ├── services/             one per integration (weather, calendar, email...)
│   │   ├── tools/                LangChain tool wrappers
│   │   └── vectorstore/          Chroma client, embeddings, PDF ingestion
│   └── tests/                    unit/ + integration/
│
├── system-agent/               Standalone companion app - runs on the USER'S
│                                own machine, connects outbound to the backend
│
├── docker-compose.yml           Local ChromaDB for development
├── DEPLOYMENT.md                 Full deployment guide (Render + Vercel + Chroma Cloud)
├── TESTING.md                    Testing strategy and what needs live credentials
└── LICENSE
```

## Getting Started (local development)

```bash
# 1. Backend
cd server
cp .env.example .env    # fill in your keys - see DEPLOYMENT.md for where to get each one
npm install --legacy-peer-deps
npm run dev

# 2. Frontend (separate terminal)
cd client
cp .env.example .env
npm install
npm run dev

# 3. ChromaDB, for the PDF and Memory agents (separate terminal)
docker compose up -d
```

Visit `http://localhost:5173`. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for exactly where to obtain every credential (MongoDB Atlas, Firebase, Gemini, Google OAuth, OpenWeatherMap, Google Custom Search, Chroma Cloud) and for deploying to Render + Vercel.

## Testing

```bash
cd server && npm test   # Jest - unit + integration
cd client && npm test   # Vitest - unit
```

See [`TESTING.md`](./TESTING.md) for what each layer covers and, importantly, what genuinely can't be verified without live third-party credentials (a real WhatsApp session, a real desktop for the System Agent, live API quota, etc.) — worth reading before assuming a green test run means every integration works end to end.

## Known Limitations (stated plainly, not buried)

- **WhatsApp and the System Agent both need a persistent, always-on host** — not Render's free tier, whose disk is ephemeral. A small VPS or your own machine works.
- **System Agent shutdown/restart on macOS/Linux typically need sudo** — a genuine OS constraint, not something the code works around silently (see `system-agent/README.md`).
- **Uploaded PDFs live on local disk** by default — ephemeral on Render's free tier; swap for object storage before relying on this beyond personal use.
- **`googleRefreshToken` is stored in plaintext** in MongoDB — fine for personal use, should be encrypted at rest before handling other people's OAuth tokens at any real scale.
- **No contacts/address book** — "email mom" without a real address, or "message mom on WhatsApp" without a matching contact, prompts for clarification rather than guessing.

## Contributing

Issues and PRs welcome. If you're adding a new agent, follow the established pattern: a `service` (pure integration, no LangChain/Express knowledge), a `tool` (LangChain-wrapped, Zod-validated — factory-bound to `userId` if it touches per-user data), and a `node` (dispatches, never trusts identity from the LLM, degrades gracefully on failure). Add the route to both the Planner's prompt and `graph.js`'s `routeMap` — the test suite's route-consistency check will catch it if you forget one side.

## License

[MIT](./LICENSE)
