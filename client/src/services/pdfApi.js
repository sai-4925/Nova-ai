// src/services/pdfApi.js
import { api } from './axiosInstance.js';

export const listPdfs = () => api.get('/pdf');

export const uploadPdf = (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  // Override the shared instance's default JSON content-type for this
  // one multipart request - axios sets the correct boundary itself
  // when it sees a FormData body, as long as we don't force JSON here.
  return api.post('/pdf/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const deletePdf = (id) => api.delete(`/pdf/${id}`);
