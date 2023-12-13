const express = require("express");
const router = express.Router();
const midtransController = require("./controller");

router.post("/donate", midtransController.createTransaction);
router.post("/midtrans-notification", midtransController.midtransNotification);
router.get("/total-donations", midtransController.totalDonations);

module.exports = router;
