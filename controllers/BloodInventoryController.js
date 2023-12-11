const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const successResponse = (res, message, data) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ error: message });
};

const validateInventoryData = ({ bloodTypeID, quantity, provinceID }) => {
  if (!bloodTypeID || !quantity || !provinceID) {
    return "Missing required fields";
  }
  if (quantity <= 0) {
    return "Quantity must be a positive number";
  }
  return null;
};

exports.createBloodInventory = async (req, res) => {
  try {
    const { bloodTypeID, quantity, expiryDate, provinceID } = req.body;

    const validationError = validateInventoryData(req.body);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const province = await prisma.province.findUnique({
      where: { ProvinceID: provinceID },
    });
    if (!province) {
      return errorResponse(res, "Province not found", 404);
    }

    const today = new Date();
    const defaultExpiryDate = new Date(today);
    defaultExpiryDate.setDate(today.getDate() + 42);

    const newInventory = await prisma.bloodInventory.create({
      data: {
        BloodTypeID: bloodTypeID,
        Quantity: quantity,
        ExpiryDate: defaultExpiryDate,
        ProvinceID: provinceID,
      },
    });

    successResponse(res, "Blood inventory added successfully", newInventory);
  } catch (error) {
    errorResponse(res, "Error creating blood inventory: " + error.message);
  }
};

exports.getBloodInventories = async (req, res) => {
  try {
    const { page, limit, bloodTypeID, provinceID } = req.query;
    const pageNumber = Math.max(parseInt(page) || 1, 1);

    const pageSize = Math.max(parseInt(limit) || 10, 1);
    const offset = (pageNumber - 1) * pageSize;

    let whereClause = {};
    if (bloodTypeID) whereClause.BloodTypeID = parseInt(bloodTypeID);
    if (provinceID) whereClause.ProvinceID = parseInt(provinceID);

    const bloodInventories = await prisma.bloodInventory.findMany({
      skip: offset,
      take: pageSize,
      where: whereClause,
      include: { BloodType: true, Province: true },
    });

    const totalRecords = await prisma.bloodInventory.count({
      where: whereClause,
    });
    successResponse(res, "Blood inventories fetched successfully", {
      totalRecords,
      bloodInventories,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    errorResponse(res, "Error fetching blood inventories: " + error.message);
  }
};

exports.getBloodInventoryById = async (req, res) => {
  const { inventoryID } = req.params;

  try {
    const inventory = await prisma.bloodInventory.findUnique({
      where: { InventoryID: parseInt(inventoryID) },
      include: { BloodType: true, Province: true },
    });

    if (!inventory) {
      return errorResponse(res, "Blood inventory not found", 404);
    }

    successResponse(res, "Blood inventory fetched successfully", inventory);
  } catch (error) {
    errorResponse(res, "Error fetching blood inventory: " + error.message);
  }
};

exports.updateBloodInventory = async (req, res) => {
  const { inventoryID } = req.params;
  const { quantity, expiryDate } = req.body;

  try {
    const existingInventory = await prisma.bloodInventory.findUnique({
      where: { InventoryID: parseInt(inventoryID) },
    });
    if (!existingInventory) {
      return errorResponse(res, "Blood inventory not found", 404);
    }

    const updatedInventory = await prisma.bloodInventory.update({
      where: { InventoryID: parseInt(inventoryID) },
      data: {
        Quantity: quantity,
        ExpiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    successResponse(
      res,
      "Blood inventory updated successfully",
      updatedInventory
    );
  } catch (error) {
    errorResponse(res, "Error updating blood inventory: " + error.message);
  }
};

exports.deleteBloodInventory = async (req, res) => {
  const { inventoryID } = req.params;
  try {
    const existingInventory = await prisma.bloodInventory.findUnique({
      where: { InventoryID: parseInt(inventoryID) },
    });
    if (!existingInventory) {
      return errorResponse(res, "Blood inventory not found", 404);
    }

    await prisma.bloodInventory.delete({
      where: { InventoryID: parseInt(inventoryID) },
    });
    successResponse(res, "Blood inventory deleted successfully");
  } catch (error) {
    errorResponse(res, "Error deleting blood inventory: " + error.message);
  }
};
