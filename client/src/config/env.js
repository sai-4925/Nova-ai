// src/config/env.js
// -----------------------------------------------------------------------
// Single source of truth for Vite env vars, mirroring the backend's
// config/env.js pattern. Vite only exposes vars prefixed VITE_, and
// only via import.meta.env (not process.env).
// -----------------------------------------------------------------------

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
};

if (!env.firebase.apiKey) {
  // A warning (not a hard crash) - lets the app still load for UI
  // development even before Firebase credentials are wired up.
  // eslint-disable-next-line no-console
  console.warn('[NOVA AI] Firebase env vars are missing - authentication will not work until .env is configured.');
}
