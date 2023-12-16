const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");

// Route for getting all users
router.get("/list-users", userController.getAllUsers);

// Additional routes for user-related functionalities
// Uncomment and modify these routes according to your actual controller methods
// router.post("/create-user", userController.createUser);
// router.put("/update-user/:id", userController.updateUser);
// router.delete("/delete-user/:id", userController.deleteUser);

module.exports = router;
