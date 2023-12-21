const { PrismaClient } = require("@prisma/client");
const e = require("express");
const redis = require("../config/redis");
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
    location: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateUpdateAppointment = (data) => {
  const schema = Joi.object({
    bloodType: Joi.string().optional(),
    scheduledDate: Joi.date().min("now").optional(),
    location: Joi.string().optional(),
    status: Joi.string()
      .valid("scheduled", "completed", "cancelled", "rescheduled")
      .optional(),
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
      searchBy,
      query,
      bloodType,
      scheduledDate,
      location,
      status,
      page,
      limit,
      orderBy,
    } = req.query;

    const cacheKey = `appointments:${JSON.stringify(req.query)}`;
    const cachedAppointments = await redis.get(cacheKey);

    if (cachedAppointments) {
      return successResponse(
        res,
        "Appointments fetched from cache",
        JSON.parse(cachedAppointments)
      );
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    let where = {};

    if (bloodType) {
      const bloodTypeRecord = await prisma.bloodType.findFirst({
        where: { Type: { equals: bloodType, mode: "insensitive" } },
      });
      if (bloodTypeRecord) {
        where.BloodTypeID = bloodTypeRecord.BloodTypeID;
      }
    }

    if (scheduledDate) {
      const date = new Date(scheduledDate);
      where.ScheduledDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (status) {
      where.Status = status;
    }

    if (searchBy && query) {
      const searchConditions = [];
      if (searchBy === "all" || searchBy === "bloodType") {
        const bloodTypeRecord = await prisma.bloodType.findFirst({
          where: { Type: { equals: query, mode: "insensitive" } },
        });
        if (bloodTypeRecord) {
          searchConditions.push({ BloodTypeID: bloodTypeRecord.BloodTypeID });
        }
      }

      if (searchBy === "all" || searchBy === "location") {
        searchConditions.push({
          Location: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "status") {
        const validStatuses = [
          "scheduled",
          "completed",
          "cancelled",
          "rescheduled",
        ];
        if (validStatuses.includes(query.toLowerCase())) {
          searchConditions.push({ Status: query.toLowerCase() });
        }
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    let orderByClause = {};

    if (orderBy) {
      const [field, order] = orderBy.split(":");
      if (["asc", "desc"].includes(order.toLowerCase())) {
        orderByClause[field] = order.toLowerCase();
      }
    } else {
      orderByClause = { ScheduledDate: "asc" };
    }

    const appointments = await prisma.appointment.findMany({
      where: where,
      skip: offset,
      take: pageSize,
      orderBy: orderByClause,
      include: {
        BloodType: true,
      },
    });

    const totalRecords = await prisma.appointment.count({ where: where });

    await redis.setex(
      cacheKey,
      3600,
      JSON.stringify({ totalRecords, appointments })
    );

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
    const { bloodType, scheduledDate, location } = req.body;

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

    const userProvince = userWithProvince.Province;

    if (location) {
      const provinceExists = await prisma.province.findFirst({
        where: { Name: { equals: location, mode: "insensitive" } },
      });

      if (!provinceExists) {
        return errorResponse(res, "Invalid location: Province not found");
      }
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
        Location: location || userProvince.Name,
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

    console.log(appointment);

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

exports.updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.params;
    const { bloodType, scheduledDate, location, status } = req.body;

    const validationError = validateUpdateAppointment(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    let bloodTypeId = null;
    if (bloodType) {
      const bloodTypeRecord = await prisma.bloodType.findFirst({
        where: { Type: bloodType },
      });

      if (!bloodTypeRecord) {
        return errorResponse(res, "Invalid blood type", 400);
      }

      bloodTypeId = bloodTypeRecord.BloodTypeID;
    }

    const updateData = {};
    if (bloodTypeId) updateData.BloodTypeID = bloodTypeId;
    if (scheduledDate) updateData.ScheduledDate = new Date(scheduledDate);
    if (location) updateData.Location = location;
    if (status) updateData.Status = status;

    const updatedAppointment = await prisma.appointment.update({
      where: { AppointmentID: parseInt(appointmentId) },
      data: updateData,
    });

    successResponse(
      res,
      "Appointment updated successfully",
      updatedAppointment
    );
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while updating the appointment: " + error.message,
      500
    );
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    // const userId = req.user.id;
    // const userRole = req.user.role;
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { AppointmentID: parseInt(appointmentId) },
    });

    if (!appointment) {
      return errorResponse(res, "Appointment not found", 404);
    }

    // if (userRole !== "admin" && appointment.UserID !== userId) {
    //   return errorResponse(res, "Unauthorized to delete this appointment", 401);
    // }

    await prisma.appointment.delete({
      where: { AppointmentID: parseInt(appointmentId) },
    });

    successResponse(res, "Appointment deleted successfully");
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while deleting the appointment: " + error.message,
      500
    );
  }
};

exports.getTotalAppointments = async (req, res) => {
  try {
    const totalAppointments = await prisma.appointment.count();

    successResponse(res, "Total number of appointments fetched successfully", {
      totalAppointments,
    });
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching the total number of appointments: " +
        error.message,
      500
    );
  }
};
