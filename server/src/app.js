// src/app.js
// -----------------------------------------------------------------------
// Assembles the Express application: global middleware, routes, and
// error handling. Deliberately does NOT call app.listen() - that lives
// in server.js - so this file can be imported directly in tests
// (supertest) without opening a real network port.
// -----------------------------------------------------------------------

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ApiResponse } from './utils/ApiResponse.js';
import { notFoundMiddleware, errorMiddleware } from './middleware/errorMiddleware.js';

// NOTE: Route imports are added incrementally as each module is built.
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';

const app = express();

// ---------------------- Core middleware ----------------------
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // allow cookies (refresh tokens) to be sent
  })
);
app.use(express.json({ limit: '2mb' })); // 2mb covers small PDF/base64 payloads from voice/chat
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging piped through Winston instead of raw console output
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
)

// Basic rate limiting on all API routes to protect free-tier hosting
// (Render/Atlas) from abuse. Individual routes (e.g. auth) can layer
// stricter limits on top later.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ---------------------- Health check ----------------------
// Used by Render for uptime checks and by developers to confirm the
// server booted correctly.
app.get('/health', (req, res) => {
  new ApiResponse(200, { status: 'ok', timestamp: new Date().toISOString() }, 'NOVA AI server is running').send(res);
});

// ---------------------- Feature routes ----------------------
// Mounted here one module at a time as they're built:
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/memory', memoryRoutes);

// ---------------------- Error handling (must be LAST) ----------------------
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
