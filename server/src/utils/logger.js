// utils/logger.js
// -----------------------------------------------------------------------
// Centralised structured logger using Winston.
// Using one logger instance everywhere means:
//   - Consistent log format across controllers/services/agents
//   - Easy to redirect logs to a file or external service later
//     without touching every file that logs something
// -----------------------------------------------------------------------

import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${ts} [${level}]: ${message} ${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ],
});
