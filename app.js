require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yaml");
const fs = require("fs");
const OpenApiValidator = require("express-openapi-validator");

const databaseMiddleware = require("./middleware/databaseMiddleware");
const authMiddleware = require("./middleware/authenticationMiddleware");
const authorizationMiddleware = require("./middleware/authorizationMiddleware");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors());

const openApiPath = "doc/openapi.yaml";
const file = fs.readFileSync(openApiPath, "utf8");
const swaggerDocument = yaml.parse(file);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
  OpenApiValidator.middleware({
    apiSpec: openApiPath,
    validateRequests: true,
  })
);

app.use(databaseMiddleware);

app.use("/auth", authRoutes);
app.use(
  "/admin",
  authMiddleware,
  authorizationMiddleware(["admin"]),
  adminRoutes
);

app.use("/user", authMiddleware, authorizationMiddleware(["user"]), userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
