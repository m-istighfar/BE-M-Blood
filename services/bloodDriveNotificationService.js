const prisma = require("../config/db");
const { sendWhatsAppMessage } = require("./whatsappService");

exports.notifyUsersAboutBloodDrive = async (bloodDriveDetails) => {
  try {
    const eligibleUsers = await prisma.helpOffer.findMany({
      where: {
        CanHelpInEmergency: true,
        Location: bloodDriveDetails.Province.Name,
        User: {
          ProvinceID: bloodDriveDetails.ProvinceID,
        },
      },
      include: {
        User: true,
      },
    });

    const message = `Blood Drive Alert: ${
      bloodDriveDetails.Designation
    } organized by ${bloodDriveDetails.Institute} at ${
      bloodDriveDetails.Province.Name
    } on ${bloodDriveDetails.ScheduledDate.toLocaleDateString()} ${bloodDriveDetails.ScheduledDate.toLocaleTimeString()}.`;

    eligibleUsers.forEach(async (helpOffer) => {
      await sendWhatsAppMessage(helpOffer.User.Phone, message);
    });
  } catch (error) {
    console.error("Error notifying users about blood drive:", error);
  }
};
