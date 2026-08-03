// models/User.js
// -----------------------------------------------------------------------
// Core user identity record.
//
// IMPORTANT: This app does NOT store or hash passwords. Firebase
// Authentication handles credential verification (email/password,
// Google login, etc). This model exists only to:
//   1. Link a Firebase-verified identity to our own app data
//      (conversations, reminders, events, pdfs all reference User._id)
//   2. Store app-specific preferences that Firebase doesn't hold
//      (voice settings, wake word toggle, timezone, etc.)
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true, // one Mongo user per Firebase identity
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    // How the user signed up - Firebase supports both under one
    // account, but this tracks which flow was used most recently.
    authProvider: {
      type: String,
      enum: ['password', 'google'],
      default: 'password',
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    // App-specific preferences - not part of Firebase's own profile
    preferences: {
      wakeWordEnabled: { type: Boolean, default: true },
      voiceName: { type: String, default: 'default' }, // maps to a SpeechSynthesis voice
      timezone: { type: String, default: 'Asia/Kolkata' },
      theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    },
    // Third-party agent connection status (tokens themselves are stored
    // encrypted in a separate collection in a later module, never here).
    integrations: {
      googleCalendarConnected: { type: Boolean, default: false },
      gmailConnected: { type: Boolean, default: false },
      whatsappConnected: { type: Boolean, default: false },
    },
    // Google OAuth refresh token for Calendar/Gmail agents (Modules 13/16).
    // select: false so it's never returned by default queries - callers
    // must explicitly .select('+googleRefreshToken') when they actually
    // need it (see googleAuthService.js).
    googleRefreshToken: {
      type: String,
      select: false,
    },
    // A dedicated pairing secret for the System Agent's local companion
    // app (Module 19) - deliberately SEPARATE from the JWT session token,
    // which expires/rotates on every login. This token is copied ONCE
    // into the companion app's local config and stays stable, so
    // re-logging into the web app doesn't disconnect the companion.
    systemAgentToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
