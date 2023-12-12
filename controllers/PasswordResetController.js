const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Joi = require("joi");
const { sendPasswordResetEmail } = require("../services/mailService");

const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = { message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateEmail = (email) => {
  const schema = Joi.string().email().required();
  return schema.validate(email);
};

const validatePassword = (password) => {
  const schema = Joi.string().min(6).required();
  return schema.validate(password);
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const { error } = validateEmail(email);
  if (error) {
    return errorResponse(res, error.details[0].message);
  }

  const userAuth = await prisma.userAuth.findUnique({
    where: { Email: email },
  });

  if (!userAuth) {
    return errorResponse(res, "No account with that email address exists.");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordExpires = new Date(Date.now() + 3600000);

  await prisma.userAuth.update({
    where: { UserAuthID: userAuth.UserAuthID },
    data: {
      ResetPasswordToken: resetToken,
      ResetPasswordExpires: resetPasswordExpires,
    },
  });

  const { success, error: mailError } = await sendPasswordResetEmail(
    email,
    resetToken
  );

  if (!success) {
    return errorResponse(res, "Failed to send reset email.", 500, {
      details: mailError,
    });
  }

  return successResponse(res, "Password reset email sent.");
};

const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  const { error } = validatePassword(newPassword);
  if (error) {
    return errorResponse(res, error.details[0].message);
  }

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
