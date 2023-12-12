const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");

const successResponse = (res, message, data = null) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateHelpOfferData = (data) => {
  const schema = Joi.object({
    bloodType: Joi.string().required(),
    isWillingToDonate: Joi.boolean().required(),
    canHelpInEmergency: Joi.boolean().required(),
    location: Joi.string().required(),
    reason: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateQueryParameters = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    bloodType: Joi.string().optional(),
    isWillingToDonate: Joi.boolean().optional(),
    canHelpInEmergency: Joi.boolean().optional(),
    location: Joi.string().optional(),
    sort: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateHelpOfferUpdate = (data) => {
  const schema = Joi.object({
    bloodType: Joi.string().optional(),
    isWillingToDonate: Joi.boolean().optional(),
    canHelpInEmergency: Joi.boolean().optional(),
    location: Joi.string().optional(),
    reason: Joi.string().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

exports.getAllHelpOffers = async (req, res) => {
  try {
    const {
      page,
      limit,
      bloodType,
      isWillingToDonate,
      canHelpInEmergency,
      location,
      sort,
    } = req.query;

    const validationError = validateQueryParameters(req.query);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;

    let whereClause = {};
    if (bloodType) whereClause.BloodTypeID = parseInt(bloodType);
    if (isWillingToDonate)
      whereClause.IsWillingToDonate = isWillingToDonate === "true";
    if (canHelpInEmergency)
      whereClause.CanHelpInEmergency = canHelpInEmergency === "true";
    if (location) whereClause.Location = { contains: location };

    let orderBy = { CreatedAt: "desc" };

    if (sort) {
      const allowedSortFields = ["CreatedAt", "UpdatedAt"];
      const [sortField, sortOrder] = sort.split(":");

      if (allowedSortFields.includes(sortField)) {
        orderBy = {
          [sortField]: sortOrder.toLowerCase() === "asc" ? "asc" : "desc",
        };
      }
    }

    const helpOffers = await prisma.helpOffer.findMany({
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      where: whereClause,
      orderBy: orderBy,
      include: {
        User: true,
        BloodType: true,
      },
    });

    const totalRecords = await prisma.helpOffer.count({ where: whereClause });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return successResponse(res, "Help offers fetched successfully", {
      totalRecords,
      helpOffers,
      currentPage: pageNumber,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Error fetching help offers", 500);
  }
};
exports.getHelpOfferById = async (req, res) => {
  try {
    const { helpOfferId } = req.params;
    const helpOffer = await prisma.helpOffer.findUnique({
      where: { OfferID: parseInt(helpOfferId) },
      include: {
        User: true,
        BloodType: true,
      },
    });

    if (!helpOffer) {
      return errorResponse(res, "Help offer not found", 404);
    }

    return successResponse(res, "Help offer fetched successfully", helpOffer);
  } catch (error) {
    return errorResponse(res, "Error fetching help offer", 500);
  }
};

exports.createHelpOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bloodType,
      isWillingToDonate,
      canHelpInEmergency,
      reason,
      location,
    } = req.body;

    const validationError = validateHelpOfferData(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const isValidLocation = await prisma.province.findFirst({
      where: { Name: location },
    });

    if (!isValidLocation) {
      return errorResponse(
        res,
        "Invalid location, must be within a valid province"
      );
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return errorResponse(res, "Invalid blood type");
    }

    const newHelpOffer = await prisma.helpOffer.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        IsWillingToDonate: isWillingToDonate,
        CanHelpInEmergency: canHelpInEmergency,
        Reason: reason,
        Location: location,
      },
    });

    return successResponse(
      res,
      "Help offer created successfully",
      newHelpOffer
    );
  } catch (error) {
    console.error("Error creating help offer:", error);
    return errorResponse(res, "Error creating help offer", 500);
  }
};

exports.updateHelpOffer = async (req, res) => {
  try {
    const { helpOfferId } = req.params;
    const userId = req.user.id;
    const {
      isWillingToDonate,
      canHelpInEmergency,
      reason,
      location,
      bloodType,
    } = req.body;

    const validationError = validateHelpOfferUpdate(req.body);
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const existingHelpOffer = await prisma.helpOffer.findUnique({
      where: { OfferID: parseInt(helpOfferId) },
    });

    if (!existingHelpOffer) {
      return errorResponse(res, "Help offer not found", 404);
    }

    const isValidLocation = await prisma.province.findFirst({
      where: { Name: location },
    });

    if (!isValidLocation) {
      return errorResponse(
        res,
        "Invalid location, must be within a valid province"
      );
    }

    let bloodTypeRecord = null;
    if (bloodType) {
      bloodTypeRecord = await prisma.bloodType.findFirst({
        where: { Type: bloodType },
      });
      if (!bloodTypeRecord) {
        return errorResponse(res, "Invalid blood type");
      }
    }

    const updatedHelpOffer = await prisma.helpOffer.update({
      where: { OfferID: parseInt(helpOfferId) },
      data: {
        IsWillingToDonate:
          isWillingToDonate ?? existingHelpOffer.IsWillingToDonate,
        CanHelpInEmergency:
          canHelpInEmergency ?? existingHelpOffer.CanHelpInEmergency,
        Reason: reason ?? existingHelpOffer.Reason,
        Location: location ?? existingHelpOffer.Location,
      },
    });

    return successResponse(
      res,
      "Help offer updated successfully",
      updatedHelpOffer
    );
  } catch (error) {
    return errorResponse(
      res,
      "Error updating help offer: " + error.message,
      500
    );
  }
};

exports.deleteHelpOffer = async (req, res) => {
  try {
    const { helpOfferId } = req.params;
    const userId = req.user.id;

    const helpOffer = await prisma.helpOffer.findUnique({
      where: { OfferID: parseInt(helpOfferId) },
    });

    if (!helpOffer) {
      errorResponse(res, "Help offer not found", 404);
    }

    await prisma.helpOffer.delete({
      where: { OfferID: parseInt(helpOfferId) },
    });

    return successResponse(res, "Help offer deleted successfully");
  } catch (error) {
    return errorResponse(
      res,
      "Error deleting help offer: " + error.message,
      500
    );
  }
};
