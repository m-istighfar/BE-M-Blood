const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
          "isWillingToDonate and canHelpInEmergency fields must be boolean",
      });
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
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

    res
      .status(201)
      .json({ message: "Help offer created successfully", newHelpOffer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
