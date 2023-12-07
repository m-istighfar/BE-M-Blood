require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");

const authMiddleware = require("./middleware/authenticationMiddleware");
const authorizationMiddleware = require("./middleware/authorizationMiddleware");
const applyMiddleware = require("./middleware/index");

const authRoutes = require("./routes/authRoutes");

const app = express();
applyMiddleware(app);

app.use("/auth", authRoutes);

app.use("/user", authMiddleware, authorizationMiddleware(["user"]), userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
