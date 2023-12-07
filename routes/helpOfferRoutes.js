const express = require("express");
const router = express.Router();
const HelpOfferController = require("../controllers/HelpOfferController");

router.post("/offer", HelpOfferController.createHelpOffer);

module.exports = router;
