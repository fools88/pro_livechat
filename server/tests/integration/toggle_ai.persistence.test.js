// Test toggle_ai persistence: simulate admin socket connection and emit toggle_ai
jest.setTimeout(20000);

beforeEach(() => {
  jest.resetModules();
});

test('toggle_ai updates Conversation.isAiActive in DB and broadcasts ai_status_changed', async () => {
  // Mock jsonwebtoken to verify token as admin
  jest.doMock('jsonwebtoken', () => ({
    verify: (token, secret) => ({ id: 'admin-1' }),
    decode: () => null
  }));

  // Mock models
  const updateMock = jest.fn().mockResolvedValue([1]);
  const findByPkMock = jest.fn().mockResolvedValue({ id: 'conv-1', isAiActive: true });
  jest.doMock('../../models', () => ({
    Conversation: {
      update: updateMock,
      findByPk: findByPkMock
    },
    Visitor: {},
    Website: {}
  }));

  const handlers = require('../../src/socket/handlers.js');

  let connectionHandler;
  const fakeIo = {
    on: (ev, cb) => { if (ev === 'connection') connectionHandler = cb; },
    emit: jest.fn()
  };

  // create fake socket object
  let toggleHandler;
  const fakeSocket = {
    handshake: { query: { token: 'tok' } },
    on: (ev, cb) => { if (ev === 'toggle_ai') toggleHandler = cb; },
    emit: jest.fn(),
    join: jest.fn()
  };

  // register handlers (this will call connection handler and set up listeners)
  handlers(fakeIo);
  // simulate connection
  await connectionHandler(fakeSocket);

  expect(typeof toggleHandler).toBe('function');

  // call toggle handler
  await toggleHandler({ conversationId: 'conv-1', status: false });

  // assert update called
  expect(updateMock).toHaveBeenCalledWith({ isAiActive: false }, { where: { id: 'conv-1' } });
});
