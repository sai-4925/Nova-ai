// src/config/firebase.js
// -----------------------------------------------------------------------
// Initializes the Firebase client SDK ONCE. This is what the browser
// talks to directly for actual credential verification (email/password,
// Google popup) - our Express backend never sees a raw password, only
// the resulting ID token (see AuthContext.jsx and services/authApi.js).
// -----------------------------------------------------------------------

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { env } from './env.js';

const firebaseApp = initializeApp(env.firebase);

export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
