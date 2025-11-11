const { buildRedisClientConfig } = require('../src/utils/redisHelper');

describe('redisHelper.buildRedisClientConfig', () => {
  test('returns null when no env provided', () => {
    const cfg = buildRedisClientConfig({});
    expect(cfg).toBeNull();
  });

  test('uses url when REDIS_URL contains scheme', () => {
    const cfg = buildRedisClientConfig({ REDIS_URL: 'redis://localhost:6379' });
    expect(cfg).toEqual({ type: 'url', url: 'redis://localhost:6379' });
  });

  test('uses socket when only REDIS_HOST provided', () => {
    const cfg = buildRedisClientConfig({ REDIS_HOST: 'localhost', REDIS_PORT: '6379' });
    expect(cfg).toEqual({ type: 'socket', host: 'localhost', port: 6379 });
  });

  test('fallbacks to REDIS_HOST when REDIS_URL is non-url string', () => {
    const cfg = buildRedisClientConfig({ REDIS_URL: 'localhost', REDIS_PORT: '6380', REDIS_HOST: 'localhost' });
    expect(cfg).toEqual({ type: 'socket', host: 'localhost', port: 6380 });
  });
});
