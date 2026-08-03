// middleware/errorMiddleware.js
// -----------------------------------------------------------------------
// Global error handler - the LAST middleware registered in app.js.
// Every error thrown anywhere in the request lifecycle (controllers,
// services, agent nodes) that reaches `next(err)` ends up here.
//
// WHY THIS EXISTS:
// Without a single global handler, every controller would need its own
// try/catch AND its own res.json() error shape - inconsistent and
// error-prone. This middleware guarantees ONE response format for every
// failure, and prevents leaking internal stack traces in production.
// -----------------------------------------------------------------------

import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// 404 handler - runs when no route matched at all.
// Registered separately in app.js, BEFORE this error handler.
export const notFoundMiddleware = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Normalise unknown/library errors (e.g. Mongoose CastError,
  // JWT errors) into our own ApiError shape so the response is
  // always consistent.
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false);
  }

  // Log full detail server-side regardless of environment.
  logger.error(error.message, {
    statusCode: error.statusCode,
    stack: env.isProduction ? undefined : error.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    // Only expose stack trace in development - never in production.
    ...(env.isProduction ? {} : { stack: error.stack }),
    ...(error.details ? { details: error.details } : {}),
  });
};
