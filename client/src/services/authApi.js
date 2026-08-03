// src/services/authApi.js
// -----------------------------------------------------------------------
// Thin wrapper around the backend's /api/auth endpoints. Components
// never call `api.post(...)` directly for auth - they go through these
// named functions, so the request shape only needs updating in one
// place if the backend contract ever changes.
// -----------------------------------------------------------------------

import { api } from './axiosInstance.js';

export const registerWithBackend = (idToken, name) => api.post('/auth/register', { idToken, name });

export const loginWithBackend = (idToken) => api.post('/auth/login', { idToken });

export const googleLoginWithBackend = (idToken) => api.post('/auth/google', { idToken });

export const logoutFromBackend = () => api.post('/auth/logout');

export const fetchCurrentUser = () => api.get('/auth/me');
