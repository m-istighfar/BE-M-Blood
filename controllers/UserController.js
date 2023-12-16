const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require("../utils/response");

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    successResponse(res, "Users fetched successfully", users);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

module.exports = {
  getAllUsers,
};
