// vectorstore/pdfIngestService.js
// -----------------------------------------------------------------------
// The actual ingestion pipeline: parse -> clean -> chunk -> embed ->
// store -> mark ready. Runs asynchronously after upload (kicked off by
// pdfController.js) so the HTTP response isn't blocked on what can be a
// slow, multi-step process for a large PDF. PdfDocument.status is
// updated at each stage so the frontend can poll for progress.
// -----------------------------------------------------------------------

import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { PdfDocument } from '../models/PdfDocument.js';
import { splitTextIntoChunks, cleanExtractedPdfText } from '../utils/textSplitter.js';
import { embedDocumentChunks } from './embeddingService.js';
import { addChunksToCollection } from './chromaClient.js';
import { generateOnce } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';

// Gemini's batchEmbedContents accepts at most 100 requests per call -
// staying under that with a safety margin rather than hitting the
// exact limit.
const EMBEDDING_BATCH_SIZE = 90;

const chunkArray = (array, size) => {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
};

/**
 * Runs the full ingestion pipeline for an already-created PdfDocument
 * record (status starts as 'processing', set at upload time).
 * @param {string} pdfDocumentId
 */
export const ingestPdf = async (pdfDocumentId) => {
  const pdfDoc = await PdfDocument.findById(pdfDocumentId);
  if (!pdfDoc) {
    logger.error(`ingestPdf: PdfDocument ${pdfDocumentId} not found`);
    return;
  }

  try {
    const buffer = await fs.readFile(pdfDoc.storagePath);
    const parser = new PDFParse({ data: buffer });
    const { text: rawText } = await parser.getText();
    const cleanedText = cleanExtractedPdfText(rawText);

    if (!cleanedText) {
      throw new Error('No extractable text found in this PDF - it may be scanned images without OCR text.');
    }

    const chunks = splitTextIntoChunks(cleanedText);

    // Embed in batches rather than one giant call, respecting Gemini's
    // per-request batch limit.
    const embeddings = [];
    for (const batch of chunkArray(chunks, EMBEDDING_BATCH_SIZE)) {
      const batchEmbeddings = await embedDocumentChunks(batch);
      embeddings.push(...batchEmbeddings);
    }

    await addChunksToCollection(pdfDoc.chromaCollectionName, {
      ids: chunks.map((_, i) => `${pdfDoc._id}-chunk-${i}`),
      embeddings,
      documents: chunks,
      metadatas: chunks.map((_, i) => ({ chunkIndex: i, pdfDocumentId: pdfDoc._id.toString() })),
    });

    // Short summary from the first portion of the document - cheap and
    // fast, good enough for a document-list preview (full RAG answers
    // come from pdfTool.js's similarity search, not this summary).
    let summary = '';
    try {
      summary = await generateOnce(
        `Summarise this document in 2-3 sentences:\n\n${cleanedText.slice(0, 3000)}`
      );
    } catch {
      // Summary is a nice-to-have, not required for the document to be usable.
    }

    pdfDoc.status = 'ready';
    pdfDoc.chunkCount = chunks.length;
    pdfDoc.summary = summary.trim();
    await pdfDoc.save();

    logger.info(`PDF ${pdfDoc._id} ingested successfully: ${chunks.length} chunks`);
  } catch (error) {
    logger.error(`PDF ingestion failed for ${pdfDocumentId}: ${error.message}`);
    pdfDoc.status = 'failed';
    pdfDoc.errorMessage = error.message;
    await pdfDoc.save();
  }
};
