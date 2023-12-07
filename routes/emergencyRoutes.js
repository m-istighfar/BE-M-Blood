// emergencyRoutes.js

const express = require("express");
const router = express.Router();
const EmergencyController = require("../controllers/EmergencyController");

router.post("/request", EmergencyController.createEmergencyRequest);

module.exports = router;
