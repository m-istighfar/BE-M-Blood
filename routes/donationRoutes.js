const express = require("express");
const router = express.Router();
const midtransController = require("../controllers/DonationController");

router.get("/", midtransController.getAllDonations);
router.post("/create", midtransController.createTransaction);
router.post("/midtrans-notification", midtransController.midtransNotification);
router.get("/total-donations", midtransController.totalDonations);

module.exports = router;
