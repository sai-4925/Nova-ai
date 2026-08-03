// utils/textChunker.js
// -----------------------------------------------------------------------
// Pure function, no HTTP/SSE knowledge - splits a complete string of text
// into small word-batches so the chat controller can replay a
// non-streamed graph result over the SAME SSE 'chunk' event contract
// the frontend already expects (Module 5/7), preserving the live
// "typing" effect without requiring any frontend changes.
// -----------------------------------------------------------------------

/**
 * @param {string} text
 * @param {number} [wordsPerChunk] - larger = fewer, chunkier updates; smaller = smoother typing effect
 * @returns {string[]} chunks, each ending with a trailing space except the last
 */
export const chunkTextForStreaming = (text, wordsPerChunk = 3) => {
  if (!text) return [];

  const words = text.split(' ');
  const chunks = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const slice = words.slice(i, i + wordsPerChunk).join(' ');
    // Preserve a trailing space so words don't visually run together
    // when the client appends each chunk directly - except the very
    // last chunk, which shouldn't have trailing whitespace.
    const isLast = i + wordsPerChunk >= words.length;
    chunks.push(isLast ? slice : `${slice} `);
  }

  return chunks;
};
