const express = require("express");
const router = express.Router();
const EmergencyController = require("../controllers/EmergencyController");

router.post("/request", EmergencyController.createEmergencyRequest);

router.get("/", EmergencyController.getAllEmergencyRequests);

router.get("/:emergencyRequestId", EmergencyController.getEmergencyRequestById);

router.put("/:emergencyRequestId", EmergencyController.updateEmergencyRequest);

router.delete(
  "/:emergencyRequestId",
  EmergencyController.deleteEmergencyRequest
);

module.exports = router;
