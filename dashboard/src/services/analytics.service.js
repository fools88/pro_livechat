// /dashboard/src/services/analytics.service.js

import api from './api';

const getStats = () => {
  // GET /api/analytics/stats
  return api.get('/analytics/stats');
};

const analyticsService = {
  getStats,
};

export default analyticsService;