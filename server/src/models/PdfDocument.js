// models/PdfDocument.js
// -----------------------------------------------------------------------
// Tracks the METADATA of an uploaded PDF. The actual vector embeddings
// live in ChromaDB, not here - MongoDB is not built for similarity
// search, and duplicating vectors here would be wasted storage plus a
// second source of truth to keep in sync.
//
// This model is what the PDF Node checks before answering a RAG query:
// it looks up which Chroma collection holds this document's chunks and
// confirms the document has finished processing (status === 'ready').
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const pdfDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    // Where the raw file is stored (local disk in dev, or a free-tier
    // object storage bucket in production - see deployment guide).
    storagePath: {
      type: String,
      required: true,
    },
    // The name of the Chroma collection holding this document's chunk
    // embeddings. One collection per document keeps RAG queries scoped
    // to a single PDF instead of searching across a user's entire library
    // unless explicitly asked to.
    chromaCollectionName: {
      type: String,
      required: true,
      unique: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    // Ingestion is async (parse -> chunk -> embed -> store), so the
    // frontend polls this field to show a progress state instead of
    // blocking the upload request until embeddings finish.
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    // A short Gemini-generated summary shown in the document list,
    // so the user doesn't have to open a chat just to remember what
    // a PDF was about.
    summary: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const PdfDocument = mongoose.model('PdfDocument', pdfDocumentSchema);
