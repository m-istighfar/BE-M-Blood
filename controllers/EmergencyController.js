const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createEmergencyRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, additionalInfo } = req.body;

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    const inventory = await prisma.bloodInventory.findFirst({
      where: {
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        Quantity: {
          gt: 0,
        },
      },
    });

    if (!inventory) {
      return res
        .status(404)
        .json({ error: "Requested blood type currently unavailable" });
    }

    const newEmergencyRequest = await prisma.emergencyRequest.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        RequestDate: new Date(),
        AdditionalInfo: additionalInfo,
      },
    });

    res.status(201).json({
      message: "Emergency blood request created successfully",
      emergencyRequest: newEmergencyRequest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
