const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/mailService");

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const userAuth = await prisma.userAuth.findUnique({
    where: { Email: email },
  });

  if (!userAuth) {
    return res
      .status(400)
      .json({ error: "No account with that email address exists." });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.userAuth.update({
    where: { UserAuthID: userAuth.UserAuthID },
    data: {
      ResetPasswordToken: resetToken,
      ResetPasswordExpires: resetPasswordExpires,
    },
  });

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

  const userAuth = await prisma.userAuth.findFirst({
    where: {
      ResetPasswordToken: resetToken,
      ResetPasswordExpires: {
        gt: new Date(),
      },
    },
  });

  if (!userAuth) {
    return res
      .status(400)
      .json({ error: "Password reset token is invalid or has expired." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.userAuth.update({
      where: { UserAuthID: userAuth.UserAuthID },
      data: {
        Password: hashedPassword,
        ResetPasswordToken: null,
        ResetPasswordExpires: null,
      },
    });

    res.status(200).json({ message: "Password successfully reset." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
