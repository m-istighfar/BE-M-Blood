const express = require("express");
const router = express.Router();
const EmergencyController = require("../controllers/EmergencyController");
const { route } = require("./appointmentRoutes");

router.post("/request", EmergencyController.createEmergencyRequest);
router.get("/", EmergencyController.getAllEmergencyRequests);
router.get("/:emergencyRequestId", EmergencyController.getEmergencyRequestById);
module.exports = router;
