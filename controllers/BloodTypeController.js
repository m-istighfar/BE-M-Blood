const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const redis = require("../config/redis");

const successResponse = (res, message, data = null) => {
  const response = { message };
  if (data !== null) {
    response.data = data;
  }
  return res.status(200).json(response);
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ error: message });
};

exports.getAllBloodTypes = async (req, res) => {
  try {
    const cacheKey = `bloodTypes:all`;
    const cachedBloodTypes = await redis.get(cacheKey);

    if (cachedBloodTypes) {
      return successResponse(
        res,
        "Blood types fetched from cache",
        JSON.parse(cachedBloodTypes)
      );
    }
    const bloodTypes = await prisma.bloodType.findMany();

    await redis.setex(cacheKey, 3600, JSON.stringify(bloodTypes));
    successResponse(res, "Blood types fetched successfully", bloodTypes);
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching blood types: " + error.message,
      500
    );
  }
};

exports.getBloodTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const validationError = validateBloodTypeId({ id });
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const cacheKey = `bloodType:${id}`;
    const cachedBloodType = await redis.get(cacheKey);

    if (cachedBloodType) {
      return successResponse(
        res,
        "Blood type fetched from cache",
        JSON.parse(cachedBloodType)
      );
    }

    const bloodType = await prisma.bloodType.findUnique({
      where: { BloodTypeID: parseInt(id) },
    });

    if (!bloodType) {
      return errorResponse(res, "Blood type not found", 404);
    }

    await redis.setex(cacheKey, 3600, JSON.stringify(bloodType));
    successResponse(res, "Blood type fetched successfully", bloodType);
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching the blood type: " + error.message,
      500
    );
  }
};

const validateBloodTypeId = (data) => {
  const schema = Joi.object({
    id: Joi.number().integer().required(),
  });

  const { error } = schema.validate(data);
  return error ? error.details[0].message : null;
};
