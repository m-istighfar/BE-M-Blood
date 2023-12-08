const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllBloodDrives = async (req, res) => {
  try {
    const bloodDrives = await prisma.bloodDrive.findMany({
      include: {
        Province: true,
        User: true,
      },
    });

    res.status(200).json(bloodDrives);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching blood drives: " + error.message,
    });
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
