const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllBloodDrives = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const bloodDrives = await prisma.bloodDrive.findMany({
      skip: offset,
      take: limit,
      include: {
        Province: true,
        User: true,
      },
    });

    const totalRecords = await prisma.bloodDrive.count();

    res.status(200).json({
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      bloodDrives,
    });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching blood drives: " + error.message,
    });
  }
};

exports.getBloodDriveById = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;

    const bloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: parseInt(bloodDriveId) },
    });

    if (!bloodDrive) {
      return res.status(404).json({ error: "Blood drive not found" });
    }

    res.status(200).json(bloodDrive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBloodDrive = async (req, res) => {
  try {
    const userId = req.user.id;
    const { institute, provinceId, designation, scheduledDate } = req.body;

    if (!institute || !provinceId || !designation || !scheduledDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid scheduled date" });
    }

    if (parsedDate <= new Date()) {
      return res
        .status(400)
        .json({ error: "Scheduled date must be in the future" });
    }

    const provinceIdInt = parseInt(provinceId, 10);

    const provinceExists = await prisma.province.findUnique({
      where: { ProvinceID: provinceIdInt },
    });

    if (!provinceExists) {
      return res.status(400).json({ error: "Invalid ProvinceID" });
    }

    const newBloodDrive = await prisma.bloodDrive.create({
      data: {
        UserID: userId,
        Institute: institute,
        ProvinceID: provinceIdInt,
        Designation: designation,
        ScheduledDate: parsedDate,
      },
    });

    res
      .status(201)
      .json({ message: "Blood drive created successfully", newBloodDrive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBloodDrive = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;
    const { institute, provinceId, designation, scheduledDate } = req.body;
    const bloodDriveIdInt = parseInt(bloodDriveId, 10);

    if (!institute && !provinceId && !designation && !scheduledDate) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    const existingBloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: bloodDriveIdInt },
    });

    if (!existingBloodDrive) {
      return res.status(404).json({ error: "Blood drive not found" });
    }

    const updateData = {};
    if (institute) updateData.Institute = institute;
    if (provinceId) updateData.ProvinceID = parseInt(provinceId, 10);
    if (designation) updateData.Designation = designation;
    if (scheduledDate) {
      const parsedDate = new Date(scheduledDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid scheduled date" });
      }
      if (parsedDate <= new Date()) {
        return res
          .status(400)
          .json({ error: "Scheduled date must be in the future" });
      }
      updateData.ScheduledDate = parsedDate;
    }

    const updatedBloodDrive = await prisma.bloodDrive.update({
      where: { DriveID: bloodDriveIdInt },
      data: updateData,
    });

    res.status(200).json({
      message: "Blood drive updated successfully",
      updatedBloodDrive,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating blood drive: " + error.message });
  }
};

exports.deleteBloodDrive = async (req, res) => {
  try {
    const { bloodDriveId } = req.params;
    const bloodDriveIdInt = parseInt(bloodDriveId, 10);

    const existingBloodDrive = await prisma.bloodDrive.findUnique({
      where: { DriveID: bloodDriveIdInt },
    });

    if (!existingBloodDrive) {
      return res.status(404).json({ error: "Blood drive not found" });
    }

    await prisma.bloodDrive.delete({
      where: { DriveID: bloodDriveIdInt },
    });

    res.status(200).json({ message: "Blood drive deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting blood drive: " + error.message });
  }
};
