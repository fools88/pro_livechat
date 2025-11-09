class CircuitBreaker {
  constructor({ failureThreshold = 5, recoveryTimeMs = 60000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeMs = recoveryTimeMs;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF
    this.failureCount = 0;
    this.nextAttempt = 0;
  }

  async call(action) {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now > this.nextAttempt) {
        this.state = 'HALF';
      } else {
        throw new Error('Circuit is open');
      }
    }

    try {
      const result = await action();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  _onFailure() {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeMs;
    }
  }
}

module.exports = CircuitBreaker;
