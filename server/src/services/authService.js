// services/authService.js
// -----------------------------------------------------------------------
// Business logic for authentication, kept out of the controller so it's
// reusable (e.g. by a future admin CLI script or a webhook) and so the
// controller stays a thin HTTP layer.
// -----------------------------------------------------------------------

import { firebaseAuth } from '../config/firebase.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verifies a Firebase ID token sent by the client.
 * Throws ApiError.unauthorized if the token is invalid/expired.
 * @param {string} idToken
 * @returns {Promise<import('firebase-admin').auth.DecodedIdToken>}
 */
export const verifyFirebaseToken = async (idToken) => {
  if (!idToken) {
    throw ApiError.badRequest('Firebase ID token is required');
  }
  try {
    return await firebaseAuth.verifyIdToken(idToken);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired Firebase token');
  }
};

/**
 * Finds an existing Mongo User by firebaseUid, or creates one on first
 * login/register. This single function backs register, login, AND
 * Google login - they only differ in which `authProvider` gets recorded.
 * @param {import('firebase-admin').auth.DecodedIdToken} decodedToken
 * @param {'password'|'google'} authProvider
 * @param {string} [displayName] - fallback name if Firebase token has none
 */
export const findOrCreateUser = async (decodedToken, authProvider, displayName) => {
  const { uid, email, name, picture } = decodedToken;

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      email,
      name: name || displayName || email.split('@')[0],
      avatarUrl: picture || '',
      authProvider,
    });
  } else {
    // Keep our mirror in sync with the latest Firebase profile data
    // (e.g. user updated their Google avatar) and record the login time.
    user.lastLoginAt = new Date();
    if (picture) user.avatarUrl = picture;
    await user.save();
  }

  return user;
};
