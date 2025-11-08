const CircuitBreaker = require('./circuitBreaker');
const metrics = require('./metrics');

// default breaker for AI calls
const defaultBreaker = new CircuitBreaker({ failureThreshold: 5, recoveryTimeMs: 60000 });

// helper that runs model.generateContent(prompt) with timeout and retries
// instrumented with Prometheus metrics (request count & latency)
const safeGenerate = async (model, prompt, { timeoutMs = 20000, retries = 3 } = {}) => {
  const attempt = async () => {
    // wrap generateContent in a promise with timeout
    return await Promise.race([
      model.generateContent(prompt),
      new Promise((_, rej) => setTimeout(() => rej(new Error('AI call timeout')), timeoutMs))
    ]);
  };

  let lastErr = null;
  const endTimer = metrics.aiRequestDuration.startTimer();
  metrics.aiRequestCount.inc();

  for (let i = 0; i <= retries; i++) {
    try {
      // use circuit breaker around the attempt
      const res = await defaultBreaker.call(attempt);
      endTimer({ success: 'true' });
      metrics.aiRequestSuccess.inc();
      return res;
    } catch (err) {
      lastErr = err;
      // small backoff
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)));
    }
  }
  endTimer({ success: 'false' });
  metrics.aiRequestFailure.inc();
  throw lastErr;
};

module.exports = {
  safeGenerate,
};
