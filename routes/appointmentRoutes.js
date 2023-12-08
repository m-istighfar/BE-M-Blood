const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");

router.post("/create", AppointmentController.createAppointment);
router.post("/reschedule", AppointmentController.rescheduleAppointment);

module.exports = router;
