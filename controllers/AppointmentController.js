const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, startDate, endDate, userId: queryUserId } = req.query;

    let queryOptions = {
      include: {
        BloodType: true,
      },
    };

    if (userRole === "admin") {
      if (queryUserId) {
        queryOptions.where = { UserID: parseInt(queryUserId) };
      }
    } else {
      queryOptions.where = { UserID: userId };
    }

    if (status) {
      queryOptions.where = { ...queryOptions.where, Status: status };
    }

    if (startDate && endDate) {
      queryOptions.where = {
        ...queryOptions.where,
        ScheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    const appointments = await prisma.appointment.findMany(queryOptions);

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching appointments: " + error.message,
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: parseInt(appointmentId) },
      include: {
        BloodType: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (userRole !== "admin" && appointment.UserID !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while fetching the appointment: " + error.message,
    });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, scheduledDate } = req.body;

    if (!scheduledDate || isNaN(new Date(scheduledDate).getTime())) {
      return res.status(400).json({ error: "Invalid scheduled date" });
    }

    const appointmentDate = new Date(scheduledDate);
    if (appointmentDate < new Date()) {
      return res
        .status(400)
        .json({ error: "Scheduled date cannot be in the past" });
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Province: true },
    });

    if (!userWithProvince?.Province) {
      return res
        .status(400)
        .json({ error: "User's province information is missing" });
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    const startOfDay = new Date(appointmentDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate).setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        UserID: userId,
        ScheduledDate: { gte: new Date(startOfDay), lte: new Date(endOfDay) },
      },
    });
    if (existingAppointment) {
      return res
        .status(400)
        .json({ error: "An appointment already exists on this date" });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        ScheduledDate: appointmentDate,
        Location: userWithProvince.Province.Capital,
      },
    });

    res.status(201).json({
      message: "Appointment created successfully",
      appointmentDetails: newAppointment,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while creating the appointment: " + error.message,
    });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, newScheduledDate } = req.body;

    if (!newScheduledDate || isNaN(new Date(newScheduledDate).getTime())) {
      return res.status(400).json({ error: "Invalid new scheduled date" });
    }

    const newAppointmentDate = new Date(newScheduledDate);
    if (newAppointmentDate < new Date()) {
      return res
        .status(400)
        .json({ error: "New scheduled date cannot be in the past" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
    });

    if (!appointment || appointment.UserID !== userId) {
      return res
        .status(404)
        .json({ error: "Appointment not found or user mismatch" });
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return res.status(400).json({
        error: "Cannot reschedule a completed or cancelled appointment",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        ScheduledDate: newAppointmentDate,
        Status: "rescheduled",
      },
    });

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      updatedAppointmentDetails: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while rescheduling the appointment: " +
        error.message,
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
    });

    if (!appointment || appointment.UserID !== userId) {
      return res
        .status(404)
        .json({ error: "Appointment not found or user mismatch" });
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return res.status(400).json({
        error: "Cannot cancel a completed or already cancelled appointment",
      });
    }

    if (new Date(appointment.ScheduledDate) < new Date()) {
      return res
        .status(400)
        .json({ error: "Cannot cancel a past appointment" });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        Status: "cancelled",
      },
    });

    res.status(200).json({
      message: "Appointment cancelled successfully",
      updatedAppointmentDetails: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while cancelling the appointment: " + error.message,
    });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (new Date(appointment.ScheduledDate) > new Date()) {
      return res.status(400).json({
        error: "Cannot complete an appointment that is in the future",
      });
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return res.status(400).json({
        error: "Cannot complete a cancelled or already completed appointment",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        Status: "completed",
      },
    });

    res.status(200).json({
      message: "Appointment marked as completed successfully",
      updatedAppointmentDetails: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while updating the appointment status: " +
        error.message,
    });
  }
};
