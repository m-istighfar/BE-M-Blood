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
    const bloodTypes = await prisma.bloodType.findMany();
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

    const bloodType = await prisma.bloodType.findUnique({
      where: { BloodTypeID: parseInt(id) },
    });

    if (!bloodType) {
      return errorResponse(res, "Blood type not found", 404);
    }

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
