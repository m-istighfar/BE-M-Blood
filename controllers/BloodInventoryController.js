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

exports.getAllInventory = async (req, res) => {
  try {
    const {
      searchBy,
      query,
      expiriDate,
      provinceName,
      bloodType,
      page,
      limit,
      orderBy,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    let where = {};

    if (bloodType) {
      const bloodTypeRecord = await prisma.bloodType.findFirst({
        where: { Type: { equals: bloodType, mode: "insensitive" } },
      });
      if (bloodTypeRecord) {
        where.BloodTypeID = bloodTypeRecord.BloodTypeID;
      }
    }

    if (expiriDate) {
      const date = new Date(expiriDate);
      where.ExpiryDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (provinceName) {
      where.Province = {
        is: {
          Name: { contains: provinceName, mode: "insensitive" },
        },
      };
    }

    if (searchBy && query) {
      const searchConditions = [];

      if (searchBy === "all" || searchBy === "provinceName") {
        searchConditions.push({
          Province: {
            is: {
              Name: { contains: query, mode: "insensitive" },
            },
          },
        });
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    let orderByClause = [];

    if (orderBy) {
      const [field, order] = orderBy.split(":");
      if (field === "ExpiryDate" || field === "Quantity") {
        let sortObject = {};
        sortObject[field] = order.toLowerCase();
        orderByClause.push(sortObject);
      }
    } else {
      orderByClause = [{ ExpiryDate: "asc" }, { Quantity: "desc" }];
    }

    const inventory = await prisma.bloodInventory.findMany({
      where: where,
      skip: offset,
      take: pageSize,
      orderBy: orderByClause,
    });

    const totalRecords = await prisma.bloodInventory.count({ where: where });

    successResponse(res, "Inventory fetched successfully", {
      totalRecords,
      inventory,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / pageSize),
    });
  } catch (error) {
    errorResponse(res, "Error fetching inventory: " + error.message, 500);
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

exports.getTotalQuantityByTypeAndLocation = async (req, res) => {
  try {
    const { provinceName } = req.query;
    let provinceFilter = {};

    if (provinceName) {
      const filteredProvince = await prisma.province.findFirst({
        where: { Name: { equals: provinceName, mode: "insensitive" } },
      });
      if (!filteredProvince) {
        return errorResponse(res, "Province not found", 404);
      }
      provinceFilter.ProvinceID = filteredProvince.ProvinceID;
    }

    const bloodTypes = await prisma.bloodType.findMany();
    const provinces = provinceName
      ? [provinceFilter]
      : await prisma.province.findMany();

    const combinations = provinces.flatMap((province) =>
      bloodTypes.map((bloodType) => ({
        bloodTypeID: bloodType.BloodTypeID,
        provinceID: province.ProvinceID,
        bloodType: bloodType.Type,
        province: province.Name,
      }))
    );

    const aggregateData = await prisma.bloodInventory.groupBy({
      by: ["BloodTypeID", "ProvinceID"],
      _sum: {
        Quantity: true,
      },
      where: provinceFilter,
    });

    const enhancedData = combinations.map((combination) => {
      const aggregate = aggregateData.find(
        (agg) =>
          agg.BloodTypeID === combination.bloodTypeID &&
          agg.ProvinceID === combination.provinceID
      );

      return {
        bloodType: combination.bloodType,
        province: combination.province,
        totalQuantity: aggregate ? aggregate._sum.Quantity : 0,
      };
    });

    successResponse(
      res,
      "Total quantity by blood type and location fetched successfully",
      enhancedData
    );
  } catch (error) {
    errorResponse(
      res,
      "Error fetching total quantity by blood type and location: " +
        error.message
    );
  }
};
``;
