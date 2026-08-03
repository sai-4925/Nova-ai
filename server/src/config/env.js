// config/env.js
// -----------------------------------------------------------------------
// Loads and validates environment variables ONCE at startup.
// Every other file imports `env` from here instead of touching
// `process.env` directly. This gives us:
//   1. A single source of truth
//   2. Fail-fast behaviour (missing var => crash at boot, not mid-request)
//   3. Autocomplete-friendly config object
// -----------------------------------------------------------------------

import dotenv from 'dotenv';

dotenv.config();

// List every variable the server absolutely cannot run without.
// Third-party agent keys (weather, search, etc.) are intentionally NOT
// required here - those agents should degrade gracefully if their own
// key is missing (handled inside each service/tool).
const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Fail fast: it is better to crash on boot with a clear message
    // than to fail confusingly on the first request.
    // eslint-disable-next-line no-console
    console.error(`[ENV ERROR] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateEnv();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Firebase private keys are stored with literal "\n" in .env files;
    // they must be converted back to real newlines before use.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',

  email: {
    user: process.env.EMAIL_USER,
    appPassword: process.env.EMAIL_APP_PASSWORD,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,

  googleSearch: {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    engineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
  },

  whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
  whatsappSessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session',

  isProduction: process.env.NODE_ENV === 'production',
};
