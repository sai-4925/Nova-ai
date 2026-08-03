// vite.config.js
// -----------------------------------------------------------------------
// Standard Vite + React setup. Dev server runs on 5173 to match
// CLIENT_URL in the backend's .env (CORS origin must match exactly).
// -----------------------------------------------------------------------

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
