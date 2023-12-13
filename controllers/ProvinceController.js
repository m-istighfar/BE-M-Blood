const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");

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

const validateProvinceId = (data) => {
  const schema = Joi.object({
    id: Joi.number().integer().required(),
  });

  const { error } = schema.validate(data);
  return error ? error.details[0].message : null;
};

exports.getAllProvinces = async (req, res) => {
  try {
    const provinces = await prisma.province.findMany();
    successResponse(res, "Provinces fetched successfully", provinces);
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching provinces: " + error.message,
      500
    );
  }
};

exports.getProvinceById = async (req, res) => {
  try {
    const { id } = req.params;
    const validationError = validateProvinceId({ id });
    if (validationError) {
      return errorResponse(res, validationError);
    }

    const province = await prisma.province.findUnique({
      where: { ProvinceID: parseInt(id) },
    });

    if (!province) {
      return errorResponse(res, "Province not found", 404);
    }

    successResponse(res, "Province fetched successfully", province);
  } catch (error) {
    errorResponse(
      res,
      "An error occurred while fetching the province: " + error.message,
      500
    );
  }
};
