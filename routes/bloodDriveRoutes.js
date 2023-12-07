const express = require("express");
const router = express.Router();
const BloodDriveController = require("../controllers/BloodDriveController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router.post(
  "/create",
  authenticationMiddleware,
  BloodDriveController.createBloodDrive
);

module.exports = router;
