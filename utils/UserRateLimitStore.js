class UserRateLimitStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.store = {};
  }

  async increment(key) {
    if (!this.store[key]) {
      this.store[key] = {
        totalHits: 0,
        resetTime: new Date(Date.now() + this.windowMs),
      };
    }

    this.store[key].totalHits++;

    console.log(
      `Incrementing hit for key ${key}. Total hits: ${this.store[key].totalHits}`
    );

    return {
      totalHits: this.store[key].totalHits,
      resetTime: this.store[key].resetTime,
    };
  }

  async decrement(key) {
    console.log(`Resetting hit count for key ${key} due to successful login.`);
    delete this.store[key];
  }

  async resetKey(key) {
    if (this.store[key]) {
      delete this.store[key];
      console.log(`Key ${key} reset.`);
      return true;
    } else {
      console.log(`Key ${key} not found.`);
      return false;
    }
  }

  async resetAll() {
    console.log(`Resetting all keys`);
    this.store = {};
  }

  getAllData() {
    return this.store;
  }
}

module.exports = UserRateLimitStore;
