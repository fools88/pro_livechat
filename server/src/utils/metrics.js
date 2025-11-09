const client = require('prom-client');

// collect default metrics (process, gc, etc.)
client.collectDefaultMetrics({ prefix: 'prochat_' });

// AI request counters & histogram
const aiRequestCount = new client.Counter({
  name: 'prochat_ai_request_total',
  help: 'Total AI requests',
});

const aiRequestSuccess = new client.Counter({
  name: 'prochat_ai_request_success_total',
  help: 'Total successful AI requests',
});

const aiRequestFailure = new client.Counter({
  name: 'prochat_ai_request_failure_total',
  help: 'Total failed AI requests',
});

const aiRequestDuration = new client.Histogram({
  name: 'prochat_ai_request_duration_seconds',
  help: 'AI request duration in seconds',
  // label 'success' used by callers to mark success/failure
  labelNames: ['success'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20]
});

module.exports = {
  client,
  aiRequestCount,
  aiRequestSuccess,
  aiRequestFailure,
  aiRequestDuration
};
