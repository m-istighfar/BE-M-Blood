const prisma = require("../config/db");
const { sendWhatsAppMessage } = require("./whatsappService");

exports.notifyEligibleDonors = async (bloodTypeID, provinceID) => {
  try {
    const eligibleUsers = await prisma.helpOffer.findMany({
      where: {
        BloodTypeID: bloodTypeID,
        CanHelpInEmergency: true,
        IsWillingToDonate: true,
        User: {
          ProvinceID: provinceID,
        },
      },
      include: {
        User: true,
      },
    });

    for (const user of eligibleUsers) {
      const message = "Emergency blood donation request! Your help is needed.";
      await sendWhatsAppMessage(user.User.Phone, message);
    }
  } catch (error) {
    console.error("Error notifying eligible donors:", error);
  }
};
