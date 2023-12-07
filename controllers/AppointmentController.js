const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodType, scheduledDate } = req.body;

    if (!scheduledDate || isNaN(new Date(scheduledDate).getTime())) {
      return res.status(400).json({ error: "Invalid scheduled date" });
    }

    const appointmentDate = new Date(scheduledDate);
    if (appointmentDate < new Date()) {
      return res
        .status(400)
        .json({ error: "Scheduled date cannot be in the past" });
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

    const bloodTypeRecord = await prisma.bloodType.findFirst({
      where: { Type: bloodType },
    });
    if (!bloodTypeRecord) {
      return res.status(400).json({ error: "Invalid blood type" });
    }

    const startOfDay = new Date(appointmentDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate).setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        UserID: userId,
        ScheduledDate: { gte: new Date(startOfDay), lte: new Date(endOfDay) },
      },
    });
    if (existingAppointment) {
      return res
        .status(400)
        .json({ error: "An appointment already exists on this date" });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeRecord.BloodTypeID,
        ScheduledDate: appointmentDate,
        Location: userWithProvince.Province.Capital,
      },
    });

    res.status(201).json({
      message: "Appointment created successfully",
      appointmentDetails: newAppointment,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "An error occurred while creating the appointment: " + error.message,
    });
  }
};
