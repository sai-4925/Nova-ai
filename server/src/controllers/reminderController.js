// controllers/reminderController.js
// -----------------------------------------------------------------------
// Plain REST CRUD over reminderService - this is what a future
// dashboard "Reminders" widget calls directly, completely independent
// of the chat/voice path. Both paths share the exact same service
// functions, so a reminder created via chat shows up here and vice versa.
// -----------------------------------------------------------------------

import * as reminderService from '../services/reminderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// POST /api/reminders
export const createReminder = asyncHandler(async (req, res) => {
  const { title, remindAt, recurrence } = req.body;
  if (!title || !remindAt) {
    throw ApiError.badRequest('title and remindAt are required');
  }
  const reminder = await reminderService.createReminder({
    userId: req.user._id,
    title,
    remindAt,
    recurrence,
    createdVia: 'text',
  });
  new ApiResponse(201, { reminder }, 'Reminder created').send(res);
});

// GET /api/reminders
export const listReminders = asyncHandler(async (req, res) => {
  const reminders = await reminderService.listUpcomingReminders(req.user._id, 50);
  new ApiResponse(200, { reminders }).send(res);
});

// DELETE /api/reminders/:id
export const deleteReminder = asyncHandler(async (req, res) => {
  await reminderService.deleteReminderById(req.user._id, req.params.id);
  new ApiResponse(200, null, 'Reminder deleted').send(res);
});
