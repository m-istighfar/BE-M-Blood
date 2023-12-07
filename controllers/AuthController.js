const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendVerificationEmail } = require("../services/mailService");

const {
  JWT_SIGN,
  JWT_REFRESH_SIGN,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} = require("../config/jwt");

const successResponse = (res, message, data = null) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const register = async (req, res) => {
  try {
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
        Phone: phone,
        AdditionalInfo: additionalInfo,
        UserAuth: {
          connect: { UserAuthID: newUserAuth.UserAuthID },
        },
      },
    });

    await sendVerificationEmail(email, verificationToken);

    return successResponse(res, "User successfully registered", {
      userId: newUser.UserID,
      username,
      email,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
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

    return successResponse(res, "Email verified successfully!");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const login = async (req, res) => {
  try {
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

    return successResponse(res, "Login successful", {
      userId: userAuth.UserAuthID,
      accessToken,
      refreshToken,
      accessTokenExp: ACCESS_TOKEN_EXPIRATION,
      refreshTokenExp: REFRESH_TOKEN_EXPIRATION,
      role: userAuth.Role,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};
