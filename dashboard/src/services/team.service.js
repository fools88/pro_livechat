// /dashboard/src/services/team.service.js

import api from './api';

// Menugaskan agent ke website
const assignAgentToWebsite = (userId, websiteId) => {
  // Backend: POST /api/team/assign
  return api.post('/team/assign', { userId, websiteId });
};

// Menghapus tugas agent dari website
const removeAgentFromWebsite = (userId, websiteId) => {
  // Backend: POST /api/team/remove
  return api.post('/team/remove', { userId, websiteId });
};

const teamService = {
  assignAgentToWebsite,
  removeAgentFromWebsite,
};

export default teamService;