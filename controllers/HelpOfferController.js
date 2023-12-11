const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const successResponse = (res, message, data = null) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

const validateHelpOfferData = ({
  bloodTypeID,
  isWillingToDonate,
  canHelpInEmergency,
}) => {
  if (!bloodTypeID) {
    return "Blood type ID is required";
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
    const {
      page = 1,
      limit = 10,
      search = "",
      bloodType,
      isWillingToDonate,
      canHelpInEmergency,
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNumber - 1) * pageSize;

    let whereClause = {
      OR: [
        { User: { Name: { contains: search } } },
        { Location: { contains: search } },
        { Reason: { contains: search } },
      ],
    };

    if (bloodType) {
      whereClause.BloodTypeID = parseInt(bloodType);
    }
    if (isWillingToDonate !== undefined) {
      whereClause.IsWillingToDonate = isWillingToDonate === "true";
    }
    if (canHelpInEmergency !== undefined) {
      whereClause.CanHelpInEmergency = canHelpInEmergency === "true";
    }

    const helpOffers = await prisma.helpOffer.findMany({
      skip: offset,
      take: pageSize,
      where: whereClause,
      include: {
        User: true,
        BloodType: true,
      },
    });

    const totalRecords = await prisma.helpOffer.count({ where: whereClause });

    res.status(200).json({
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: pageNumber,
      helpOffers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching help offers: " + error.message });
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
      return res.status(404).json({ error: "Help offer not found" });
    }

    res.status(200).json(helpOffer);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching help offer: " + error.message });
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
      return errorResponse(res, validationError, 400);
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return errorResponse(res, "Invalid blood type", 400);
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
    return errorResponse(
      res,
      "Server error while creating help offer: " + error.message
    );
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
      return res.status(404).json({ error: "Help offer not found" });
    }

    // Authorization check: Only allow the creator or an admin to update
    if (existingHelpOffer.UserID !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this help offer" });
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

    res.status(200).json({
      message: "Help offer updated successfullys",
      helpOffer: updatedHelpOffer,
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error while updating help offer: " + error.message,
    });
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
      return res.status(404).json({ error: "Help offer not found" });
    }

    if (helpOffer.UserID !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this help offer" });
    }

    await prisma.helpOffer.delete({
      where: { OfferID: parseInt(helpOfferId) },
    });

    res.status(200).json({ message: "Help offer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Server error while deleting help offer: " + error.message,
    });
  }
};
