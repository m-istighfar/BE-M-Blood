const express = require("express");
const router = express.Router();
const BloodDriveController = require("../controllers/BloodDriveController");

router.post("/create", BloodDriveController.createBloodDrive);
router.get("/", BloodDriveController.getAllBloodDrives);
router.get("/get/total", BloodDriveController.getTotalBloodDrives);
router.get("/:bloodDriveId", BloodDriveController.getBloodDriveById);
router.put("/:bloodDriveId", BloodDriveController.updateBloodDrive);
router.delete("/:bloodDriveId", BloodDriveController.deleteBloodDrive);

// router.post(
//   "/:bloodDriveId/volunteer",
//   authenticationMiddleware,
//   BloodDriveController.registerVolunteer
// );

module.exports = router;
