const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcrypt");

exports.listUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: {} },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "userId",
          as: "tasks",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          verified: 1,
          pendingTask: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "pending"] },
              },
            },
          },
          completedTask: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "completed"] },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching users",
    });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      const errorField =
        existingUser.username === username ? "Username" : "Email";
      return res
        .status(400)
        .json({ success: false, error: `${errorField} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      verified: true,
    });

    newUser.password = undefined;

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while creating the user",
    });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    updatedUser.password = undefined;

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while updating the user",
    });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      error: "You cannot delete yourself",
    });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await Task.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User and related tasks deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while deleting the user",
    });
  }
};
