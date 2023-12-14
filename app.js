require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");

const cookieParser = require("cookie-parser");

const swaggerUi = require("swagger-ui-express");
const yaml = require("yaml");
const fs = require("fs");
const OpenApiValidator = require("express-openapi-validator");

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
const paymentRoutes = require("./payment/routes");

const app = express();
app.use(cookieParser());
applyMiddleware(app);

// const openApiPath = "doc/openapi2.yaml";
// const file = fs.readFileSync(openApiPath, "utf8");
// const swaggerDocument = yaml.parse(file);

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use(
//   OpenApiValidator.middleware({
//     apiSpec: openApiPath,
//     validateRequests: true,
//   })
// );

// app.use(databaseMiddleware);

app.use("/auth", authRoutes);
app.use("/appointments", authMiddleware, appointmentRoutes);

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

app.use("/blood-inventory", authMiddleware, bloodInventoryRoutes);

app.use("/blood-drive", authMiddleware, bloodDriveRoutes);
app.use("/province", provinceRoutes);
app.use("/blood-type", bloodTypesRoutes);
app.use("/", paymentRoutes);

// app.use(
//   "/admin",
//   authMiddleware,
//   authorizationMiddleware(["admin"]),
//   adminRoutes
// );

// app.use("/user", authMiddleware, authorizationMiddleware(["user"]), userRoutes);

app.use(errorFormatter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
