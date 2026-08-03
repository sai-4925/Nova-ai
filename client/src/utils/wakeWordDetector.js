// src/utils/wakeWordDetector.js
// -----------------------------------------------------------------------
// Pure functions, deliberately with ZERO dependency on the Web Speech
// API - this is what lets us unit test wake-word logic in plain Node
// without a browser, and keeps VoiceContext free of string-matching
// details.
// -----------------------------------------------------------------------

const DEFAULT_WAKE_WORD = 'nova';

// Common misrecognitions of "Nova" from speech-to-text engines - treated
// as equivalent so the assistant doesn't feel unreliable over a
// transcription quirk.
const WAKE_WORD_ALIASES = ['nova', 'hey nova', 'ok nova', 'okay nova'];

const normalise = (text) => text.toLowerCase().trim().replace(/[.,!?]/g, '');

/**
 * Returns true if the transcript contains the wake word (or a common
 * alias like "hey nova").
 * @param {string} transcript
 */
export const containsWakeWord = (transcript) => {
  const normalised = normalise(transcript);
  return WAKE_WORD_ALIASES.some((alias) => normalised.includes(alias));
};

/**
 * Extracts whatever the user said AFTER the wake word in the same
 * utterance (e.g. "Hey Nova what's the weather" -> "what's the weather").
 * Returns an empty string if the wake word was said alone.
 * @param {string} transcript
 */
export const extractCommandAfterWakeWord = (transcript) => {
  const normalised = normalise(transcript);

  // Try the longest alias first ("hey nova" before "nova") so we don't
  // accidentally leave a stray "hey" at the start of the command.
  const sortedAliases = [...WAKE_WORD_ALIASES].sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    const index = normalised.indexOf(alias);
    if (index !== -1) {
      return normalised.slice(index + alias.length).trim();
    }
  }
  return '';
};

export const WAKE_WORD = DEFAULT_WAKE_WORD;
