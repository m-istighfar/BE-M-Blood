//app.js

// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model BloodType {
  BloodTypeID       Int                @id @default(autoincrement())
  Type              String             @unique
  Appointments      Appointment[]
  EmergencyRequests EmergencyRequest[]
  BloodInventories  BloodInventory[]
  HelpOffer         HelpOffer[]
}

model UserAuth {
  UserAuthID            Int       @id @default(autoincrement())
  Username              String    @unique
  Email                 String    @unique
  Password              String
  Role                  UserRole
  ResetPasswordToken    String?   @unique
  ResetPasswordExpires  DateTime?
  Verified              Boolean   @default(false)
  VerificationToken     String?   @unique
  User                  User?     @relation(fields: [UserID], references: [UserID])
  UserID                Int?      @unique
  CreatedAt             DateTime  @default(now())
  UpdatedAt             DateTime  @updatedAt
}

model User {
  UserID          Int            @id @default(autoincrement())
  ProvinceID      Int
  Province        Province       @relation(fields: [ProvinceID], references: [ProvinceID])
  Name            String
  Phone           String
  AdditionalInfo  String?
  Appointments    Appointment[]
  EmergencyRequests EmergencyRequest[]
  HelpOffers      HelpOffer[]
  BloodDrives     BloodDrive[]
  UserAuth        UserAuth?
  CreatedAt       DateTime       @default(now())
  UpdatedAt       DateTime       @updatedAt
}

model Province {
  ProvinceID      Int          @id @default(autoincrement())
  Name            String
  Capital         String
  Users           User[]
  BloodDrives     BloodDrive[]
  BloodInventories BloodInventory[]
  CreatedAt       DateTime     @default(now())
  UpdatedAt       DateTime     @updatedAt
}

model Appointment {
  AppointmentID   Int           @id @default(autoincrement())
  UserID          Int
  User            User          @relation(fields: [UserID], references: [UserID])
  BloodTypeID     Int
  BloodType       BloodType     @relation(fields: [BloodTypeID], references: [BloodTypeID])
  ScheduledDate   DateTime
  Location        String? 
  Status          AppointmentStatus @default(scheduled)
  CreatedAt       DateTime      @default(now())
  UpdatedAt       DateTime      @updatedAt
}

model EmergencyRequest {
  RequestID       Int           @id @default(autoincrement())
  UserID          Int
  User            User          @relation(fields: [UserID], references: [UserID])
  BloodTypeID     Int
  BloodType       BloodType     @relation(fields: [BloodTypeID], references: [BloodTypeID])
  RequestDate     DateTime
  Location        String
  AdditionalInfo  String?
  CreatedAt       DateTime      @default(now())
  UpdatedAt       DateTime      @updatedAt
}

model HelpOffer {
  OfferID            Int        @id @default(autoincrement())
  UserID             Int
  User               User       @relation(fields: [UserID], references: [UserID])
  BloodTypeID        Int        
  BloodType          BloodType  @relation(fields: [BloodTypeID], references: [BloodTypeID])
  IsWillingToDonate  Boolean    @default(false)
  CanHelpInEmergency Boolean    @default(false)
  Location           String
  Reason             String?    
  CreatedAt          DateTime   @default(now())
  UpdatedAt          DateTime   @updatedAt
}



model BloodDrive {
  DriveID         Int           @id @default(autoincrement())
  UserID          Int
  User            User          @relation(fields: [UserID], references: [UserID])
  Institute       String
  ProvinceID      Int
  Province        Province      @relation(fields: [ProvinceID], references: [ProvinceID])
  Designation     String
  ScheduledDate   DateTime
  CreatedAt       DateTime      @default(now())
  UpdatedAt       DateTime      @updatedAt
}

model BloodInventory {
  InventoryID     Int           @id @default(autoincrement())
  BloodTypeID     Int
  BloodType       BloodType     @relation(fields: [BloodTypeID], references: [BloodTypeID])
  Quantity        Int
  ExpiryDate      DateTime
  ProvinceID      Int
  Province        Province      @relation(fields: [ProvinceID], references: [ProvinceID])
  CreatedAt       DateTime      @default(now())
  UpdatedAt       DateTime      @updatedAt
}

enum UserRole {
  admin
  user
}

enum AppointmentStatus {
  scheduled
  completed
  cancelled
  rescheduled
}

// app.js

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");

const cookieParser = require("cookie-parser");

const authMiddleware = require("./middleware/authenticationMiddleware");
const authorizationMiddleware = require("./middleware/authorizationMiddleware");
const errorFormatter = require("./middleware/errorFormatter");
const applyMiddleware = require("./middleware/index");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const helpOfferRoutes = require("./routes/helpOfferRoutes");
const bloodDriveRoutes = require("./routes/bloodDriveRoutes");

const app = express();
app.use(cookieParser());
applyMiddleware(app);

app.use("/auth", authRoutes);
app.use(
  "/appointments",
  authMiddleware,
  authorizationMiddleware(["user"]),
  appointmentRoutes
);

app.use(
  "/emergency",
  authMiddleware,
  authorizationMiddleware(["user"]),
  emergencyRoutes
);

app.use(
  "/help-offer",
  authMiddleware,
  authorizationMiddleware(["user"]),
  helpOfferRoutes
);

app.use("/blood-drive", authMiddleware, bloodDriveRoutes);

app.use(errorFormatter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

// middleware

const jwt = require("jsonwebtoken");
const { JWT_SIGN } = require("../config/jwt.js");

const authenticationMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SIGN);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = authenticationMiddleware;

const jwt = require("jsonwebtoken");
const { JWT_SIGN } = require("../config/jwt.js");

const authorizationMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, JWT_SIGN);

      if (allowedRoles.includes(decodedToken.role)) {
        next();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
};

module.exports = authorizationMiddleware;

//routes

const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const PasswordResetController = require("../controllers/PasswordResetController");

const { rateLimit } = require("express-rate-limit");

const UserRateLimitStore = require("../utils/UserRateLimitStore");

const windowMs = 15 * 60 * 1000;

const userRateLimitStoreInstance = new UserRateLimitStore(windowMs);

const userLoginLimiter = rateLimit({
  store: userRateLimitStoreInstance,
  windowMs: windowMs,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many failed login attempts, please try again after 15 minutes.",
  },
  keyGenerator: (req) => {
    const key = req.body.username;
    console.log(`Generating key for rate limiter: ${key}`);
    return key;
  },
});

router.post("/login", userLoginLimiter, AuthController.login);

router.post("/register", AuthController.register);
router.get("/verify-email/:token", AuthController.verifyEmail);

router.post(
  "/request-password-reset",
  PasswordResetController.requestPasswordReset
);

router.post(
  "/reset-password/:resetToken",
  PasswordResetController.resetPassword
);

module.exports = router;

const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const authorizationMiddleware = require("../middleware/authorizationMiddleware");

router.get("/", AppointmentController.getAppointments);
router.get("/:appointmentId", AppointmentController.getAppointmentById);
router.post("/create", AppointmentController.createAppointment);
router.post("/reschedule", AppointmentController.rescheduleAppointment);
router.post("/cancel", AppointmentController.cancelAppointment);

router.post(
  "/complete",
  authorizationMiddleware(["admin"]),
  AppointmentController.completeAppointment
);

module.exports = router;

const express = require("express");
const router = express.Router();
const BloodDriveController = require("../controllers/BloodDriveController");

router.post("/create", BloodDriveController.createBloodDrive);
router.get("/", BloodDriveController.getAllBloodDrives);
router.get("/:bloodDriveId", BloodDriveController.getBloodDriveById);
router.put("/:bloodDriveId", BloodDriveController.updateBloodDrive);
router.delete("/:bloodDriveId", BloodDriveController.deleteBloodDrive);

module.exports = router;

const express = require("express");
const router = express.Router();
const bloodInventoryController = require("../controllers/BloodInventoryController");

router.post("/", bloodInventoryController.createBloodInventory);

router.get("/", bloodInventoryController.getBloodInventories);
router.get("/:inventoryID", bloodInventoryController.getBloodInventoryById);

router.put("/:inventoryID", bloodInventoryController.updateBloodInventory);

router.delete("/:inventoryID", bloodInventoryController.deleteBloodInventory);

module.exports = router;

const express = require("express");
const router = express.Router();
const EmergencyController = require("../controllers/EmergencyController");

router.post("/request", EmergencyController.createEmergencyRequest);

router.get("/", EmergencyController.getAllEmergencyRequests);

router.get("/:emergencyRequestId", EmergencyController.getEmergencyRequestById);

router.put("/:emergencyRequestId", EmergencyController.updateEmergencyRequest);

router.delete(
  "/:emergencyRequestId",
  EmergencyController.deleteEmergencyRequest
);

module.exports = router;

const express = require("express");
const router = express.Router();
const HelpOfferController = require("../controllers/HelpOfferController");

router.post("/offer", HelpOfferController.createHelpOffer);

module.exports = router;

//controller

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
  const response = { message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(200).json(response);
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

const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const authorizationMiddleware = require("../middleware/authorizationMiddleware");

router.get("/", AppointmentController.getAppointments);
router.get("/:appointmentId", AppointmentController.getAppointmentById);
router.post("/create", AppointmentController.createAppointment);
router.post("/reschedule", AppointmentController.rescheduleAppointment);
router.post("/cancel", AppointmentController.cancelAppointment);

router.post(
  "/complete",
  authorizationMiddleware(["admin"]),
  AppointmentController.completeAppointment
);

module.exports = router;

const express = require("express");
const router = express.Router();
const BloodDriveController = require("../controllers/BloodDriveController");

router.post("/create", BloodDriveController.createBloodDrive);
router.get("/", BloodDriveController.getAllBloodDrives);
router.get("/:bloodDriveId", BloodDriveController.getBloodDriveById);
router.put("/:bloodDriveId", BloodDriveController.updateBloodDrive);
router.delete("/:bloodDriveId", BloodDriveController.deleteBloodDrive);

module.exports = router;

const express = require("express");
const router = express.Router();
const bloodInventoryController = require("../controllers/BloodInventoryController");

router.post("/", bloodInventoryController.createBloodInventory);

router.get("/", bloodInventoryController.getBloodInventories);
router.get("/:inventoryID", bloodInventoryController.getBloodInventoryById);

router.put("/:inventoryID", bloodInventoryController.updateBloodInventory);

router.delete("/:inventoryID", bloodInventoryController.deleteBloodInventory);

module.exports = router;

const express = require("express");
const router = express.Router();
const EmergencyController = require("../controllers/EmergencyController");

router.post("/request", EmergencyController.createEmergencyRequest);

router.get("/", EmergencyController.getAllEmergencyRequests);

router.get("/:emergencyRequestId", EmergencyController.getEmergencyRequestById);

router.put("/:emergencyRequestId", EmergencyController.updateEmergencyRequest);

router.delete(
  "/:emergencyRequestId",
  EmergencyController.deleteEmergencyRequest
);

module.exports = router;

const express = require("express");
const router = express.Router();
const HelpOfferController = require("../controllers/HelpOfferController");

router.post("/offer", HelpOfferController.createHelpOffer);

module.exports = router;

//service

const nodemailer = require("nodemailer");
const smtp = require("nodemailer-smtp-transport");

const FE_URL = process.env.FE_URL;

const transporter = nodemailer.createTransport(
  smtp({
    service: "gmail",
    auth: {
      user: "daiqijb105@gmail.com",
      pass: "vezv gnsv qvne poca",
    },
  })
);

const sendMail = async (options) => {
  try {
    await transporter.sendMail(options);
    return { success: true };
  } catch (error) {
    console.error("Mail send error:", error);
    return { success: false, error };
  }
};

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${FE_URL}/verify-email/${token}`;

  const mailOptions = {
    from: "daiqijb105@gmail.com",
    to: email,
    subject: "Email Verification",
    text: `Click on the link to verify your email: ${verificationLink}`,
  };

  return await sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${FE_URL}/reset-password/${resetToken}`;
  const mailOptions = {
    from: "daiqijb105@gmail.com",
    to: email,
    subject: "Password Reset Request",
    text: `Please click on the following link, or paste this into your browser to complete the process within one hour: \n\n${resetLink}\n\n If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  return await sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};


