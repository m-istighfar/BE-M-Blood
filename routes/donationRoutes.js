const express = require("express");
const router = express.Router();
const DonationController = require("../controllers/DonationController");

router.post("/appointment", DonationController.createAppointment);

module.exports = router;
