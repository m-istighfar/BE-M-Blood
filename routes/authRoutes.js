const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const PasswordResetController = require("../controllers/PasswordResetController");
const cache = require("memory-cache");

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

router.post("/login", userLoginLimiter, AuthController.login);
router.post("/login-session", userLoginLimiter, AuthController.loginWihSession);

router.post("/register", AuthController.register);
router.get("/verify-email/:token", AuthController.verifyEmail);
router.post("/refreshToken", AuthController.refreshTokenHandler);

router.post("/logout-session", AuthController.logoutWithSession);

router.post(
  "/request-password-reset",
  PasswordResetController.requestPasswordReset
);

router.post(
  "/reset-password/:resetToken",
  PasswordResetController.resetPassword
);

router.get("/rate-limit-data", (req, res) => {
  const storeData = userRateLimitStoreInstance.getAllData();

  res.json(storeData);
});

router.post("/rate-limit-reset/:key", async (req, res) => {
  const { key } = req.params;
  const keyWasReset = await userRateLimitStoreInstance.resetKey(key);

  if (keyWasReset) {
    res.json({ message: `Key ${key} reset.` });
  } else {
    res.status(404).json({ message: `Key ${key} not found.` });
  }
});

router.post("/rate-limit-reset-all", (req, res) => {
  userRateLimitStoreInstance.resetAll();
  res.send({ message: "All rate limits reset" });
});

router.get("/cache-data", (req, res) => {
  const cacheObject = JSON.parse(cache.exportJson());
  res.json(cacheObject);
});

module.exports = router;
