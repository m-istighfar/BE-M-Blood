const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createAppointment = async (req, res) => {
  try {
    const { userId, bloodTypeId, scheduledDate } = req.body;

    if (new Date(scheduledDate) < new Date()) {
      return res
        .status(400)
        .json({ error: "Scheduled date must be in the future." });
    }

    const userExists = await prisma.user.findUnique({
      where: { UserID: userId },
    });
    if (!userExists) {
      return res.status(404).json({ error: "User not found." });
    }

    const bloodTypeExists = await prisma.bloodType.findUnique({
      where: { BloodTypeID: bloodTypeId },
    });
    if (!bloodTypeExists) {
      return res.status(404).json({ error: "Blood type not found." });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        UserID: userId,
        BloodTypeID: bloodTypeId,
        ScheduledDate: new Date(scheduledDate),
      },
    });

    return res.status(200).json({
      message: "Appointment created successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createAppointment,
};
