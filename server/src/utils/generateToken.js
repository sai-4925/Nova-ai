// utils/generateToken.js
// -----------------------------------------------------------------------
// Issues OUR OWN JWT (distinct from Firebase's ID token) and attaches it
// to the response as an httpOnly cookie.
//
// WHY A SEPARATE JWT INSTEAD OF JUST USING FIREBASE'S TOKEN:
//   - Firebase ID tokens expire every 1 hour and refreshing them requires
//     either the Firebase client SDK or an extra network call - awkward
//     for a plain REST API to re-verify on every request.
//   - Our own JWT lets us control expiry (JWT_EXPIRES_IN) and payload
//     shape (just the Mongo user ID) independent of Firebase's format.
//   - httpOnly cookie (not localStorage) means client-side JS - and by
//     extension any injected/malicious script - can never read the
//     token directly, mitigating XSS token theft.
// -----------------------------------------------------------------------

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Signs a JWT for the given Mongo user ID and attaches it to the
 * response as a secure, httpOnly cookie.
 * @param {import('express').Response} res
 * @param {string} userId - Mongo _id of the authenticated user
 */
export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  res.cookie('nova_token', token, {
    httpOnly: true, // inaccessible to client-side JS
    secure: env.isProduction, // HTTPS only in production
    sameSite: env.isProduction ? 'none' : 'lax', // 'none' needed for cross-site Vercel <-> Render
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, keep in sync with JWT_EXPIRES_IN
  });

  return token;
};
