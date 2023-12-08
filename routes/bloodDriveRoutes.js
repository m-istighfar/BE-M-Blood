const express = require("express");
const router = express.Router();
const BloodDriveController = require("../controllers/BloodDriveController");

router.post("/create", BloodDriveController.createBloodDrive);
router.get("/", BloodDriveController.getAllBloodDrives);

module.exports = router;
