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

const register = async (req, res) => {
  const { username, email, password, name, phone, provinceId, additionalInfo } =
    req.body;

  const existingUserAuthByUsername = await prisma.userAuth.findUnique({
    where: { Username: username },
  });
  if (existingUserAuthByUsername) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const existingUserAuthByEmail = await prisma.userAuth.findUnique({
    where: { Email: email },
  });
  if (existingUserAuthByEmail) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const provinceExists = await prisma.province.findUnique({
    where: { ProvinceID: parseInt(provinceId) },
  });

  if (!provinceExists) {
    return res.status(400).json({ error: "Invalid ProvinceID" });
  }

  try {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserAuth = await prisma.userAuth.create({
      data: {
        Username: username,
        Email: email,
        Password: hashedPassword,
        VerificationToken: verificationToken,
        Role: role || "user", // default role
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

    res.status(200).json({
      message: "User successfully registered",
      data: { userId: newUser.UserID, username, email },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const userAuth = await prisma.userAuth.findUnique({
    where: { VerificationToken: token },
  });
  if (!userAuth) {
    return res.status(400).json({ error: "Invalid verification token." });
  }

  await prisma.userAuth.update({
    where: { UserAuthID: userAuth.UserAuthID },
    data: { Verified: true, VerificationToken: null },
  });

  res.status(200).json({ message: "Email verified successfully!" });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userAuth = await prisma.userAuth.findUnique({
      where: { Username: username },
    });
    if (!userAuth) {
      return res.status(400).json({ error: "User does not exist" });
    }

    if (!userAuth.Verified) {
      return res
        .status(400)
        .json({ error: "Email not verified. Please verify your email first." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userAuth.Password);

    if (isPasswordCorrect) {
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

      res.status(200).json({
        message: "Login successful",
        userId: userAuth.UserAuthID,
        accessToken,
        refreshToken,
        accessTokenExp: ACCESS_TOKEN_EXPIRATION,
        refreshTokenExp: REFRESH_TOKEN_EXPIRATION,
        role: userAuth.Role,
      });
    } else {
      res.status(400).json({ error: "Password is incorrect" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};
