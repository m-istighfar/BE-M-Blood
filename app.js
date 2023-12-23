require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const redis = require("./config/redis");
const cron = require("node-cron");
const cors = require("cors");
const scheduleReminderJob = require("./jobs/reminderJob");

const express = require("express");

const cookieParser = require("cookie-parser");

const swaggerUi = require("swagger-ui-express");
const yaml = require("yaml");
const fs = require("fs");
// const OpenApiValidator = require("express-openapi-validator");

const authMiddleware = require("./middleware/authenticationMiddleware");
const authorizationMiddleware = require("./middleware/authorizationMiddleware");
const errorFormatter = require("./middleware/errorFormatter");
const applyMiddleware = require("./middleware/index");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const helpOfferRoutes = require("./routes/helpOfferRoutes");
const bloodDriveRoutes = require("./routes/bloodDriveRoutes");
const bloodInventoryRoutes = require("./routes/bloodInventoryRoutes");
const provinceRoutes = require("./routes/provinceRoutes");
const bloodTypesRoutes = require("./routes/bloodTypesRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");

const { sendWhatsAppMessage } = require("./services/whatsappService");

const app = express();
app.use(cors());
// app.use(cookieParser());
applyMiddleware(app);

const openApiPath = "doc/openapi2.yaml";
const file = fs.readFileSync(openApiPath, "utf8");
const swaggerDocument = yaml.parse(file);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use(
//   OpenApiValidator.middleware({
//     apiSpec: openApiPath,
//     validateRequests: true,
//   })
// );

// app.use(databaseMiddleware);

app.use("/auth", authRoutes);
app.use("/appointments", authMiddleware, appointmentRoutes);

app.use("/emergency", authMiddleware, emergencyRoutes);

app.use("/help-offer", authMiddleware, helpOfferRoutes);

app.use("/blood-inventory", bloodInventoryRoutes);

app.use("/blood-drive", authMiddleware, bloodDriveRoutes);
app.use("/province", provinceRoutes);
app.use("/blood-type", bloodTypesRoutes);
app.use("/donation", donationRoutes);

app.use("/user", authMiddleware, userRoutes);

app.use(errorFormatter);

scheduleReminderJob();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
