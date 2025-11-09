// /dashboard/src/services/ai.service.js
// (VERSI V15 LENGKAP - 'processFile' & KATEGORI BARU)

import api from './api';

// --- PERSONA API (V14 - AMAN) ---
const getPersona = (websiteId) => {
  return api.get(`/ai/persona/${websiteId}`);
};
const setPersona = (websiteId, personaData) => {
  return api.post(`/ai/persona/${websiteId}`, personaData);
};

// --- KNOWLEDGE BASE API (UPGRADE V15) ---

// 1. Minta link upload ke MinIO (V13 - AMAN)
const getUploadUrl = (websiteId, fileName, fileType) => {
  return api.post(`/uploads/knowledge/${websiteId}`, { fileName, fileType });
};

// 2. (MODIFIKASI V15) - Sekarang mengirim 'categoryId'
const processFile = (websiteId, s3Key, fileName, categoryId) => {
  // Backend: POST /api/ai/knowledge/process/:websiteId
  // Kita tambahkan 'categoryId' ke payload
  return api.post(`/ai/knowledge/process/${websiteId}`, { s3Key, fileName, categoryId }); 
};

// --- RULES API (V13 - AMAN) ---
const getRules = (websiteId) => {
  return api.get(`/ai/rules/${websiteId}`);
};
const createRule = (websiteId, ruleData) => {
  return api.post(`/ai/rules/${websiteId}`, ruleData);
};
const deleteRule = (ruleId) => {
  return api.delete(`/ai/rules/${ruleId}`);
};

// --- (TAMBAHAN FUNGSI BARU V15: KATEGORI) ---
// G. Mengambil semua kategori untuk 1 website
const getCategories = (websiteId) => {
  return api.get(`/ai/categories/${websiteId}`);
};

// H. Membuat kategori baru
const createCategory = (websiteId, name, description) => {
  return api.post(`/ai/categories/${websiteId}`, { name, description });
};
// --- (AKHIR TAMBAHAN V15) ---

const aiService = {
  getPersona,
  setPersona,
  getUploadUrl,
  processFile, // (Sudah V15)
  getRules,
  createRule,
  deleteRule,
  getCategories,  // (Baru V15)
  createCategory, // (Baru V15)
};

export default aiService;