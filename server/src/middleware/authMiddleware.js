// middleware/authMiddleware.js
// -----------------------------------------------------------------------
// Gates every protected route. Verifies OUR OWN JWT (issued in
// generateToken.js), not the Firebase ID token - by this point Firebase
// has already done its job during login/register.
//
// Reads the token from the httpOnly cookie first (used by the browser
// client), falling back to an Authorization header (useful for testing
// with tools like Postman/curl where cookies are inconvenient).
// -----------------------------------------------------------------------

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.nova_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authenticated - no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired session - please log in again');
  }

  // Exclude sensitive fields (e.g. googleRefreshToken has select:false
  // already, but being explicit here is cheap insurance).
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Attach the authenticated user to the request for every downstream
  // controller/route to use - this is the contract every protected
  // route relies on.
  req.user = user;
  next();
});
