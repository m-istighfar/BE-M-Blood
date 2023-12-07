great, lets start with auth

1. **Username**: [Text field]
2. **Email**: [Email field]
3. **Password**: [Password field]
4. **Name**: [Text field]
5. **Phone Number**: [Text field]
6. **Province**: [Dropdown menu populated with provinces]
7. **Additional Info**: [Textarea, optional]


this is my code from last project, create like this or better

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const crypto = require("crypto");
require("dotenv").config();
const { sendVerificationEmail } = require("../services/mailService");

const {
  JWT_SIGN,
  JWT_REFRESH_SIGN,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} = require("../config/jwt");

const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser)
    return res.status(400).json({ error: "User already exists" });

  try {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      verificationToken,
    });

    await newUser.save();

    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      message: "User successfully registered",
      data: newUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return res.status(400).json({ error: "Invalid verification token." });
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({ message: "Email verified successfully!" });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (!existingUser)
      return res.status(400).json({ error: "User does not exist" });

    if (!existingUser.verified)
      return res.status(400).json({
        error: "Email not verified. Please verify your email first.",
      });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isPasswordCorrect) {
      const accessToken = jwt.sign(
        {
          username: existingUser.username,
          id: existingUser._id,
          role: existingUser.role,
        },
        JWT_SIGN,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );

      const refreshToken = jwt.sign(
        {
          username: existingUser.username,
          id: existingUser._id,
          role: existingUser.role,
        },
        JWT_REFRESH_SIGN,
        { expiresIn: REFRESH_TOKEN_EXPIRATION }
      );

      res.status(200).json({
        message: "Login successful",
        userId: existingUser._id,
        accessToken,
        refreshToken,
        accessTokenExp: ACCESS_TOKEN_EXPIRATION,
        refreshTokenExp: REFRESH_TOKEN_EXPIRATION,
        role: existingUser.role,
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
