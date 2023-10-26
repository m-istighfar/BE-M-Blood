const User = require("../models/User");
// const Course = require("../models/course");
// const bcrypt = require("bcrypt");
// const Enrollment = require("../models/enrollment");
// const LearningPath = require("../models/learningpath");
// const Progress = require("../models/progress");

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUserByUsername = await User.findOne({ username });
    const existingUserByEmail = await User.findOne({ email });

    console.log(existingUserByUsername);

    if (existingUserByUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    if (existingUserByEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while creating the user" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email },
      { new: true }
    );
    res.status(200).json({ message: "update succes", updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the user" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const authoredCourses = await Course.find({ authorId: id });

    const courseIds = authoredCourses.map((course) => course._id);

    await Course.deleteMany({ authorId: id });

    await Enrollment.deleteMany({ studentId: id });

    await Progress.deleteMany({ studentId: id });

    await LearningPath.updateMany(
      { courses: { $in: courseIds } },
      { $pullAll: { courses: courseIds } }
    );

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "User and related records deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the user" });
  }
};

exports.assignRole = async (req, res) => {
  const { id, role } = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    res.status(200).json({ message: "succes", user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while assigning the role" });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, email } = req.body;
  const id = req.user.id;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email },
      { new: true }
    );
    res.status(200).json({ message: "succes", updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the profile" });
  }
};
