// /dashboard/src/services/api.js

// Replace direct axios import with lazy wrapper to reduce initial bundle footprint.
import api from './http.client.js';

export default api;