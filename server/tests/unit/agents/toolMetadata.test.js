// tests/unit/agents/toolMetadata.test.js
import { describe, it, expect } from '@jest/globals';
import { buildToolMetadataForMessage } from '../../../src/agents/graph/toolMetadata.js';

describe('buildToolMetadataForMessage', () => {
  it('returns all-null fields for an empty toolResults array (general route)', () => {
    const result = buildToolMetadataForMessage([]);
    expect(result).toEqual({ toolName: null, toolInput: null, toolOutput: null });
  });

  it('maps a single tool result correctly', () => {
    const result = buildToolMetadataForMessage([{ tool: 'weather', input: { city: 'Delhi' }, output: '28C and sunny' }]);
    expect(result.toolName).toBe('weather');
    expect(result.toolInput).toEqual({ weather: { city: 'Delhi' } });
    expect(result.toolOutput).toEqual({ weather: '28C and sunny' });
  });

  it('joins multiple tool results (the multi-tool loop-back case)', () => {
    const result = buildToolMetadataForMessage([
      { tool: 'weather', input: { city: 'Delhi' }, output: '28C and sunny' },
      { tool: 'email', input: { recipient: 'mom' }, output: 'Emailed mom the forecast' },
    ]);
    expect(result.toolName).toBe('weather,email');
    expect(result.toolInput).toEqual({ weather: { city: 'Delhi' }, email: { recipient: 'mom' } });
    expect(result.toolOutput).toEqual({ weather: '28C and sunny', email: 'Emailed mom the forecast' });
  });
});
