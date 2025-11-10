// quick test for Redis connectivity using same logic as server readiness
const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || 6379;

async function tryUrl() {
  if (!redisUrl) {
    console.log('No REDIS_URL/REDIS_HOST provided');
    return;
  }
  console.log('Attempting createClient({url: redisUrl}) with redisUrl=' + redisUrl);
  try {
    const client = createClient({ url: redisUrl });
    client.on('error', (e) => console.error('client-url error:', e && e.message));
    await client.connect();
    const r = await client.ping();
    console.log('PING via url client ->', r);
    await client.disconnect();
  } catch (e) {
    console.error('Failed using url client:', e && e.message);
  }
}

async function trySocket() {
  console.log('Attempting createClient({socket:{host,port}}) with host=' + (process.env.REDIS_HOST||'') + ' port=' + redisPort);
  try {
    const client2 = createClient({ socket: { host: process.env.REDIS_HOST || '127.0.0.1', port: Number(redisPort) } });
    client2.on('error', (e) => console.error('client-socket error:', e && e.message));
    await client2.connect();
    const r2 = await client2.ping();
    console.log('PING via socket client ->', r2);
    await client2.disconnect();
  } catch (e) {
    console.error('Failed using socket client:', e && e.message);
  }
}

(async () => {
  await tryUrl();
  await trySocket();
})();
