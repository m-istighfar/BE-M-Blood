const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const PasswordResetController = require("../controllers/PasswordResetController");

const { rateLimit } = require("express-rate-limit");

const UserRateLimitStore = require("../utils/UserRateLimitStore");

const windowMs = 15 * 60 * 1000;

const userRateLimitStoreInstance = new UserRateLimitStore(windowMs);

const userLoginLimiter = rateLimit({
  store: userRateLimitStoreInstance,
  windowMs: windowMs,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many failed login attempts, please try again after 15 minutes.",
  },
  keyGenerator: (req) => {
    const key = req.body.username;
    console.log(`Generating key for rate limiter: ${key}`);
    return key;
  },
});

router.post("/login", userLoginLimiter, AuthController.login);

router.post("/register", AuthController.register);
router.get("/verify-email/:token", AuthController.verifyEmail);

router.post(
  "/request-password-reset",
  PasswordResetController.requestPasswordReset
);

router.post(
  "/reset-password/:resetToken",
  PasswordResetController.resetPassword
);

module.exports = router;
