const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require("../utils/response");
const getAllUsers = async (req, res) => {
  try {
    const { searchBy, query, name, email, phone, location } = req.query;

    let where = {};

    if (name) {
      where.Name = { contains: name, mode: "insensitive" };
    }
    if (email) {
      where.Email = { contains: email, mode: "insensitive" };
    }
    if (phone) {
      where.Phone = { contains: phone, mode: "insensitive" };
    }
    if (location) {
      where.ProvinceID = { contains: location, mode: "insensitive" };
    }

    if (searchBy && query) {
      const searchConditions = [];
      if (searchBy === "all" || searchBy === "name") {
        searchConditions.push({
          Name: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "email") {
        searchConditions.push({
          Email: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "phone") {
        searchConditions.push({
          Phone: { contains: query, mode: "insensitive" },
        });
      }
      if (searchBy === "all" || searchBy === "location") {
        searchConditions.push({
          ProvinceID: { contains: query, mode: "insensitive" },
        });
      }

      where = {
        ...where,
        AND: searchConditions.length > 0 ? { OR: searchConditions } : {},
      };
    }

    const users = await prisma.user.findMany({
      where: where,
    });

    successResponse(res, "Users fetched successfully", users);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

module.exports = {
  getAllUsers,
};
