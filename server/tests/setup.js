// tests/setup.js
// -----------------------------------------------------------------------
// Runs before every test file. Two real risks this prevents:
//   1. config/env.js calls process.exit(1) if required vars (MONGO_URI,
//      JWT_SECRET, GEMINI_API_KEY) are missing - that would abruptly
//      kill the ENTIRE test run, not just fail one test.
//   2. config/firebase.js's admin.credential.cert() throws immediately
//      on a malformed private key - a placeholder string isn't enough,
//      it needs to actually parse as PEM, so we generate a real
//      (disposable, test-only) RSA keypair here.
// -----------------------------------------------------------------------

import { generateKeyPairSync } from 'crypto';

process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nova-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-only-gemini-key';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@test-project.iam.gserviceaccount.com';

if (!process.env.FIREBASE_PRIVATE_KEY) {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  process.env.FIREBASE_PRIVATE_KEY = privateKey;
}
