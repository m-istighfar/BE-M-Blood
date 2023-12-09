const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createBloodInventory = async (req, res) => {
  try {
    const { bloodTypeID, quantity, expiryDate, provinceID } = req.body;

    if (!bloodTypeID || !quantity || !expiryDate || !provinceID) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newInventory = await prisma.bloodInventory.create({
      data: {
        BloodTypeID: bloodTypeID,
        Quantity: quantity,
        ExpiryDate: new Date(expiryDate),
        ProvinceID: provinceID,
      },
    });

    return res
      .status(201)
      .json({ message: "Blood inventory added successfully", newInventory });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error creating blood inventory: " + error.message });
  }
};
