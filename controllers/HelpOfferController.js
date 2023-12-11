const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const successResponse = (res, message, data = null) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateHelpOfferData = (data) => {
  const { bloodType, isWillingToDonate, canHelpInEmergency } = data;

  if (!bloodType) {
    return "Blood type is required";
  }
  if (typeof isWillingToDonate !== "boolean") {
    return "isWillingToDonate must be a boolean";
  }
  if (typeof canHelpInEmergency !== "boolean") {
    return "canHelpInEmergency must be a boolean";
  }
  return null;
};

exports.getAllHelpOffers = async (req, res) => {
  try {
    const { page, limit, bloodType, isWillingToDonate, canHelpInEmergency } =
      req.query;

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;

    let whereClause = {};
    if (bloodType) whereClause.BloodTypeID = parseInt(bloodType);
    if (isWillingToDonate)
      whereClause.IsWillingToDonate = isWillingToDonate === "true";
    if (canHelpInEmergency)
      whereClause.CanHelpInEmergency = canHelpInEmergency === "true";

    const helpOffers = await prisma.helpOffer.findMany({
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      where: whereClause,
      include: {
        User: true,
        BloodType: true,
      },
    });

    const totalRecords = await prisma.helpOffer.count({ where: whereClause });

    return successResponse(res, "Help offers fetched successfully", {
      totalRecords,
      helpOffers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
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
    const { bloodType, isWillingToDonate, canHelpInEmergency, reason } =
      req.body;

    const validationError = validateHelpOfferData({
      bloodType,
      isWillingToDonate,
      canHelpInEmergency,
    });
    if (validationError) {
      return errorResponse(res, validationError);
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
      },
    });

    return successResponse(
      res,
      "Help offer created successfully",
      newHelpOffer
    );
  } catch (error) {
    return errorResponse(res, "Error creating help offer", 500);
  }
};

exports.updateHelpOffer = async (req, res) => {
  try {
    const { helpOfferId } = req.params;
    const userId = req.user.id;
    const { isWillingToDonate, canHelpInEmergency, reason } = req.body;

    const existingHelpOffer = await prisma.helpOffer.findUnique({
      where: { OfferID: parseInt(helpOfferId) },
    });

    if (!existingHelpOffer) {
      return errorResponse(res, "Help offer not found", 404);
    }

    const updatedHelpOffer = await prisma.helpOffer.update({
      where: { OfferID: parseInt(helpOfferId) },
      data: {
        IsWillingToDonate:
          isWillingToDonate ?? existingHelpOffer.IsWillingToDonate,
        CanHelpInEmergency:
          canHelpInEmergency ?? existingHelpOffer.CanHelpInEmergency,
        Reason: reason ?? existingHelpOffer.Reason,
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
