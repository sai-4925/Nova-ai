// tests/unit/agents/responseNode.test.js
import { describe, it, expect } from '@jest/globals';
import { buildSystemInstructionWithMemories } from '../../../src/agents/nodes/responseNode.js';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../../../src/services/geminiService.js';

describe('buildSystemInstructionWithMemories', () => {
  it('returns the plain default instruction when there are no recalled memories', () => {
    expect(buildSystemInstructionWithMemories([])).toBe(DEFAULT_SYSTEM_INSTRUCTION);
  });

  it('preserves the default instruction and appends recalled facts', () => {
    const result = buildSystemInstructionWithMemories(['Prefers vegetarian food.', 'Working on a project called Nova AI.']);

    expect(result).toContain(DEFAULT_SYSTEM_INSTRUCTION);
    expect(result).toContain('Prefers vegetarian food.');
    expect(result).toContain('Working on a project called Nova AI.');
    expect(result.toLowerCase()).toContain("don't force them in");
  });
});
