// vitest.config.js
// -----------------------------------------------------------------------
// Minimal config - these are pure-function unit tests (wake word
// detection, SSE frame parsing), no component rendering needed, so no
// jsdom environment or React Testing Library setup is required yet.
// -----------------------------------------------------------------------

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
