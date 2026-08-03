// src/services/reminderApi.js
import { api } from './axiosInstance.js';

export const listReminders = () => api.get('/reminders');
export const createReminder = (payload) => api.post('/reminders', payload);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);
