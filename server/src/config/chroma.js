// config/chroma.js
// -----------------------------------------------------------------------
// ChromaDB's client API (v3+) takes { host, port, ssl } rather than a
// single URL string (the old `path` option still exists but is
// deprecated) - this parses our single CHROMA_URL env var into that
// shape once, so the rest of the app can keep using one simple URL in
// .env without needing to know about the client's internal argument shape.
// -----------------------------------------------------------------------

import { ChromaClient } from 'chromadb';
import { env } from './env.js';

const parsedUrl = new URL(env.chromaUrl);

export const chromaClient = new ChromaClient({
  host: parsedUrl.hostname,
  port: parsedUrl.port ? Number(parsedUrl.port) : 8000,
  ssl: parsedUrl.protocol === 'https:',
});
