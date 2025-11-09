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