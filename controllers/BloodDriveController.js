const { PrismaClient } = require("@prisma/client");
const Joi = require("joi");
const prisma = new PrismaClient();
const {
  notifyUsersAboutBloodDrive,
} = require("../services/bloodDriveNotificationService");

const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(data ? { message, data } : { message });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateBloodDriveQuery = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    filterProvince: Joi.number().integer().optional(),
    filterDesignation: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateCreateUpdateBloodDrive = (data) => {
  const schema = Joi.object({
    institute: Joi.string().required(),
    provinceId: Joi.number().integer().required(),
    designation: Joi.string().required(),
    scheduledDate: Joi.date().min("now").required(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

exports.getAllBloodDrives = async (req, res) => {
  try {
    const {
      searchBy,
      query,
      institute,
      scheduledDate,
      provinceName,
      designation,
      page,
      limit,
      orderBy,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    let where = {};

    if (institute) {
      where.Institute = { contains: institute, mode: "insensitive" };
    }
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      where.ScheduledDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (provinceName) {
      where.Province = {
        is: {
          Name: { contains: provinceName, mode: "insensitive" },
        },
      };
    }
    if (designation) {
      where.Designation = { contains: designation, mode: "insensitive" };
    }

    if (searchBy && query) {
      const searchConditions = [];
      if (searchBy === "all" || searchBy === "institute") {
        searchConditions.push({
          Institute: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "designation") {
        searchConditions.push({
          Designation: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "provinceName") {
        searchConditions.push({
          Province: {
            is: {
              Name: { contains: query, mode: "insensitive" },
            },
          },
        });
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

    const bloodDrives = await prisma.bloodDrive.findMany({
      where: where,
      skip: offset,
      take: pageSize,
      orderBy: orderByClause,
      include: {
        Province: true,
        User: true,
      },
    });

    const totalRecords = await prisma.bloodDrive.count({ where: where });

    successResponse(res, "Blood drives fetched successfully", {
      totalRecords,
      bloodDrives,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    errorResponse(res, "Error fetching blood drives: " + error.message, 500);
  }
};

exports.getBloodDriveById = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;

    const bloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: parseInt(bloodDriveId) },
      include: {
        Province: true,
        User: true,
      },
    });

    if (!bloodDrive) {
      return errorResponse(res, "Blood drive not found", 404);
    }

    successResponse(res, "Blood drive fetched successfully", bloodDrive);
  } catch (error) {
    errorResponse(res, "Error fetching blood drive: " + error.message, 500);
  }
};

exports.createBloodDrive = async (req, res) => {
  try {
    const userId = req.user.id;
    const { institute, provinceId, designation, scheduledDate } = req.body;

    const validationError = validateCreateUpdateBloodDrive(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const provinceIdInt = parseInt(provinceId, 10);

    const provinceExists = await prisma.province.findUnique({
      where: { ProvinceID: provinceIdInt },
    });

    if (!provinceExists) {
      return errorResponse(res, "Invalid ProvinceID", 400);
    }

    const newBloodDrive = await prisma.bloodDrive.create({
      data: {
        UserID: userId,
        Institute: institute,
        ProvinceID: provinceIdInt,
        Designation: designation,
        ScheduledDate: new Date(scheduledDate),
      },
      include: {
        Province: true,
      },
    });

    notifyUsersAboutBloodDrive(newBloodDrive, true);

    successResponse(
      res,
      "Blood drive created successfully",
      newBloodDrive,
      201
    );
  } catch (error) {
    errorResponse(res, "Error creating the blood drive: " + error.message, 500);
  }
};

exports.updateBloodDrive = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;
    const { institute, provinceId, designation, scheduledDate } = req.body;

    const validationError = validateCreateUpdateBloodDrive(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const bloodDriveIdInt = parseInt(bloodDriveId, 10);

    const existingBloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: bloodDriveIdInt },
    });

    if (!existingBloodDrive) {
      return errorResponse(res, "Blood drive not found", 404);
    }

    const updatedBloodDrive = await prisma.bloodDrive.update({
      where: { DriveID: bloodDriveIdInt },
      data: {
        Institute: institute || existingBloodDrive.Institute,
        ProvinceID: provinceId
          ? parseInt(provinceId, 10)
          : existingBloodDrive.ProvinceID,
        Designation: designation || existingBloodDrive.Designation,
        ScheduledDate: scheduledDate
          ? new Date(scheduledDate)
          : existingBloodDrive.ScheduledDate,
      },
      include: {
        Province: true,
      },
    });

    notifyUsersAboutBloodDrive(updatedBloodDrive, false);

    successResponse(res, "Blood drive updated successfully", updatedBloodDrive);
  } catch (error) {
    errorResponse(res, "Error updating blood drive: " + error.message, 500);
  }
};

exports.deleteBloodDrive = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;
    const bloodDriveIdInt = parseInt(bloodDriveId, 10);

    const existingBloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: bloodDriveIdInt },
    });

    if (!existingBloodDrive) {
      return errorResponse(res, "Blood drive not found", 404);
    }

    await prisma.bloodDrive.delete({
      where: { DriveID: bloodDriveIdInt },
    });

    successResponse(res, "Blood drive deleted successfully");
  } catch (error) {
    errorResponse(res, "Error deleting blood drive: " + error.message, 500);
  }
};
