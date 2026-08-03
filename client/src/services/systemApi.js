// src/services/systemApi.js
import { api } from './axiosInstance.js';

export const createPairingToken = () => api.post('/system/pairing-token');
export const getCompanionStatus = () => api.get('/system/status');
