// tests/unit/agents/routeConsistency.test.js
// -----------------------------------------------------------------------
// Guards against exactly the kind of silent drift that's easy to
// introduce when adding a new route later: updating the Planner's
// prompt/AVAILABLE_ROUTES without also updating graph.js's routeMap
// (or vice versa) would misroute silently at runtime with no error.
// -----------------------------------------------------------------------

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { AVAILABLE_ROUTES } from '../../../src/agents/prompts/plannerPrompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Planner routes vs graph.js routeMap', () => {
  it('every AVAILABLE_ROUTES entry has a matching routeMap entry in graph.js', () => {
    const graphSource = readFileSync(path.resolve(__dirname, '../../../src/agents/graph/graph.js'), 'utf-8');
    const routeMapMatch = graphSource.match(/const routeMap = \{([^}]+)\}/);
    expect(routeMapMatch).not.toBeNull();

    const routeMapKeys = [...routeMapMatch[1].matchAll(/(\w+):/g)].map((m) => m[1]);
    const missing = AVAILABLE_ROUTES.filter((route) => !routeMapKeys.includes(route));

    expect(missing).toEqual([]);
  });
});
