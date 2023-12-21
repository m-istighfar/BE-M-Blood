const prisma = require("../config/db");
const { sendWhatsAppMessage } = require("./whatsappService");

exports.sendRemindersForUpcomingAppointments = async () => {
  try {
    const oneHourLater = new Date(new Date().getTime() + 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        ScheduledDate: {
          gte: new Date(),
          lt: oneHourLater,
        },
        Status: "scheduled",
        ReminderSent: false,
      },
      include: {
        User: true,
      },
    });

    for (const appointment of upcomingAppointments) {
      const reminderMessage = `Reminder: You have an appointment scheduled at ${appointment.ScheduledDate.toLocaleString()}.`;
      await sendWhatsAppMessage(appointment.User.Phone, reminderMessage);

      await prisma.appointment.update({
        where: {
          AppointmentID: appointment.AppointmentID,
        },
        data: {
          ReminderSent: true,
        },
      });
    }
  } catch (error) {
    console.error("Error sending reminders:", error);
  }
};
