// Lazy HTTP client wrapper that lazily imports axios and exposes a proxy
let _instancePromise = null;

const init = () => {
  if (!_instancePromise) {
    _instancePromise = (async () => {
  const axiosModule = await import('axios');
  const axios = axiosModule.default || axiosModule;
  // SSR/Node-safe env detection
  let baseEnv;
  try { baseEnv = import.meta.env && import.meta.env.VITE_API_URL; } catch (e) { baseEnv = undefined; }
  const BASE = baseEnv || process.env.VITE_API_URL || 'http://localhost:8081';
  const API_URL = `${BASE.replace(/\/$/, '')}/api`;
      const inst = axios.create({ baseURL: API_URL });
      inst.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem('prochat-token');
          if (token) config.headers['Authorization'] = `Bearer ${token}`;
          return config;
        },
        (err) => Promise.reject(err)
      );
      return inst;
    })();
  }
  return _instancePromise;
};

// Proxy that forwards method calls to the real axios instance after init
const handler = {
  get(_, prop) {
    // return an async function for any property access
    return async (...args) => {
      const inst = await init();
      const target = inst[prop];
      if (typeof target === 'function') return target.apply(inst, args);
      // property access returning non-function
      return inst[prop];
    };
  },
};

const api = new Proxy({}, handler);

export default api;
