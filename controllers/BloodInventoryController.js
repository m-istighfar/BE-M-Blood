const { PrismaClient } = require("@prisma/client");
const Joi = require("joi");
const prisma = new PrismaClient();

const successResponse = (res, message, data) => {
  return res.status(200).json({ message, data });
};

const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ error: message });
};

const validateInventoryData = (data) => {
  const schema = Joi.object({
    bloodTypeID: Joi.number().required(),
    quantity: Joi.number().positive().required(),
    provinceID: Joi.number().required(),
    expiryDate: Joi.date().optional(),
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
    bloodTypeID: Joi.number().integer().optional(),
    provinceID: Joi.number().integer().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

const validateInventoryUpdate = (data) => {
  const schema = Joi.object({
    quantity: Joi.number().positive().optional(),
    expiryDate: Joi.date().optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false });
  return error
    ? error.details.map((detail) => detail.message).join(", ")
    : null;
};

exports.createBloodInventory = async (req, res) => {
  try {
    const validationError = validateInventoryData(req.body);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const { bloodTypeID, quantity, expiryDate, provinceID } = req.body;

    const province = await prisma.province.findUnique({
      where: { ProvinceID: provinceID },
    });
    if (!province) {
      return errorResponse(res, "Province not found", 404);
    }

    const bloodTypeExists = await prisma.bloodType.findUnique({
      where: { BloodTypeID: bloodTypeID },
    });
    if (!bloodTypeExists) {
      return errorResponse(res, "Blood type not found", 404);
    }

    const today = new Date();
    const defaultExpiryDate = expiryDate
      ? new Date(expiryDate)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 42);

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
    const validationError = validateQueryParameters(req.query);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const { page, limit, bloodTypeID, provinceID } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
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

  try {
    const validationError = validateInventoryUpdate(req.body);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const { quantity, expiryDate } = req.body;

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
