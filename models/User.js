const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  role: { type: String, enum: ["admin", "user"] },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verified: { type: Boolean, default: false },
  verificationToken: String,
  googleId: String,
});

module.exports = mongoose.model("User", UserSchema);
