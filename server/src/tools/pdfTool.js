// tools/pdfTool.js
// -----------------------------------------------------------------------
// Same trusted-factory pattern as reminderTool.js/calendarTool.js:
// userId is bound at creation time so a user can only ever query their
// OWN uploaded documents, never one supplied by the LLM.
//
// Document disambiguation follows the same "ask, don't guess" principle
// used throughout: if the user has multiple ready PDFs and didn't name
// one, list them and ask rather than picking one arbitrarily.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PdfDocument } from '../models/PdfDocument.js';
import { embedQuery } from '../vectorstore/embeddingService.js';
import { querySimilarChunks } from '../vectorstore/chromaClient.js';
import { generateOnce } from '../services/geminiService.js';

const buildRagPrompt = (documentTitle, excerpts, question) => `
Answer the question using ONLY the excerpts below from the document "${documentTitle}".
If the excerpts don't contain enough information to answer, say so honestly rather than guessing.

Excerpts:
${excerpts.map((e, i) => `[${i + 1}] ${e}`).join('\n\n')}

Question: ${question}
`.trim();

/** @param {string} userId */
export const pdfQueryTool = (userId) =>
  tool(
    async ({ query, documentTitle }) => {
      const readyDocs = await PdfDocument.find({ userId, status: 'ready' });

      if (readyDocs.length === 0) {
        return "You don't have any processed PDF documents yet - upload one first.";
      }

      let targetDoc;
      if (documentTitle) {
        const lowerTitle = documentTitle.toLowerCase();
        const matches = readyDocs.filter((d) => d.originalName.toLowerCase().includes(lowerTitle));
        if (matches.length === 0) {
          return `I couldn't find a document matching "${documentTitle}". Your documents: ${readyDocs
            .map((d) => d.originalName)
            .join(', ')}.`;
        }
        if (matches.length > 1) {
          return `Multiple documents match "${documentTitle}", please be more specific: ${matches
            .map((d) => d.originalName)
            .join(', ')}.`;
        }
        [targetDoc] = matches;
      } else if (readyDocs.length === 1) {
        [targetDoc] = readyDocs;
      } else {
        return `Which document do you mean? You have: ${readyDocs.map((d) => d.originalName).join(', ')}.`;
      }

      const queryEmbedding = await embedQuery(query);
      const excerpts = await querySimilarChunks(targetDoc.chromaCollectionName, queryEmbedding, 4);

      if (excerpts.length === 0) {
        return `I couldn't find anything relevant to that in "${targetDoc.originalName}".`;
      }

      const prompt = buildRagPrompt(targetDoc.originalName, excerpts, query);
      return generateOnce(prompt);
    },
    {
      name: 'query_pdf_document',
      description: "Answers a question using the content of one of the current user's uploaded PDF documents.",
      schema: z.object({
        query: z.string().describe("The user's question about the document"),
        documentTitle: z.string().optional().describe('A hint about which document, if the user named one'),
      }),
    }
  );
