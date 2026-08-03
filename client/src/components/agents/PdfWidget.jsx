// src/components/agents/PdfWidget.jsx
// -----------------------------------------------------------------------
// Upload responds immediately with status 'processing' (Module 15's
// design - ingestion runs async server-side). This widget polls the
// list endpoint every few seconds while ANY document is still
// processing, so the status visibly flips to 'ready' without the user
// needing to refresh the page.
// -----------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import * as pdfApi from '../../services/pdfApi.js';
import { Card } from '../common/Card.jsx';
import { Loader } from '../common/Loader.jsx';

const STATUS_STYLES = {
  processing: 'text-nova-amber',
  ready: 'text-signal-violet',
  failed: 'text-red-400',
};

export const PdfWidget = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await pdfApi.listPdfs();
      setDocuments(data.data.documents);
    } catch {
      setError('Could not load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, []);

  // Poll while anything is still processing - stop once everything has
  // settled into 'ready' or 'failed', rather than polling forever.
  useEffect(() => {
    const anyProcessing = documents.some((d) => d.status === 'processing');
    clearInterval(pollRef.current);
    if (anyProcessing) {
      pollRef.current = setInterval(load, 4000);
    }
    return () => clearInterval(pollRef.current);
  }, [documents]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      await pdfApi.uploadPdf(file);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // allow re-selecting the same file later
    }
  };

  const handleDelete = async (id) => {
    await pdfApi.deletePdf(id);
    setDocuments((prev) => prev.filter((d) => d._id !== id));
  };

  return (
    <Card
      title="PDF Documents"
      action={
        <>
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs font-medium text-nova-amber hover:text-nova-amber-bright disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : '+ Upload'}
          </button>
        </>
      }
    >
      {isLoading ? (
        <Loader label="Loading documents..." />
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-ink-faint">No documents uploaded yet. Ask Nova questions about a PDF once it's ready.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc._id} className="rounded-lg bg-surface-raised px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="truncate text-ink">{doc.originalName}</p>
                <button onClick={() => handleDelete(doc._id)} className="text-ink-faint hover:text-red-400" aria-label={`Delete ${doc.originalName}`}>
                  ✕
                </button>
              </div>
              <p className={`text-xs font-mono ${STATUS_STYLES[doc.status]}`}>{doc.status}</p>
              {doc.summary && <p className="mt-1 text-xs text-ink-muted">{doc.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
