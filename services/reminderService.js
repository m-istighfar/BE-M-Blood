const prisma = require("../config/db");
const { sendWhatsAppMessage } = require("./whatsappService");

exports.sendHourBeforeReminders = async () => {
  try {
    const oneHourLater = new Date(new Date().getTime() + 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        ScheduledDate: {
          gte: new Date(),
          lt: oneHourLater,
        },
        Status: "scheduled",
        HourBeforeReminderSent: false,
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
          HourBeforeReminderSent: true,
        },
      });
    }
  } catch (error) {
    console.error("Error sending hour-before reminders:", error);
  }
};

exports.sendMorningReminders = async () => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        ScheduledDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        Status: "scheduled",
        MorningReminderSent: false,
      },
      include: {
        User: true,
      },
    });

    for (const appointment of appointmentsToday) {
      const reminderMessage = `Good morning! Remember you have an appointment today at ${appointment.ScheduledDate.toLocaleString()}.`;
      await sendWhatsAppMessage(appointment.User.Phone, reminderMessage);

      await prisma.appointment.update({
        where: {
          AppointmentID: appointment.AppointmentID,
        },
        data: {
          MorningReminderSent: true,
        },
      });
    }
  } catch (error) {
    console.error("Error sending morning reminders:", error);
  }
};
