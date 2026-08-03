// controllers/pdfController.js
// -----------------------------------------------------------------------
// Upload responds IMMEDIATELY with status 'processing' - ingestion
// (parse/chunk/embed/store) runs asynchronously afterward via
// vectorstore/pdfIngestService.js, since a large PDF could take longer
// than a client wants to wait on a single HTTP request. The frontend is
// expected to poll GET /api/pdf or re-fetch until status becomes 'ready'.
// -----------------------------------------------------------------------

import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { PdfDocument } from '../models/PdfDocument.js';
import { ingestPdf } from '../vectorstore/pdfIngestService.js';
import { deleteCollection } from '../vectorstore/chromaClient.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// POST /api/pdf/upload  (multipart/form-data, field name "pdf" - see uploadMiddleware.js)
export const uploadPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No PDF file was uploaded.');
  }

  const pdfDoc = await PdfDocument.create({
    userId: req.user._id,
    originalName: req.file.originalname,
    storagePath: req.file.path,
    // One Chroma collection per document (Module 3's design) - a
    // random suffix avoids any collision even for repeat uploads of
    // the same filename by the same user.
    chromaCollectionName: `pdf_${req.user._id}_${randomUUID().slice(0, 8)}`,
    status: 'processing',
  });

  // Fire-and-forget: don't block the upload response on the full
  // parse/embed/store pipeline. Errors inside are caught and written
  // to pdfDoc.status/errorMessage by ingestPdf itself.
  ingestPdf(pdfDoc._id).catch((error) => {
    logger.error(`Unexpected error in PDF ingestion background task: ${error.message}`);
  });

  new ApiResponse(202, { document: pdfDoc }, 'PDF uploaded - processing has started').send(res);
});

// GET /api/pdf
export const listPdfs = asyncHandler(async (req, res) => {
  const documents = await PdfDocument.find({ userId: req.user._id }).sort({ createdAt: -1 });
  new ApiResponse(200, { documents }).send(res);
});

// DELETE /api/pdf/:id
export const deletePdf = asyncHandler(async (req, res) => {
  const document = await PdfDocument.findOne({ _id: req.params.id, userId: req.user._id });
  if (!document) {
    throw ApiError.notFound('Document not found');
  }

  // Clean up all three places this document's data lives: the vector
  // collection, the file on disk, and the Mongo record itself - a
  // partial cleanup would leave orphaned data behind.
  try {
    await deleteCollection(document.chromaCollectionName);
  } catch (error) {
    logger.warn(`Could not delete Chroma collection ${document.chromaCollectionName}: ${error.message}`);
  }
  try {
    await fs.unlink(document.storagePath);
  } catch (error) {
    logger.warn(`Could not delete file ${document.storagePath}: ${error.message}`);
  }
  await document.deleteOne();

  new ApiResponse(200, null, 'Document deleted').send(res);
});
