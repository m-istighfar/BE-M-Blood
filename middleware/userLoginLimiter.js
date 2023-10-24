const { rateLimit } = require("express-rate-limit");

const UserRateLimitStore = require("../utils/UserRateLimitStore");

const windowMs = 15 * 60 * 1000;

const userRateLimitStoreInstance = new UserRateLimitStore(windowMs);

const userLoginLimiter = rateLimit({
  store: userRateLimitStoreInstance,
  windowMs: windowMs,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts, please try again after 15 minutes.",
  keyGenerator: (req) => {
    const key = req.body.username;
    console.log(`Generating key for rate limiter: ${key}`);
    return key;
  },
});

module.exports = userLoginLimiter;
