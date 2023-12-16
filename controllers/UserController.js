const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require("../utils/response");
const getAllUsers = async (req, res) => {
  try {
    const { searchBy, query, name, email, phone, location, page, limit } =
      req.query;

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
      where.Province = {
        Name: { contains: provinceName, mode: "insensitive" },
      };
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
          Province: { Name: { contains: query, mode: "insensitive" } },
        });
      }

      where = {
        ...where,
        AND: searchConditions.length > 0 ? { OR: searchConditions } : {},
      };
    }

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    const users = await prisma.user.findMany({
      where: where,
      include: {
        Province: true,
      },
      skip: offset,
      take: pageSize,
    });

    const totalRecords = await prisma.user.count({ where: where });
    const totalPages = Math.ceil(totalRecords / pageSize);

    successResponse(res, "Users fetched successfully", {
      users,
      totalRecords,
      totalPages,
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

module.exports = {
  getAllUsers,
};
