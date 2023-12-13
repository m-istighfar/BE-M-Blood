const { PrismaClient } = require("@prisma/client");
const Joi = require("joi");
const prisma = new PrismaClient();

const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(data ? { message, data } : { message });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateEmergencyRequestQuery = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    bloodType: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    provinceId: Joi.number().integer().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").optional(),
    status: Joi.string()
      .valid("pending", "inProgress", "fulfilled", "expired", "cancelled")
      .optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateCreateEmergencyRequest = (data) => {
  const schema = Joi.object({
    bloodType: Joi.string().required(),
    additionalInfo: Joi.string().allow("").optional(),
    location: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateUpdateEmergencyRequest = (data) => {
  const schema = Joi.object({
    additionalInfo: Joi.string().allow("").optional(),
    bloodType: Joi.string().optional(),
    location: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateUpdateEmergencyRequestStatus = (data) => {
  const schema = Joi.object({
    newStatus: Joi.string()
      .valid("pending", "inProgress", "fulfilled", "expired", "cancelled")
      .required(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

exports.getAllEmergencyRequests = async (req, res) => {
  try {
    const {
      page,
      limit,
      bloodType,
      startDate,
      endDate,
      provinceId,
      status,
      sortBy,
      sortOrder,
    } = req.query;

    console.log(req.query);

    const validationError = validateEmergencyRequestQuery(req.query);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;
    const sortingCriteria = sortBy || "RequestDate";
    const sortingOrder = sortOrder === "desc" ? "desc" : "asc";

    let whereClause = {};
    if (bloodType) whereClause.BloodTypeID = parseInt(bloodType);
    if (startDate && endDate) {
      whereClause.RequestDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (provinceId) whereClause.User = { ProvinceID: parseInt(provinceId) };
    if (status) whereClause.Status = status;

    const emergencyRequests = await prisma.emergencyRequest.findMany({
      skip: offset,
      take: pageSize,
      orderBy: { [sortingCriteria]: sortingOrder },
      where: whereClause,
      include: {
        BloodType: true,
        User: { select: { Name: true, Province: true } },
      },
    });

    const totalRequests = await prisma.emergencyRequest.count({
      where: whereClause,
    });

    successResponse(res, "Emergency requests fetched successfully", {
      totalRequests,
      emergencyRequests,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRequests / pageSize),
    });
  } catch (error) {
    errorResponse(
      res,
      "Error fetching emergency requests: " + error.message,
      500
    );
  }
};

exports.getEmergencyRequestById = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
      include: {
        BloodType: true,
        User: true,
      },
    });

    if (!emergencyRequest) {
      return errorResponse(res, "Emergency request not found", 404);
    }

    successResponse(
      res,
      "Emergency request fetched successfully",
      emergencyRequest
    );
  } catch (error) {
    errorResponse(
      res,
      "Error fetching emergency request: " + error.message,
      500
    );
  }
};

exports.createEmergencyRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, additionalInfo, location: manualLocation } = req.body;

    const validationError = validateCreateEmergencyRequest(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return errorResponse(res, "Invalid blood type", 400);
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Province: true },
    });
    if (!userWithProvince?.Province) {
      return errorResponse(res, "User's province information is missing", 400);
    }

    let provinceIDForInventoryCheck;
    if (manualLocation) {
      const province = await prisma.province.findFirst({
        where: { Name: manualLocation },
      });
      if (!province) {
        return errorResponse(res, "Invalid location", 400);
      }
      provinceIDForInventoryCheck = province.ProvinceID;
    } else {
      provinceIDForInventoryCheck = userWithProvince.Province.ProvinceID;
    }

    const inventory = await prisma.bloodInventory.findFirst({
      where: {
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        Quantity: { gt: 0 },
        ProvinceID: provinceIDForInventoryCheck,
      },
    });
    if (!inventory) {
      return errorResponse(
        res,
        "Requested blood type currently unavailable in selected area",
        404
      );
    }

    const emergencyLocation =
      manualLocation || userWithProvince.Province.Capital;
    const newEmergencyRequest = await prisma.emergencyRequest.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        RequestDate: new Date(),
        AdditionalInfo: additionalInfo,
        Location: emergencyLocation,
      },
    });

    successResponse(
      res,
      "Emergency blood request created successfully",
      newEmergencyRequest,
      201
    );
  } catch (error) {
    errorResponse(
      res,
      "Error creating the emergency request: " + error.message,
      500
    );
  }
};

exports.updateEmergencyRequest = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;
    const { additionalInfo, bloodType, location } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const validationError = validateUpdateEmergencyRequest(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
      include: {
        User: true,
      },
    });

    if (!emergencyRequest) {
      return errorResponse(res, "Emergency request not found", 404);
    }

    if (emergencyRequest.UserID !== userId && userRole !== "admin") {
      return errorResponse(
        res,
        "Unauthorized to update this emergency request",
        403
      );
    }

    let bloodTypeID = emergencyRequest.BloodTypeID;
    let provinceID;

    if (bloodType) {
      const bloodTypeRecord = await prisma.bloodType.findFirst({
        where: { Type: bloodType },
      });
      if (!bloodTypeRecord) {
        return errorResponse(res, "Invalid blood type", 400);
      }
      bloodTypeID = bloodTypeRecord.BloodTypeID;
    }

    if (location) {
      const province = await prisma.province.findFirst({
        where: { Name: location },
      });
      if (!province) {
        return errorResponse(res, "Invalid location", 400);
      }
      provinceID = province.ProvinceID;
    } else {
      provinceID = emergencyRequest.User.ProvinceID;
    }

    const inventory = await prisma.bloodInventory.findFirst({
      where: {
        BloodTypeID: bloodTypeID,
        Quantity: { gt: 0 },
        ProvinceID: provinceID,
      },
    });
    if (!inventory) {
      return errorResponse(
        res,
        "Requested blood type currently unavailable in selected area",
        404
      );
    }

    const updatedEmergencyRequest = await prisma.emergencyRequest.update({
      where: { RequestID: parseInt(emergencyRequestId) },
      data: {
        AdditionalInfo: additionalInfo || emergencyRequest.AdditionalInfo,
        BloodTypeID: bloodTypeID,
        Location: location || emergencyRequest.Location,
      },
    });

    successResponse(
      res,
      "Emergency request updated successfully",
      updatedEmergencyRequest
    );
  } catch (error) {
    errorResponse(
      res,
      "Error updating emergency request: " + error.message,
      500
    );
  }
};

exports.deleteEmergencyRequest = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    if (!emergencyRequest) {
      return errorResponse(res, "Emergency request not found", 404);
    }

    if (emergencyRequest.UserID !== userId && userRole !== "admin") {
      return errorResponse(
        res,
        "Unauthorized to delete this emergency request",
        403
      );
    }

    await prisma.emergencyRequest.delete({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    successResponse(res, "Emergency request deleted successfully");
  } catch (error) {
    errorResponse(
      res,
      "Error deleting emergency request: " + error.message,
      500
    );
  }
};

exports.updateEmergencyRequestStatus = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;
    const { newStatus } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const validationError = validateUpdateEmergencyRequestStatus(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    if (!emergencyRequest) {
      return errorResponse(res, "Emergency request not found", 404);
    }

    if (emergencyRequest.UserID !== userId && userRole !== "admin") {
      return errorResponse(
        res,
        "Unauthorized to update this emergency request",
        403
      );
    }

    const updatedEmergencyRequest = await prisma.emergencyRequest.update({
      where: { RequestID: parseInt(emergencyRequestId) },
      data: { Status: newStatus },
    });

    return successResponse(
      res,
      "Emergency request status updated successfully",
      updatedEmergencyRequest
    );
  } catch (error) {
    return errorResponse(
      res,
      "Error updating emergency request status: " + error.message,
      500
    );
  }
};
