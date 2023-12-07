const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/mailService");

const successResponse = (res, message, data = null) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const userAuth = await prisma.userAuth.findUnique({
    where: { Email: email },
  });

  if (!userAuth) {
    return errorResponse(res, "No account with that email address exists.");
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
    return errorResponse(res, "Failed to send reset email.", 500, {
      details: error,
    });
  }

  return successResponse(res, "Password reset email sent.");
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
    return errorResponse(
      res,
      "Password reset token is invalid or has expired."
    );
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

    return successResponse(res, "Password successfully reset.");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
