// services/emailService.js
// -----------------------------------------------------------------------
// SENDING only - uses a single shared Gmail account (Nodemailer + app
// password from env.email), not per-user OAuth. Every email Nova sends
// comes from this one address, deliberately kept simple and free
// (matches the original .env design from Module 2). Reading a USER'S
// OWN inbox is a separate concern, handled by gmailReadService.js via
// per-user OAuth - sending and reading are different enough
// permission-wise that combining them into one file would blur two
// distinct trust boundaries.
// -----------------------------------------------------------------------

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let transporter = null;

const getTransporter = () => {
  if (!env.email.user || !env.email.appPassword) {
    throw ApiError.internal('Email Agent is not configured - EMAIL_USER and EMAIL_APP_PASSWORD are required.');
  }
  // Lazily created and reused across calls rather than per-send, since
  // creating a transporter has some overhead and the config never changes.
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.email.user, pass: env.email.appPassword },
    });
  }
  return transporter;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {{ to: string, subject: string, body: string }} params
 */
export const sendEmail = async ({ to, subject, body }) => {
  if (!to || !EMAIL_REGEX.test(to)) {
    throw ApiError.badRequest(`"${to}" doesn't look like a valid email address.`);
  }
  if (!subject || !body) {
    throw ApiError.badRequest('Both a subject and a message body are required.');
  }

  const mailer = getTransporter();
  try {
    await mailer.sendMail({ from: env.email.user, to, subject, text: body });
  } catch (error) {
    throw ApiError.internal(`Failed to send the email: ${error.message}`);
  }
};
