// src/services/memoryApi.js
import { api } from './axiosInstance.js';

export const listMemories = () => api.get('/memory');
export const deleteMemory = (id) => api.delete(`/memory/${id}`);
