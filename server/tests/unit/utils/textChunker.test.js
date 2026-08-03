// tests/unit/utils/textChunker.test.js
import { describe, it, expect } from '@jest/globals';
import { chunkTextForStreaming } from '../../../src/utils/textChunker.js';

describe('chunkTextForStreaming', () => {
  it('reassembles to exactly the original text', () => {
    const original = 'It is 28 degrees and sunny in Delhi right now.';
    const chunks = chunkTextForStreaming(original, 3);
    expect(chunks.join('')).toBe(original);
  });

  it('returns no chunks for empty input', () => {
    expect(chunkTextForStreaming('')).toEqual([]);
  });

  it('handles text shorter than one chunk', () => {
    const chunks = chunkTextForStreaming('Hi', 3);
    expect(chunks.join('')).toBe('Hi');
  });

  it('produces more than one chunk for long text', () => {
    const longText = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const chunks = chunkTextForStreaming(longText, 3);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe(longText);
  });
});
