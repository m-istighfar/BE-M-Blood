const prisma = require("../config/db");
const { sendWhatsAppMessage } = require("./whatsappService");

exports.notifyUsersAboutBloodDrive = async (
  bloodDriveDetails,
  isNew = true
) => {
  try {
    const eligibleUsers = await prisma.helpOffer.findMany({
      where: {
        Location: bloodDriveDetails.Province.Name,
        User: {
          ProvinceID: bloodDriveDetails.ProvinceID,
        },
      },
      include: {
        User: true,
      },
    });

    const messagePrefix = isNew
      ? "New Blood Drive Alert:"
      : "Updated Blood Drive Alert:";
    const message = `${messagePrefix} ${
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
