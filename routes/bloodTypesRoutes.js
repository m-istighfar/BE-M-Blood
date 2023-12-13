const express = require("express");
const router = express.Router();
const BloodTypeController = require("../controllers/BloodTypeController");

router.get("/", BloodTypeController.getAllBloodTypes);
router.get("/:id", BloodTypeController.getBloodTypeById);

module.exports = router;
