const { PrismaClient } = require("@prisma/client");
const e = require("express");
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
    appointmentId: Joi.number().integer().required(),
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

    successResponse(res, "Appointments fetched successfully", {
      totalRecords,
      appointments,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching appointments: " + error.message,
      500
    );
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
      return errorResponse(res, "Appointment not found", 404);
    }

    if (userRole !== "admin" && appointment.UserID !== userId) {
      return errorResponse(res, "Unauthorized", 401);
    }

    return successResponse(
      res,
      "Appointment fetched successfully",
      appointment
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching appointment: " + error.message,
      500
    );
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
      return errorResponse(res, "Invalid scheduled date");
    }

    const appointmentDate = new Date(scheduledDate);
    if (appointmentDate < new Date()) {
      return errorResponse(res, "Appointment date must be in the future");
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Province: true },
    });

    if (!userWithProvince?.Province) {
      return errorResponse(res, "User does not have a province");
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return errorResponse(res, "Invalid blood type");
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
      return errorResponse(
        res,
        "User already has an appointment scheduled for this day"
      );
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        ScheduledDate: appointmentDate,
        Location: userWithProvince.Province.Capital,
      },
    });

    successResponse(
      res,
      "Appointment created successfully",
      newAppointment,
      201
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while creating the appointment: " + error.message,
      500
    );
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, newScheduledDate } = req.body;

    const validationError = validateRescheduleAppointment(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    if (!newScheduledDate || isNaN(new Date(newScheduledDate).getTime())) {
      return errorResponse(res, "Invalid new scheduled date");
    }

    const newAppointmentDate = new Date(newScheduledDate);
    if (newAppointmentDate < new Date()) {
      return errorResponse(res, "New appointment date must be in the future");
    }

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
    });

    if (!appointment || appointment.UserID !== userId) {
      return errorResponse(res, "Appointment not found or user mismatch");
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return errorResponse(
        res,
        "Cannot reschedule a completed or already cancelled appointment"
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        ScheduledDate: newAppointmentDate,
        Status: "rescheduled",
      },
    });

    successResponse(
      res,
      "Appointment rescheduled successfully",
      updatedAppointment
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while rescheduling the appointment: " + error.message,
      500
    );
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
      return errorResponse(res, "Appointment not found or user mismatch");
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return errorResponse(
        res,
        "Cannot cancel a completed or already cancelled appointment"
      );
    }

    if (new Date(appointment.ScheduledDate) < new Date()) {
      return errorResponse(res, "Cannot cancel an appointment in the past");
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        Status: "cancelled",
      },
    });

    successResponse(
      res,
      "Appointment cancelled successfully",
      updatedAppointment
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while cancelling the appointment: " + error.message,
      500
    );
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
    });

    if (!appointment) {
      return errorResponse(res, "Appointment not found");
    }

    if (new Date(appointment.ScheduledDate) > new Date()) {
      return errorResponse(
        res,
        "Cannot complete an appointment that is in the future"
      );
    }

    if (
      appointment.Status === "completed" ||
      appointment.Status === "cancelled"
    ) {
      return errorResponse(
        res,
        "Cannot complete a completed or already cancelled appointment"
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: appointmentId },
      data: {
        Status: "completed",
      },
    });

    successResponse(
      res,
      "Appointment completed successfully",
      updatedAppointment
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while completing the appointment: " + error.message,
      500
    );
  }
};
