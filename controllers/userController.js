// const Task = require("../models/Task");

// const getAllTasks = async (req, res) => {
//   console.log(req.query);

//   try {
//     const { search, priority, status, dueDate, sortOrder } = req.query;

//     const query = { userId: req.user.id };
//     let filteringOrSearching = false;

//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//       filteringOrSearching = true;
//     }
//     if (priority) {
//       query.priority = priority;
//       filteringOrSearching = true;
//     }
//     if (status) {
//       query.status = status;
//       filteringOrSearching = true;
//     }
//     if (dueDate) {
//       query.dueDate = new Date(dueDate);
//       filteringOrSearching = true;
//     }

//     let sortDirection = 1;
//     if (sortOrder === "desc") {
//       sortDirection = -1;
//     }

//     const tasks = await Task.find(query).sort({ dueDate: sortDirection });
//     const count = await Task.countDocuments(query);

//     if (tasks.length === 0) {
//       if (filteringOrSearching) {
//         return res
//           .status(200)
//           .json({ message: "No tasks found with the given criteria.", count });
//       }
//       return res
//         .status(200)
//         .json({ message: "You have no tasks at the moment.", count });
//     }

//     res
//       .status(200)
//       .json({ message: "Tasks fetched successfully!", tasks, count });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const getTaskById = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ error: "Task not found" });
//     if (task.userId.toString() !== req.user.id)
//       return res
//         .status(403)
//         .json({ error: "Unauthorized: This task does not belong to you" });
//     res.status(200).json({ message: "Task fetched successfully!", task });
//   } catch (error) {
//     if (error.kind === "ObjectId") {
//       return res.status(400).json({ error: "Invalid task ID" });
//     }
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const createTask = async (req, res) => {
//   try {
//     const newTask = new Task({ ...req.body, userId: req.user.id });
//     await newTask.save();
//     res
//       .status(201)
//       .json({ message: "Task created successfully!", task: newTask });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const updateTask = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ error: "Task not found" });
//     if (task.userId.toString() !== req.user.id)
//       return res
//         .status(403)
//         .json({ error: "Unauthorized: This task does not belong to you" });

//     if (task.status === "completed")
//       return res
//         .status(400)
//         .json({ error: "Cannot update a task that's already completed" });

//     task.set(req.body);
//     await task.save();
//     res.status(200).json({ message: "Task updated successfully!", task });
//   } catch (error) {
//     if (error.kind === "ObjectId") {
//       return res.status(400).json({ error: "Invalid task ID" });
//     }
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const deleteTask = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ error: "Task not found" });
//     if (task.userId.toString() !== req.user.id)
//       return res
//         .status(403)
//         .json({ error: "Unauthorized: This task does not belong to you" });
//     await Task.deleteOne({ _id: req.params.id });
//     res.status(200).json({ message: "Task deleted successfully!" });
//   } catch (error) {
//     console.error(error);
//     if (error.kind === "ObjectId") {
//       return res.status(400).json({ error: "Invalid task ID" });
//     }
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const deleteAllTasks = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const result = await Task.deleteMany({ userId });

//     if (result.deletedCount === 0) {
//       return res
//         .status(200)
//         .json({ message: "You have no tasks to delete at the moment." });
//     }

//     res
//       .status(200)
//       .json({ message: `${result.deletedCount} tasks deleted successfully!` });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// const markComplete = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ error: "Task not found" });
//     if (task.userId.toString() !== req.user.id)
//       return res
//         .status(403)
//         .json({ error: "Unauthorized: This task does not belong to you" });
//     if (task.status === "completed")
//       return res
//         .status(400)
//         .json({ error: "Task is already marked as completed" });
//     task.status = "completed";
//     await task.save();
//     res
//       .status(200)
//       .json({ message: "Task marked as completed successfully!", task });
//   } catch (error) {
//     if (error.kind === "ObjectId") {
//       return res.status(400).json({ error: "Invalid task ID" });
//     }
//     res
//       .status(500)
//       .json({ error: "Internal server error. Please try again later." });
//   }
// };

// module.exports = {
//   getAllTasks,
//   getTaskById,
//   createTask,
//   updateTask,
//   deleteTask,
//   deleteAllTasks,
//   markComplete,
// };
