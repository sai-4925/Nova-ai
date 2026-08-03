// tools/emailTool.js
// -----------------------------------------------------------------------
// sendEmailTool is a PLAIN tool (like weatherTool.js) - it sends from
// the one shared configured account to any recipient, so there's no
// user-scoped data to protect via the factory pattern.
//
// readRecentEmailsTool and summarizeRecentEmailsTool ARE factory-bound
// to userId (like reminderTool.js/calendarTool.js) - these access a
// SPECIFIC user's private Gmail inbox via their own OAuth grant, so
// userId must come from trusted state, never an LLM-fillable field.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { sendEmail } from '../services/emailService.js';
import { getAuthenticatedClientForUser } from '../services/googleAuthService.js';
import { listRecentEmails } from '../services/gmailReadService.js';
import { generateOnce } from '../services/geminiService.js';

export const sendEmailTool = tool(
  async ({ to, subject, body }) => {
    await sendEmail({ to, subject, body });
    return `Email sent to ${to}.`;
  },
  {
    name: 'send_email',
    description: 'Sends an email to a specific email address.',
    schema: z.object({
      to: z.string().describe("The recipient's email address - must be an actual address, not just a name"),
      subject: z.string().describe('The email subject line'),
      body: z.string().describe('The email message body'),
    }),
  }
);

/** @param {string} userId */
export const readRecentEmailsTool = (userId) =>
  tool(
    async ({ count }) => {
      const client = await getAuthenticatedClientForUser(userId);
      const emails = await listRecentEmails(client, count || 5);
      if (emails.length === 0) return 'Your inbox has no recent messages.';
      return emails.map((e) => `- From ${e.from}: "${e.subject}" (${e.date})`).join('\n');
    },
    {
      name: 'read_recent_emails',
      description:
        "Lists the current user's most recent inbox emails (sender, subject, date) without summarising content.",
      schema: z.object({ count: z.number().optional().describe('How many recent emails to list, default 5') }),
    }
  );

/** @param {string} userId */
export const summarizeRecentEmailsTool = (userId) =>
  tool(
    async ({ count }) => {
      const client = await getAuthenticatedClientForUser(userId);
      const emails = await listRecentEmails(client, count || 5);
      if (emails.length === 0) return 'Your inbox has no recent messages to summarise.';

      const emailBlock = emails
        .map((e, i) => `[${i + 1}] From: ${e.from}\nSubject: ${e.subject}\nBody: ${e.body}`)
        .join('\n\n');

      const prompt = `Summarise these ${emails.length} recent emails into a short digest, one line per email:\n\n${emailBlock}`;
      return generateOnce(prompt);
    },
    {
      name: 'summarize_recent_emails',
      description: "Reads and summarises the current user's most recent inbox emails into a short digest.",
      schema: z.object({ count: z.number().optional().describe('How many recent emails to summarise, default 5') }),
    }
  );
