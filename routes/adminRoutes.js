const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/create-user", adminController.createUser);
router.put("/update-user/:id", adminController.updateUser);
router.delete("/delete-user/:id", adminController.deleteUser);
router.get("/list-user", adminController.listUsers);
router.post("/assign-role/", adminController.assignRole);

module.exports = router;
