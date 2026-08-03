// src/utils/wakeWordDetector.test.js
import { describe, it, expect } from 'vitest';
import { containsWakeWord, extractCommandAfterWakeWord } from './wakeWordDetector.js';

describe('containsWakeWord', () => {
  it.each([
    ['hey nova what is the weather today', true],
    ['Nova, set a reminder for 6pm', true],
    ['okay nova', true],
    ['NOVA open chrome', true],
    ['what a nice day', false],
    ['', false],
  ])('containsWakeWord(%j) === %j', (input, expected) => {
    expect(containsWakeWord(input)).toBe(expected);
  });
});

describe('extractCommandAfterWakeWord', () => {
  it('extracts the command following the wake word', () => {
    expect(extractCommandAfterWakeWord('hey nova what is the weather today')).toBe('what is the weather today');
  });

  it('returns an empty string when the wake word is said alone', () => {
    expect(extractCommandAfterWakeWord('okay nova')).toBe('');
  });

  it('prefers the longest matching alias so no stray words remain', () => {
    // "hey nova" should match before the shorter "nova" alias, so "hey"
    // never leaks into the extracted command.
    expect(extractCommandAfterWakeWord('hey nova open chrome')).toBe('open chrome');
  });

  it('handles punctuation and case variations', () => {
    expect(extractCommandAfterWakeWord('NOVA, open chrome!')).toBe('open chrome');
  });
});
