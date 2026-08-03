// utils/ApiError.js
// -----------------------------------------------------------------------
// A custom Error subclass carrying an HTTP status code and an
// "isOperational" flag.
//
// WHY THIS EXISTS:
// Not every thrown error is the same. A user submitting a bad email
// (operational, expected, safe to show to the client) is very different
// from a null-pointer bug deep in our code (programmer error, should
// NEVER leak details to the client). ApiError lets errorMiddleware.js
// tell these apart and respond appropriately.
// -----------------------------------------------------------------------

export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 404, 500, etc.)
   * @param {string} message - Human-readable error message safe to show the client
   * @param {boolean} isOperational - true for expected/handled errors
   * @param {object} [details] - optional extra context (e.g. validation fields)
   */
  constructor(statusCode, message, isOperational = true, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Preserve proper stack trace (excluding constructor call itself)
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, true, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, true);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, true);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, true);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, false);
  }
}
