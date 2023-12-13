const express = require("express");
const router = express.Router();
const ProvinceController = require("../controllers/ProvinceController");

router.get("/", ProvinceController.getAllProvinces);
router.get("/:id", ProvinceController.getProvinceById);

module.exports = router;
