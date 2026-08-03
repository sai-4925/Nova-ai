// config/firebase.js
// -----------------------------------------------------------------------
// Initializes Firebase Admin SDK ONCE for the whole server process.
// This is what lets the backend verify ID tokens issued by the React
// client's Firebase Authentication SDK, WITHOUT ever handling a raw
// password ourselves.
// -----------------------------------------------------------------------

import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });
  logger.info('Firebase Admin SDK initialized');
}

export const firebaseAuth = admin.auth();
