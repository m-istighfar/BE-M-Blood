const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/tasks", userController.getAllTasks);

router.get("/tasks/:id", userController.getTaskById);

router.post("/tasks", userController.createTask);

router.put("/tasks/:id", userController.updateTask);

router.delete("/tasks/:id", userController.deleteTask);

router.delete("/tasks", userController.deleteAllTasks);

router.patch("/tasks/:id/complete", userController.markComplete);

module.exports = router;
