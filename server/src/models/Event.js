// models/Event.js
// -----------------------------------------------------------------------
// Calendar events with a start/end range, optionally synced to the
// user's real Google Calendar. Kept separate from Reminder because:
//   - Events have duration (startTime -> endTime), reminders don't
//   - Events can carry a googleEventId for two-way sync; reminders
//     never touch Google Calendar at all
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    // If this event was created/synced via Google Calendar API, this
    // holds Google's own event ID so the Calendar Node can update or
    // delete the SAME event on both sides instead of creating duplicates.
    googleEventId: {
      type: String,
      default: null,
      index: true,
    },
    // Whether this event only exists locally (not yet pushed to Google
    // Calendar) - relevant if the user hasn't connected their Google
    // account, or if the sync call failed.
    syncStatus: {
      type: String,
      enum: ['local-only', 'synced', 'sync-failed'],
      default: 'local-only',
    },
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, startTime: 1 });

export const Event = mongoose.model('Event', eventSchema);
