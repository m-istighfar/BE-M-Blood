const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Get all tasks for the logged-in user
router.get("/tasks", userController.getAllTasks);

// Get a specific task for the logged-in user
router.get("/tasks/:id", userController.getTaskById);

// Create a new task for the logged-in user
router.post("/tasks", userController.createTask);

// Update a specific task for the logged-in user
router.put("/tasks/:id", userController.updateTask);

// Delete a specific task for the logged-in user
router.delete("/tasks/:id", userController.deleteTask);

// You can add more user-related endpoints here if needed
router.patch("/tasks/:id/complete", userController.markComplete);

module.exports = router;
s;
