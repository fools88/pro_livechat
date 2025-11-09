#!/usr/bin/env node

/**
 * Quick WebSocket Enhancement Test
 * Tests new V22 socket events: edit_message, delete_message, typing indicators
 * 
 * Run: node server/tools/test_websocket_v22.js
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Config
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8081';
const JWT_SECRET = process.env.JWT_SECRET || 'prochat-rahasia';

// Helper: Create admin token
function createAdminToken(userId = 1) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
}

// Color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function testWebSocketV22() {
  log(colors.blue, '\n🚀 Testing WebSocket V22 Enhancements...\n');

  // Create 2 admin sockets
  const token1 = createAdminToken(1);
  const token2 = createAdminToken(2);

  const socket1 = io(SERVER_URL, {
    query: { token: token1 },
    transports: ['websocket']
  });

  const socket2 = io(SERVER_URL, {
    query: { token: token2 },
    transports: ['websocket']
  });

  // Test results
  const tests = {
    connection: false,
    messageEdit: false,
    messageDelete: false,
    typingStart: false,
    typingStop: false,
    conversationUpdate: false
  };

  // Wait for connections
  await new Promise((resolve) => {
    let connected = 0;
    
    socket1.on('connect', () => {
      log(colors.green, '✓ Socket 1 connected:', socket1.id);
      connected++;
      if (connected === 2) resolve();
    });

    socket2.on('connect', () => {
      log(colors.green, '✓ Socket 2 connected:', socket2.id);
      connected++;
      if (connected === 2) resolve();
    });

    socket1.on('connect_error', (err) => {
      log(colors.red, '✗ Socket 1 connection error:', err.message);
    });

    socket2.on('connect_error', (err) => {
      log(colors.red, '✗ Socket 2 connection error:', err.message);
    });
  });

  tests.connection = true;

  // Test 1: Message Edit
  log(colors.yellow, '\n📝 Test 1: Message Edit Event');
  
  socket2.on('message:updated', (data) => {
    if (data.messageId === 999 && data.content === 'Edited content') {
      log(colors.green, '✓ Socket 2 received message:updated event');
      tests.messageEdit = true;
    }
  });

  // Simulate message edit (would normally come from database)
  setTimeout(() => {
    socket1.emit('edit_message', {
      conversationId: 1,
      messageId: 999,
      content: 'Edited content'
    });
  }, 500);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Typing Indicators
  log(colors.yellow, '\n⌨️  Test 2: Typing Indicators');

  socket2.on('typing:start', (data) => {
    if (data.conversationId === 1 && data.userType === 'admin') {
      log(colors.green, '✓ Socket 2 received typing:start event');
      tests.typingStart = true;
    }
  });

  socket2.on('typing:stop', (data) => {
    if (data.conversationId === 1) {
      log(colors.green, '✓ Socket 2 received typing:stop event');
      tests.typingStop = true;
    }
  });

  // Both sockets join the same room
  socket1.emit('join_room', 1);
  socket2.emit('join_room', 1);

  setTimeout(() => {
    socket1.emit('typing:start', { conversationId: 1 });
  }, 500);

  setTimeout(() => {
    socket1.emit('typing:stop', { conversationId: 1 });
  }, 1500);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Connection Status (check reconnection config)
  log(colors.yellow, '\n🔌 Test 3: Connection Configuration');
  
  const config = socket1.io.opts;
  if (config.reconnection === true) {
    log(colors.green, '✓ Auto-reconnection enabled');
    log(colors.green, '  - Reconnection delay:', config.reconnectionDelay, 'ms');
    log(colors.green, '  - Max delay:', config.reconnectionDelayMax, 'ms');
  } else {
    log(colors.red, '✗ Auto-reconnection not enabled');
  }

  // Summary
  log(colors.blue, '\n📊 Test Summary:\n');
  
  const passed = Object.values(tests).filter(Boolean).length;
  const total = Object.keys(tests).length;

  Object.entries(tests).forEach(([name, result]) => {
    const icon = result ? '✓' : '✗';
    const color = result ? colors.green : colors.red;
    log(color, `${icon} ${name}`);
  });

  log(colors.blue, `\n${passed}/${total} tests passed`);

  if (passed === total) {
    log(colors.green, '\n🎉 All WebSocket V22 enhancements working!\n');
  } else {
    log(colors.yellow, '\n⚠️  Some tests failed. Check implementation.\n');
  }

  // Cleanup
  socket1.disconnect();
  socket2.disconnect();
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
testWebSocketV22().catch((err) => {
  log(colors.red, '✗ Test failed:', err);
  process.exit(1);
});
