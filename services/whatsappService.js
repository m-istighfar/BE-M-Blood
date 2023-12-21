const twilio = require("twilio");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

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
