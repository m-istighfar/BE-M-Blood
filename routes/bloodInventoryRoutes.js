const express = require("express");
const router = express.Router();
const bloodInventoryController = require("../controllers/BloodInventoryController");

router.post("/", bloodInventoryController.createBloodInventory);

router.get("/", bloodInventoryController.getBloodInventories);
router.get("/:inventoryID", bloodInventoryController.getBloodInventoryById);

router.put("/:inventoryID", bloodInventoryController.updateBloodInventory);

router.delete("/:inventoryID", bloodInventoryController.deleteBloodInventory);

module.exports = router;
