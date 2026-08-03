// middleware/uploadMiddleware.js
// -----------------------------------------------------------------------
// Multer config for PDF uploads. Stores to local disk under ./uploads -
// simplest free option for now. PRODUCTION NOTE (flagged for the
// deployment module): Render's disk is EPHEMERAL - files don't survive
// a redeploy/restart. For production, swap `destination` for an
// upload to free-tier object storage (e.g. Supabase Storage,
// Cloudflare R2's free tier) instead of local disk - the rest of this
// module (ingestPdf reading via fs.readFile) would need storagePath to
// become a fetchable URL at that point.
// -----------------------------------------------------------------------

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

const UPLOAD_DIR = path.resolve('uploads', 'pdfs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Prefix with a timestamp to avoid collisions between different
    // users uploading files with the same original name.
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    cb(ApiError.badRequest('Only PDF files are supported.'));
    return;
  }
  cb(null, true);
};

export const uploadPdfMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB - generous for a personal-assistant use case, bounded to protect free-tier disk/memory
}).single('pdf');
