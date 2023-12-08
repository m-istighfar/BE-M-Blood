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
