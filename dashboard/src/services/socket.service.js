import { io as ioClient } from 'socket.io-client';

// Simple client socket wrapper used by Dashboard
let socket = null;
let connectionStatusCallbacks = [];

const connect = (opts = {}) => {
  if (socket) return socket;
  const token = localStorage.getItem('prochat-token') || opts.token;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  socket = ioClient(base, {
    query: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    console.log('[Socket] connected', socket.id);
    notifyConnectionStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected', reason);
    notifyConnectionStatus('disconnected');
  });

  socket.on('reconnecting', (attemptNumber) => {
    console.log('[Socket] reconnecting...', attemptNumber);
    notifyConnectionStatus('reconnecting');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[Socket] reconnected after', attemptNumber, 'attempts');
    notifyConnectionStatus('connected');
  });

  socket.on('reconnect_error', (error) => {
    console.error('[Socket] reconnect error', error);
    notifyConnectionStatus('error');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] connect error', error);
    notifyConnectionStatus('error');
  });

  return socket;
};

const notifyConnectionStatus = (status) => {
  connectionStatusCallbacks.forEach(cb => {
    try {
      cb(status);
    } catch (e) {
      console.error('[Socket] Error in connection status callback:', e);
    }
  });
};

const onConnectionStatusChange = (callback) => {
  connectionStatusCallbacks.push(callback);
  
  // Return cleanup function
  return () => {
    connectionStatusCallbacks = connectionStatusCallbacks.filter(cb => cb !== callback);
  };
};

const getConnectionStatus = () => {
  if (!socket) return 'disconnected';
  return socket.connected ? 'connected' : 'disconnected';
};

const disconnect = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  connectionStatusCallbacks = [];
};

const emit = (event, payload) => {
  if (!socket) return;
  socket.emit(event, payload);
};

const listen = (event, cb) => {
  if (!socket) connect();
  socket.on(event, cb);
};

const unlisten = (event, cb) => {
  if (!socket) return;
  if (cb) {
    socket.off(event, cb);
  } else {
    socket.off(event);
  }
};

export default {
  connect,
  disconnect,
  emit,
  listen,
  unlisten,
  onConnectionStatusChange,
  getConnectionStatus
};