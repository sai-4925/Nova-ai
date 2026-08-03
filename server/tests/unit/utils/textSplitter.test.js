// tests/unit/utils/textSplitter.test.js
import { describe, it, expect } from '@jest/globals';
import { splitTextIntoChunks, cleanExtractedPdfText } from '../../../src/utils/textSplitter.js';

describe('cleanExtractedPdfText', () => {
  it('strips pdf-parse page-separator artifacts', () => {
    const raw = 'Hello World\n\n-- 1 of 2 --\n\nMore content here.\n\n-- 2 of 2 --\n\n';
    const cleaned = cleanExtractedPdfText(raw);
    expect(cleaned).not.toContain('-- 1 of 2 --');
    expect(cleaned).not.toContain('-- 2 of 2 --');
    expect(cleaned).toContain('Hello World');
    expect(cleaned).toContain('More content here.');
  });
});

describe('splitTextIntoChunks', () => {
  it('returns a single chunk for short text', () => {
    expect(splitTextIntoChunks('A short sentence.', 1000, 150)).toHaveLength(1);
  });

  it('returns no chunks for empty text', () => {
    expect(splitTextIntoChunks('')).toEqual([]);
  });

  it('loses no content across chunk boundaries and produces overlap', () => {
    const longText = Array.from({ length: 50 }, (_, i) => `This is sentence number ${i}.`).join(' ');
    const chunks = splitTextIntoChunks(longText, 300, 50);

    expect(chunks.length).toBeGreaterThan(1);

    const allSentencesPresent = Array.from({ length: 50 }, (_, i) => `sentence number ${i}.`).every((sentence) =>
      chunks.some((chunk) => chunk.includes(sentence))
    );
    expect(allSentencesPresent).toBe(true);
  });
});
