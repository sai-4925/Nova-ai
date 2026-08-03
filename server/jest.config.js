// jest.config.js
// -----------------------------------------------------------------------
// Native ESM support (no Babel transform needed, since the whole
// backend already uses "type": "module"). Run via:
//   node --experimental-vm-modules node_modules/.bin/jest
// (already wired as the "test" script in package.json - Jest's ESM
// support is still experimental as of this Jest version, hence the flag).
// -----------------------------------------------------------------------

/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/config/**'],
  verbose: true,
};
