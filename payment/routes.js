const express = require("express");
const router = express.Router();
const midtransController = require("./controller");

router.post("/donate", midtransController.createTransaction);

module.exports = router;
