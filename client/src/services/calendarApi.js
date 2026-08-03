// src/services/calendarApi.js
import { api } from './axiosInstance.js';

export const getGoogleAuthUrl = () => api.get('/calendar/oauth/connect');
export const listEvents = () => api.get('/calendar/events');
export const createEvent = (payload) => api.post('/calendar/events', payload);
export const deleteEvent = (googleEventId) => api.delete(`/calendar/events/${googleEventId}`);
