const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllEmergencyRequests = async (req, res) => {
  try {
    const {
      page,
      limit,
      bloodType,
      startDate,
      endDate,
      provinceId,
      sortBy,
      sortOrder,
    } = req.query;

    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;
    const sortingCriteria = sortBy || "RequestDate";
    const sortingOrder = sortOrder === "desc" ? "desc" : "asc";

    let whereClause = {};
    if (bloodType) {
      whereClause.BloodTypeID = parseInt(bloodType);
    }

    if (startDate && endDate) {
      whereClause.RequestDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (provinceId) {
      whereClause.User = {
        ProvinceID: parseInt(provinceId),
      };
    }

    const emergencyRequests = await prisma.emergencyRequest.findMany({
      skip: offset,
      take: pageSize,
      orderBy: {
        [sortingCriteria]: sortingOrder,
      },
      where: whereClause,
      include: {
        BloodType: true,
        User: { select: { Name: true, Province: true } },
      },
    });

    const totalRequests = await prisma.emergencyRequest.count({
      where: whereClause,
    });

    res.status(200).json({
      totalRequests,
      totalPages: Math.ceil(totalRequests / pageSize),
      currentPage: pageNumber,
      emergencyRequests,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching emergency requests: " + error.message });
  }
};

exports.getEmergencyRequestById = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
      include: {
        BloodType: true,
        User: true,
      },
    });

    if (!emergencyRequest) {
      return res.status(404).json({ error: "Emergency request not found" });
    }

    res.status(200).json(emergencyRequest);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching emergency request: " + error.message });
  }
};

exports.createEmergencyRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, additionalInfo } = req.body;

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: { Province: true },
    });

    if (!userWithProvince?.Province) {
      return res
        .status(400)
        .json({ error: "User's province information is missing" });
    }

    const inventory = await prisma.bloodInventory.findFirst({
      where: {
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        Quantity: { gt: 0 },
        ProvinceID: userWithProvince.Province.ProvinceID,
      },
    });

    if (!inventory) {
      return res.status(404).json({
        error: "Requested blood type currently unavailable in your area",
      });
    }
    const newEmergencyRequest = await prisma.emergencyRequest.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        RequestDate: new Date(),
        AdditionalInfo: additionalInfo,
        Location: userWithProvince.Province.Capital,
      },
    });

    res.status(201).json({
      message: "Emergency blood request created successfully",
      emergencyRequest: newEmergencyRequest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmergencyRequest = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;
    const { additionalInfo, newBloodTypeID } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    if (!emergencyRequest) {
      return res.status(404).json({ error: "Emergency request not found" });
    }

    if (emergencyRequest.UserID !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this emergency request" });
    }

    const updatedEmergencyRequest = await prisma.emergencyRequest.update({
      where: { RequestID: parseInt(emergencyRequestId) },
      data: {
        AdditionalInfo: additionalInfo || emergencyRequest.AdditionalInfo,
        BloodTypeID: newBloodTypeID || emergencyRequest.BloodTypeID,
      },
    });

    res.status(200).json({
      message: "Emergency request updated successfully",
      emergencyRequest: updatedEmergencyRequest,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating emergency request: " + error.message });
  }
};

exports.deleteEmergencyRequest = async (req, res) => {
  try {
    const { emergencyRequestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const emergencyRequest = await prisma.emergencyRequest.findUnique({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    if (!emergencyRequest) {
      return res.status(404).json({ error: "Emergency request not found" });
    }

    if (emergencyRequest.UserID !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this emergency request" });
    }

    await prisma.emergencyRequest.delete({
      where: { RequestID: parseInt(emergencyRequestId) },
    });

    res.status(200).json({ message: "Emergency request deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting emergency request: " + error.message });
  }
};
