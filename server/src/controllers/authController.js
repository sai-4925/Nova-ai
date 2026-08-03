// controllers/authController.js
// -----------------------------------------------------------------------
// Thin HTTP layer over authService. Every endpoint here follows the same
// shape: verify Firebase ID token -> find-or-create Mongo user -> issue
// our own JWT cookie -> respond with the user profile.
//
// Register/Login/Google-login are separate endpoints (matching the
// product requirement of distinct UI flows) but share the exact same
// underlying logic - they only differ in the `authProvider` tag and
// which client-side Firebase method produced the idToken.
// -----------------------------------------------------------------------

import { verifyFirebaseToken, findOrCreateUser } from '../services/authService.js';
import { generateTokenAndSetCookie } from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// POST /api/auth/register
// Client has already called Firebase's createUserWithEmailAndPassword()
// and sends the resulting idToken here to create our Mongo profile.
export const register = asyncHandler(async (req, res) => {
  const { idToken, name } = req.body;
  const decodedToken = await verifyFirebaseToken(idToken);

  const user = await findOrCreateUser(decodedToken, 'password', name);
  generateTokenAndSetCookie(res, user._id);

  new ApiResponse(201, { user }, 'Account created successfully').send(res);
});

// POST /api/auth/login
// Client has already called Firebase's signInWithEmailAndPassword().
export const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const decodedToken = await verifyFirebaseToken(idToken);

  const user = await findOrCreateUser(decodedToken, 'password');
  generateTokenAndSetCookie(res, user._id);

  new ApiResponse(200, { user }, 'Logged in successfully').send(res);
});

// POST /api/auth/google
// Client has already called Firebase's signInWithPopup(GoogleAuthProvider).
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const decodedToken = await verifyFirebaseToken(idToken);

  if (!decodedToken.email) {
    throw ApiError.badRequest('Google account has no email associated');
  }

  const user = await findOrCreateUser(decodedToken, 'google');
  generateTokenAndSetCookie(res, user._id);

  new ApiResponse(200, { user }, 'Logged in with Google successfully').send(res);
});

// POST /api/auth/logout
// Simply clears our session cookie - Firebase sign-out happens
// separately on the client (firebase.auth().signOut()).
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('nova_token');
  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// GET /api/auth/me
// Protected route - req.user is attached by the `protect` middleware.
// Used by the frontend on app load to restore session state.
export const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(200, { user: req.user }, 'Current user fetched').send(res);
});
