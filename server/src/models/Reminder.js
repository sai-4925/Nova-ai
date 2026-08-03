// models/Reminder.js
// -----------------------------------------------------------------------
// Single point-in-time reminders ("remind me to call mom at 6pm").
// Kept separate from Event: reminders have no duration and never sync
// to Google Calendar - they're purely internal notifications the
// Reminder Node creates/lists/deletes.
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true, // a scheduled job scans "reminders due soon" by this field
    },
    // Optional recurrence rule ("daily", "weekly") - kept as a simple
    // enum for v1 rather than a full RRULE parser, which would be
    // over-engineering for a personal assistant's reminder list.
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // How the reminder was created - useful for the UI to show
    // a mic icon vs. a typed-text icon.
    createdVia: {
      type: String,
      enum: ['voice', 'text'],
      default: 'text',
    },
  },
  { timestamps: true }
);

reminderSchema.index({ userId: 1, remindAt: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
