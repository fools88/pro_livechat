// /dashboard/src/components/ToastContainer.jsx
// (KOMPONEN V18 - TOAST CONTAINER)

import React from 'react';
import Toast from './Toast';
import '../styles/toast.css';

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
