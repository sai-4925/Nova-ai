// src/services/axiosInstance.js
// -----------------------------------------------------------------------
// One configured axios instance used by every API service file
// (authApi, chatApi, agentApi, etc). Centralising this means:
//   - `withCredentials: true` is set ONCE, so the httpOnly session
//     cookie set by the backend (Module 4) is sent automatically
//   - A single 401 interceptor handles "session expired" everywhere,
//     instead of every component checking error.response.status itself
// -----------------------------------------------------------------------

import axios from 'axios';
import { env } from '../config/env.js';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // sends the httpOnly JWT cookie with every request
  headers: { 'Content-Type': 'application/json' },
});

// Set by AuthContext at startup so the interceptor can trigger a
// logout/redirect without importing React Router directly into a
// plain JS module.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
