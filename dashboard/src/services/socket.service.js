// Lazy-initialized socket wrapper. Uses dynamic import for socket.io-client
// and queues listeners/emits until the real socket is ready.
let socket = null; // the real socket once initialized
let connectionStatusCallbacks = [];
let pendingListeners = []; // { event, cb }
let pendingEmits = []; // { event, payload }
let isInitializing = false;

const notifyConnectionStatus = (status) => {
  connectionStatusCallbacks.forEach(cb => {
    try { cb(status); } catch (e) { console.error('[Socket] Error in connection status callback:', e); }
  });
};

async function ensureInitialized(opts = {}) {
  if (socket) return socket;
  if (isInitializing) return null;
  isInitializing = true;
  try {
    const token = localStorage.getItem('prochat-token') || opts.token;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    const mod = await import('socket.io-client');
    const ioClient = mod.io || mod.default || mod;
    socket = ioClient(base, {
      query: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    // Wire standard events
    socket.on('connect', () => {
      console.log('[Socket] connected', socket.id);
      notifyConnectionStatus('connected');
    });
    socket.on('disconnect', (reason) => { console.log('[Socket] disconnected', reason); notifyConnectionStatus('disconnected'); });
    socket.on('reconnecting', (n) => { console.log('[Socket] reconnecting', n); notifyConnectionStatus('reconnecting'); });
    socket.on('reconnect', (n) => { console.log('[Socket] reconnected', n); notifyConnectionStatus('connected'); });
    socket.on('reconnect_error', (e) => { console.error('[Socket] reconnect error', e); notifyConnectionStatus('error'); });
    socket.on('connect_error', (e) => { console.error('[Socket] connect error', e); notifyConnectionStatus('error'); });

    // attach any pending listeners
    for (const { event, cb } of pendingListeners) {
      try { socket.on(event, cb); } catch (e) { console.error('[Socket] attach listener error', e); }
    }
    pendingListeners = [];

    // flush pending emits
    for (const { event, payload } of pendingEmits) {
      try { socket.emit(event, payload); } catch (e) { console.error('[Socket] emit error', e); }
    }
    pendingEmits = [];

    return socket;
  } catch (err) {
    console.error('[Socket] Failed to initialize socket.io-client:', err);
    isInitializing = false;
    return null;
  } finally {
    isInitializing = false;
  }
}

const connect = (opts = {}) => {
  // Start initialization in background but don't block
  if (!socket && !isInitializing) ensureInitialized(opts).catch(()=>{});
  return socket;
};

const onConnectionStatusChange = (callback) => {
  connectionStatusCallbacks.push(callback);
  return () => { connectionStatusCallbacks = connectionStatusCallbacks.filter(cb => cb !== callback); };
};

const getConnectionStatus = () => {
  if (!socket) return 'disconnected';
  return socket.connected ? 'connected' : 'disconnected';
};

const disconnect = () => {
  if (socket) {
    try { socket.disconnect(); } catch (e) { /* ignore */ }
  }
  socket = null;
  pendingListeners = [];
  pendingEmits = [];
  connectionStatusCallbacks = [];
  isInitializing = false;
};

const emit = (event, payload) => {
  if (socket) {
    try { socket.emit(event, payload); } catch (e) { console.error('[Socket] emit failed', e); }
  } else {
    // queue until ready
    pendingEmits.push({ event, payload });
    if (!isInitializing) ensureInitialized().catch(()=>{});
  }
};

const listen = (event, cb) => {
  if (socket) {
    try { socket.on(event, cb); } catch (e) { console.error('[Socket] on failed', e); }
  } else {
    pendingListeners.push({ event, cb });
    if (!isInitializing) ensureInitialized().catch(()=>{});
  }
};

const unlisten = (event, cb) => {
  if (socket) {
    if (cb) socket.off(event, cb); else socket.off(event);
  } else {
    // remove from pendingListeners
    pendingListeners = pendingListeners.filter(l => !(l.event === event && l.cb === cb));
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