const twilio = require("twilio");

const accountSid = "AC0a91b703fdd066dd92f4be195bddfd24";
const authToken = "bc37f1c53e8937627f198483b1403a0b";
const twilioClient = twilio(accountSid, authToken);
const twilioWhatsAppNumber = "whatsapp:+14155238886";

exports.sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: `whatsapp:${phoneNumber}`,
    });
    console.log("Message sent: ", response.sid);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
};
