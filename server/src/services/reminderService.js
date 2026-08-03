// services/reminderService.js
// -----------------------------------------------------------------------
// Pure persistence logic - every function is scoped by userId so one
// user can never read/modify another's reminders (IDOR protection),
// matching the ownership pattern from chatService.js's
// getOwnedConversation.
// -----------------------------------------------------------------------

import { Reminder } from '../models/Reminder.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @param {{ userId: string, title: string, remindAt: Date|string, recurrence?: string, createdVia?: 'voice'|'text' }} params
 */
export const createReminder = async ({ userId, title, remindAt, recurrence = 'none', createdVia = 'text' }) => {
  const parsedDate = new Date(remindAt);
  if (Number.isNaN(parsedDate.getTime())) {
    throw ApiError.badRequest(`"${remindAt}" isn't a date/time I could understand.`);
  }
  if (parsedDate.getTime() < Date.now()) {
    throw ApiError.badRequest('That time is in the past - please give me a future date and time.');
  }

  return Reminder.create({ userId, title, remindAt: parsedDate, recurrence, createdVia });
};

/**
 * Lists a user's upcoming, not-yet-completed reminders, soonest first.
 * @param {string} userId
 * @param {number} [limit]
 */
export const listUpcomingReminders = async (userId, limit = 10) => {
  return Reminder.find({ userId, isCompleted: false, remindAt: { $gte: new Date() } })
    .sort({ remindAt: 1 })
    .limit(limit);
};

/**
 * Fuzzy-matches reminders by title substring (case-insensitive) - voice
 * commands like "delete my reminder to call mom" won't carry a Mongo
 * ID, so deletion works by matching what the user actually said.
 * @param {string} userId
 * @param {string} titleQuery
 */
export const findRemindersByTitleQuery = async (userId, titleQuery) => {
  // Escape regex special characters in user input before building a
  // RegExp - otherwise a title query like "6pm (call)" could throw or
  // behave unexpectedly as a regex pattern.
  const escaped = titleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Reminder.find({ userId, isCompleted: false, title: { $regex: escaped, $options: 'i' } }).sort({
    remindAt: 1,
  });
};

/**
 * Deletes a reminder by its exact Mongo ID, verifying ownership first.
 * @param {string} userId
 * @param {string} reminderId
 */
export const deleteReminderById = async (userId, reminderId) => {
  const reminder = await Reminder.findOne({ _id: reminderId, userId });
  if (!reminder) {
    throw ApiError.notFound('Reminder not found');
  }
  await reminder.deleteOne();
  return reminder;
};
