const cron = require("node-cron");
const {
  sendHourBeforeReminders,
  sendMorningReminders,
} = require("../services/reminderService");

const scheduleReminderJobs = () => {
  cron.schedule("* * * * *", () => {
    console.log("Checking for hour-before appointments...");
    sendHourBeforeReminders();
  });

  cron.schedule("0 7 * * *", () => {
    console.log("Sending morning reminders...");
    sendMorningReminders();
  });
};

module.exports = scheduleReminderJobs;
