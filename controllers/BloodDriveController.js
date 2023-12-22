const { PrismaClient } = require("@prisma/client");
const Joi = require("joi");
const prisma = new PrismaClient();
const {
  notifyUsersAboutBloodDrive,
} = require("../services/bloodDriveNotificationService");
const redis = require("../config/redis");

const invalidateBloodDrivesCache = async () => {
  const keys = await redis.keys("bloodDrives:*");
  keys.forEach(async (key) => {
    await redis.del(key);
  });
};

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
    location: Joi.string().required(),
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
      location,
      designation,
      page,
      limit,
      orderBy,
    } = req.query;

    const cacheKey = `bloodDrives:${JSON.stringify(req.query)}`;
    const cachedBloodDrives = await redis.get(cacheKey);

    if (cachedBloodDrives) {
      return successResponse(
        res,
        "Blood drives fetched from cache",
        JSON.parse(cachedBloodDrives)
      );
    }

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
    if (location) {
      where.Province = {
        is: {
          Name: { contains: location, mode: "insensitive" },
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
      if (searchBy === "all" || searchBy === "location") {
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
    const response = {
      totalRecords,
      bloodDrives,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    };

    await redis.setex(cacheKey, 3600, JSON.stringify(response));

    successResponse(res, "Blood drives fetched successfully", response);
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
    const { institute, location, designation, scheduledDate } = req.body; // Updated to location

    const validationError = validateCreateUpdateBloodDrive(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const province = await prisma.province.findFirst({
      where: { Name: location },
    });

    if (!province) {
      return errorResponse(res, "Invalid province name", 400);
    }

    const newBloodDrive = await prisma.bloodDrive.create({
      data: {
        UserID: userId,
        Institute: institute,
        ProvinceID: province.ProvinceID,
        Designation: designation,
        ScheduledDate: new Date(scheduledDate),
      },
      include: {
        Province: true,
      },
    });

    await invalidateBloodDrivesCache();

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
    const { institute, location, designation, scheduledDate } = req.body;

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

    let provinceId = existingBloodDrive.ProvinceID;
    if (location) {
      const province = await prisma.province.findFirst({
        where: { Name: location },
      });
      if (!province) {
        return errorResponse(res, "Province not found", 404);
      }
      provinceId = province.ProvinceID; // Use the ID of the found province
    }
    const updatedBloodDrive = await prisma.bloodDrive.update({
      where: { DriveID: bloodDriveIdInt },
      data: {
        Institute: institute || existingBloodDrive.Institute,
        ProvinceID: provinceId, // Updated with the province ID found
        Designation: designation || existingBloodDrive.Designation,
        ScheduledDate: scheduledDate
          ? new Date(scheduledDate)
          : existingBloodDrive.ScheduledDate,
      },
      include: {
        Province: true,
      },
    });

    await invalidateBloodDrivesCache();

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

    await invalidateBloodDrivesCache();

    successResponse(res, "Blood drive deleted successfully");
  } catch (error) {
    errorResponse(res, "Error deleting blood drive: " + error.message, 500);
  }
};

exports.getTotalBloodDrives = async (req, res) => {
  try {
    const totalBloodDrives = await prisma.bloodDrive.count();

    successResponse(res, "Total number of blood drives fetched successfully", {
      totalBloodDrives,
    });
  } catch (error) {
    errorResponse(
      res,
      "Error fetching the total number of blood drives: " + error.message,
      500
    );
  }
};
