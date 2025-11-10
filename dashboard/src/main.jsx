// /dashboard/src/main.jsx
// (VERSI V11)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css'; 
import { ThemeProvider } from './contexts/ThemeContext'; // <-- (1) IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* <-- (2) BUNGKUS DI LUAR */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider> {/* <-- (3) TUTUP BUNGKUS */}
  </React.StrictMode>
);

// Test hook for E2E: attach a function to window that triggers an API call via the lazy api wrapper.
// This does not import axios eagerly; it only imports the `api` wrapper when the hook is invoked.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.__PRO_LIVECHAT_TEST_SIGNAL__ = async () => {
    try {
      const mod = await import('./services/api.js');
      const api = mod.default;
      // call a short-lived test endpoint; Playwright will intercept this route during tests
      return await api.get('/__e2e_test__/ping');
    } catch (err) {
      // expose error for debugging in tests
      // eslint-disable-next-line no-undef
      window.__PRO_LIVECHAT_TEST_SIGNAL_ERROR__ = String(err && err.message ? err.message : err);
      throw err;
    }
  };
}