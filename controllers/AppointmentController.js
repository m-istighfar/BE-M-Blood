const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, scheduledDate } = req.body;

    if (!scheduledDate || new Date(scheduledDate) < new Date()) {
      return res.status(400).json({ error: "Invalid or past scheduled date" });
    }

    const userWithProvince = await prisma.user.findUnique({
      where: { UserID: userId },
      include: {
        Province: true,
      },
    });

    if (!userWithProvince || !userWithProvince.Province) {
      return res
        .status(400)
        .json({ error: "User's province information is missing" });
    }

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        UserID: userId,
        ScheduledDate: {
          gte: new Date(new Date(scheduledDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(scheduledDate).setHours(23, 59, 59, 999)),
        },
      },
    });
    if (existingAppointment) {
      return res
        .status(400)
        .json({ error: "Appointment already exists on this date" });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        ScheduledDate: new Date(scheduledDate),
        Location: userWithProvince.Province.Capital,
      },
    });

    res
      .status(201)
      .json({ message: "Appointment created successfully", newAppointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
