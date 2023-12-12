const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");

const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(data ? { message, data } : { message });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateAppointmentQuery = (data) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid("scheduled", "completed", "cancelled", "rescheduled")
      .optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    userId: Joi.number().integer().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateCreateAppointment = (data) => {
  const schema = Joi.object({
    bloodType: Joi.string().required(),
    scheduledDate: Joi.date().min("now").required(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateRescheduleAppointment = (data) => {
  const schema = Joi.object({
    newScheduledDate: Joi.date().min("now").required(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      status,
      startDate,
      endDate,
      userId: queryUserId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const validationError = validateAppointmentQuery(req.query);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;
    const sortingCriteria = sortBy || "ScheduledDate";
    const sortingOrder = sortOrder === "desc" ? "desc" : "asc";

    const validStatuses = [
      "scheduled",
      "completed",
      "cancelled",
      "rescheduled",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid appointment status" });
    }

    let queryOptions = {
      skip: offset,
      take: pageSize,
      orderBy: {
        [sortingCriteria]: sortingOrder,
      },
      include: {
        BloodType: true,
      },
    };

    if (userRole === "admin" && queryUserId) {
      queryOptions.where = { UserID: parseInt(queryUserId) };
    } else {
      queryOptions.where = { UserID: userId };
    }

    if (status) {
      queryOptions.where.Status = status;
    }

    if (startDate && endDate) {
      queryOptions.where.ScheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const appointments = await prisma.appointment.findMany(queryOptions);
    const totalRecords = await prisma.appointment.count({
      where: queryOptions.where,
    });

    res.status(200).json({
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: pageNumber,
      appointments,
    });
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

    const validationError = validateCreateAppointment(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

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
