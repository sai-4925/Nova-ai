// utils/textSplitter.js
// -----------------------------------------------------------------------
// Pure function, no PDF/embedding/network dependency - splits a long
// text into overlapping chunks suitable for embedding. Overlap (not
// just hard cuts) matters for RAG quality: a fact split exactly at a
// chunk boundary would otherwise become unretrievable from either
// chunk alone.
// -----------------------------------------------------------------------

/**
 * @param {string} text
 * @param {number} [chunkSize] - target characters per chunk
 * @param {number} [overlap] - characters repeated between consecutive chunks
 * @returns {string[]}
 */
export const splitTextIntoChunks = (text, chunkSize = 1000, overlap = 150) => {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    let sliceEnd = end;

    // Prefer breaking on a sentence/paragraph boundary near the target
    // end, rather than mid-word - improves how coherent each embedded
    // chunk is. Only applies if we're not already at the text's end.
    if (end < cleaned.length) {
      const lastBreak = cleaned.lastIndexOf('. ', end);
      if (lastBreak > start + chunkSize * 0.5) {
        sliceEnd = lastBreak + 1;
      }
    }

    chunks.push(cleaned.slice(start, sliceEnd).trim());

    if (sliceEnd >= cleaned.length) break;
    start = sliceEnd - overlap;
  }

  return chunks.filter(Boolean);
};

/**
 * Strips pdf-parse's page-separator artifacts (e.g. "-- 1 of 3 --")
 * from extracted text before chunking, so they don't pollute embeddings
 * or get surfaced in an answer.
 * @param {string} rawText
 */
export const cleanExtractedPdfText = (rawText) => {
  return rawText
    .replace(/^--\s*\d+\s*of\s*\d+\s*--$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
