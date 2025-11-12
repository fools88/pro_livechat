// Helper to build redis client config and create client from environment.
// Exports:
// - buildRedisClientConfig(env) -> { type: 'url', url } or { type: 'socket', host, port } or null
// - createRedisClientFromEnv() -> redis client or null

function buildRedisClientConfig(env = process.env) {
  const redisUrl = env.REDIS_URL || env.REDIS_HOST;
  const redisPort = env.REDIS_PORT || '6379';
  if (!redisUrl) return null;
  const s = String(redisUrl);
  if (s.startsWith('redis://') || s.startsWith('rediss://')) {
    return { type: 'url', url: s };
  }
  return { type: 'socket', host: String(env.REDIS_HOST || redisUrl), port: Number(redisPort) };
}

function createRedisClientFromEnv(env = process.env) {
  const cfg = buildRedisClientConfig(env);
  if (!cfg) return null;
  const { createClient } = require('redis');
  if (cfg.type === 'url') return createClient({ url: cfg.url });
  return createClient({ socket: { host: cfg.host, port: cfg.port } });
}

module.exports = { buildRedisClientConfig, createRedisClientFromEnv };
