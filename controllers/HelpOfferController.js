const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllHelpOffers = async (req, res) => {
  try {
    const helpOffers = await prisma.helpOffer.findMany({
      include: {
        User: true,
        BloodType: true,
      },
    });
    res.status(200).json(helpOffers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching help offers: " + error.message });
  }
};

exports.createHelpOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isWillingToDonate, canHelpInEmergency, bloodType, reason } =
      req.body;

    if (
      typeof isWillingToDonate !== "boolean" ||
      typeof canHelpInEmergency !== "boolean"
    ) {
      return res.status(400).json({
        error:
          "isWillingToDonate and canHelpInEmergency must be boolean values",
      });
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type specified" });
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Province: true },
    });
    if (!userWithProvince || !userWithProvince.Province) {
      return res
        .status(404)
        .json({ error: "User or user's province information not found" });
    }

    const newHelpOffer = await prisma.helpOffer.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        IsWillingToDonate: isWillingToDonate,
        CanHelpInEmergency: canHelpInEmergency,
        Location: userWithProvince.Province.Capital,
        Reason: reason,
      },
    });

    res.status(201).json({
      message: "Help offer created successfully",
      helpOffer: newHelpOffer,
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error while creating help offer: " + error.message,
    });
  }
};

exports.updateHelpOffer = async (req, res) => {
  try {
    const { helpOfferId } = req.params;
    const { isWillingToDonate, canHelpInEmergency, reason } = req.body;

    const updatedHelpOffer = await prisma.helpOffer.update({
      where: { OfferID: parseInt(helpOfferId) },
      data: {
        IsWillingToDonate: isWillingToDonate,
        CanHelpInEmergency: canHelpInEmergency,
        Reason: reason,
      },
    });

    res
      .status(200)
      .json({ message: "Help offer updated successfully", updatedHelpOffer });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating help offer: " + error.message });
  }
};

exports.deleteHelpOffer = async (req, res) => {
  try {
    const { helpOfferId } = req.params;

    await prisma.helpOffer.delete({
      where: { OfferID: parseInt(helpOfferId) },
    });

    res.status(200).json({ message: "Help offer deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting help offer: " + error.message });
  }
};
