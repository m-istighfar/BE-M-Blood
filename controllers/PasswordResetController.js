const crypto = require("crypto");

const User = require("../models/User");
const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("../services/mailService");

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(400)
      .json({ error: "No account with that email address exists." });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = resetToken;
  const resetPasswordExpires = Date.now() + 3600000;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  const { success, error } = await sendPasswordResetEmail(email, resetToken);

  if (!success) {
    return res
      .status(500)
      .json({ error: "Failed to send reset email.", details: error });
  }

  res.status(200).json({ message: "Password reset email sent." });
};

const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  console.log("Token from URL:", resetToken);

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: "Password reset token is invalid or has expired." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password successfully reset." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
