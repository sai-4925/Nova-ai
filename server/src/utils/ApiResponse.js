// utils/ApiResponse.js
// -----------------------------------------------------------------------
// Standardised success response envelope.
//
// WHY THIS EXISTS:
// The React frontend's axios layer can rely on EVERY successful response
// looking like: { success: true, statusCode, message, data }.
// Without this, each controller would invent its own response shape,
// forcing the frontend to special-case every endpoint.
// -----------------------------------------------------------------------

export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}
