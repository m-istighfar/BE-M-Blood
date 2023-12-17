const cron = require("node-cron");
const {
  sendRemindersForUpcomingAppointments,
} = require("../services/reminderService");

const scheduleReminderJob = () => {
  cron.schedule("* * * * *", () => {
    console.log("Checking for upcoming appointments...");
    sendRemindersForUpcomingAppointments();
  });
};

module.exports = scheduleReminderJob;
