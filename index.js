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

app.use(
  "/blood-drive",
  authMiddleware,
  authorizationMiddleware(["user"]),
  bloodDriveRoutes
);

app.use(errorFormatter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
