// /dashboard/src/services/website.service.js

import api from './api';

// Ambil daftar website
const getAllWebsites = () => {
  // Backend: GET /api/websites
  return api.get('/websites');
};

// Tambah website baru
const createWebsite = (name, url) => {
  // Backend: POST /api/websites
  return api.post('/websites', { name, url });
};

// Hapus website
const deleteWebsite = (websiteId) => {
  // Backend: DELETE /api/websites/:id
  return api.delete(`/websites/${websiteId}`);
};

const websiteService = {
  getAllWebsites,
  createWebsite,
  deleteWebsite,
};

export default websiteService;