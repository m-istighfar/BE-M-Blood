const twilio = require("twilio");
const {
  accountSid,
  authToken,
  whatsappNumber,
} = require("../config/twilioConfig");

const client = new twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
  try {
    const message = await client.messages.create({
      body: body,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${to}`,
    });

    console.log(`Message sent: ${message.sid}`);
  } catch (error) {
    console.error(`Error sending WhatsApp message: ${error}`);
  }
};

module.exports = sendWhatsAppMessage;
