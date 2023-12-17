const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const { sendVerificationEmail } = require("../services/mailService");

const {
  JWT_SIGN,
  JWT_REFRESH_SIGN,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} = require("../config/jwt");

const successResponse = (res, message, data = null) => {
  const response = { message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(200).json(response);
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    role: Joi.string().optional(),
    provinceId: Joi.number().integer().required(),
    additionalInfo: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const register = async (req, res) => {
  try {
    const validationError = validateRegistration(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const {
      username,
      email,
      password,
      name,
      phone,
      role,
      provinceId,
      additionalInfo,
    } = req.body;

    const existingUserAuthByUsername = await prisma.userAuth.findUnique({
      where: { Username: username },
    });
    if (existingUserAuthByUsername) {
      return errorResponse(res, "Username already exists");
    }

    const existingUserAuthByEmail = await prisma.userAuth.findUnique({
      where: { Email: email },
    });
    if (existingUserAuthByEmail) {
      return errorResponse(res, "Email already exists");
    }

    const provinceExists = await prisma.province.findUnique({
      where: { ProvinceID: parseInt(provinceId) },
    });
    if (!provinceExists) {
      return errorResponse(res, "Invalid ProvinceID");
    }

    await prisma.$transaction(async (prisma) => {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUserAuth = await prisma.userAuth.create({
        data: {
          Username: username,
          Email: email,
          Password: hashedPassword,
          VerificationToken: verificationToken,
          Role: role || "user",
        },
      });

      const newUser = await prisma.user.create({
        data: {
          ProvinceID: parseInt(provinceId),
          Name: name,
          Email: email,
          Phone: phone,
          AdditionalInfo: additionalInfo,
          UserAuth: {
            connect: { UserAuthID: newUserAuth.UserAuthID },
          },
        },
      });

      await sendVerificationEmail(email, verificationToken);

      successResponse(res, "User successfully registered", {
        userId: newUser.UserID,
        username,
        email,
      });
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const userAuth = await prisma.userAuth.findUnique({
      where: { VerificationToken: token },
    });
    if (!userAuth) {
      return errorResponse(res, "Invalid verification token.");
    }

    await prisma.userAuth.update({
      where: { UserAuthID: userAuth.UserAuthID },
      data: { Verified: true, VerificationToken: null },
    });

    successResponse(res, "Email verified successfully!");
  } catch (error) {
    errorResponse(res, error.message);
  }
};

const login = async (req, res) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const { username, password } = req.body;

    const userAuth = await prisma.userAuth.findUnique({
      where: { Username: username },
    });
    if (!userAuth) {
      return errorResponse(res, "User does not exist");
    }

    if (!userAuth.Verified) {
      return errorResponse(
        res,
        "Email not verified. Please verify your email first."
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, userAuth.Password);
    if (!isPasswordCorrect) {
      return errorResponse(res, "Password is incorrect");
    }

    const accessToken = jwt.sign(
      {
        username: userAuth.Username,
        id: userAuth.UserAuthID,
        role: userAuth.Role,
      },
      JWT_SIGN,
      { expiresIn: ACCESS_TOKEN_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      {
        username: userAuth.Username,
        id: userAuth.UserAuthID,
        role: userAuth.Role,
      },
      JWT_REFRESH_SIGN,
      { expiresIn: REFRESH_TOKEN_EXPIRATION }
    );

    successResponse(res, "Login successful", {
      userId: userAuth.UserAuthID,
      accessToken,
      refreshToken,
      accessTokenExp: ACCESS_TOKEN_EXPIRATION,
      refreshTokenExp: REFRESH_TOKEN_EXPIRATION,
      role: userAuth.Role,
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};
