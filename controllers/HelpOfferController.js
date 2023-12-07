const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createHelpOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason, availability } = req.body;

    if (!reason || !availability) {
      return res
        .status(400)
        .json({ error: "Reason and availability are required" });
    }

    const newHelpOffer = await prisma.helpOffer.create({
      data: {
        UserID: userId,
        Reason: reason,
        Availability: availability,
      },
    });

    res
      .status(201)
      .json({ message: "Help offer created successfully", newHelpOffer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
