const express = require("express");
const router = express.Router();
const HelpOfferController = require("../controllers/HelpOfferController");

router.post("/offer", HelpOfferController.createHelpOffer);
router.get("/", HelpOfferController.getAllHelpOffers);
router.get("/:helpOfferId", HelpOfferController.getHelpOfferById);
router.put("/:helpOfferId", HelpOfferController.updateHelpOffer);
router.delete("/:helpOfferId", HelpOfferController.deleteHelpOffer);

module.exports = router;
