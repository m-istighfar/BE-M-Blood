require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const redis = require("./config/redis");
const cron = require("node-cron");
const scheduleReminderJob = require("./jobs/reminderJob");

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
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./payment/routes");

const { sendWhatsAppMessage } = require("./services/whatsappService");

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

app.use("/blood-inventory", bloodInventoryRoutes);

app.use("/blood-drive", authMiddleware, bloodDriveRoutes);
app.use("/province", provinceRoutes);
app.use("/blood-type", bloodTypesRoutes);
app.use("/", paymentRoutes);

app.use("/user", authMiddleware, userRoutes);

// app.use(
//   "/admin",
//   authMiddleware,
//   authorizationMiddleware(["admin"]),
//   adminRoutes
// );

// app.use("/user", authMiddleware, authorizationMiddleware(["user"]), userRoutes);

app.use(errorFormatter);

// const accountSid = "AC0a91b703fdd066dd92f4be195bddfd24";
// const authToken = "bc37f1c53e8937627f198483b1403a0b";
// const client = require("twilio")(accountSid, authToken);

// // Route for sending WhatsApp messages
// app.post("/send-message", (req, res) => {
//   const { messageBody, recipientNumber } = req.body;

//   client.messages
//     .create({
//       body: messageBody,
//       from: "whatsapp:+14155238886", // Your Twilio WhatsApp number
//       to: `whatsapp:${recipientNumber}`, // Recipient's number
//     })
//     .then((message) => {
//       console.log(message.sid);
//       res.status(200).send("Message sent successfully");
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).send("Failed to send message");
//     });
// });
// const sendRemindersForUpcomingAppointments = async () => {
//   try {
//     const oneHourLater = new Date(new Date().getTime() + 60 * 60 * 1000);

//     const upcomingAppointments = await prisma.appointment.findMany({
//       where: {
//         ScheduledDate: {
//           gte: new Date(),
//           lt: oneHourLater,
//         },
//         Status: "scheduled",
//         ReminderSent: false,
//       },
//       include: {
//         User: true,
//       },
//     });

//     for (const appointment of upcomingAppointments) {
//       const reminderMessage = `Reminder: You have an appointment scheduled at ${appointment.ScheduledDate.toLocaleString()}.`;
//       await sendWhatsAppMessage(appointment.User.Phone, reminderMessage);

//       // Update the appointment to mark the reminder as sent
//       await prisma.appointment.update({
//         where: {
//           AppointmentID: appointment.AppointmentID,
//         },
//         data: {
//           ReminderSent: true,
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error sending reminders:", error);
//   }
// };

// const sendRemindersForUpcomingAppointments = async () => {
//   try {
//     const oneHourLater = new Date(new Date().getTime() + 60 * 60 * 1000);

//     const upcomingAppointments = await prisma.appointment.findMany({
//       where: {
//         ScheduledDate: {
//           gte: new Date(),
//           lt: oneHourLater,
//         },
//         Status: "scheduled",
//       },
//       include: {
//         User: true,
//       },
//     });
//     console.log("Upcoming Appointments:", upcomingAppointments);
//   } catch (error) {
//     console.error("Error sending reminders:", error);
//   }

// scheduleReminderJob();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
