let midtransClient = require("midtrans-client");

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-4FQ4wrXbooI_7Wvl5YBVf2oZ",
  clientKey: "SB-Mid-client-D7Pe2FmM10sLsp6J",
});

// let snap = new midtransClient.Snap({
//   isProduction: true,
//   serverKey: "Mid-client-TR9-JKeBlqCVnWQB",
//   clientKey: "Mid-server-TGbbI-Hnf4lXZuylxnnpH9zl",
// });
const createTransaction = async (req, res) => {
  const { firstName, lastName, email, phone, amount } = req.body;

  try {
    let parameter = {
      transaction_details: {
        order_id: "order-id-" + Math.round(new Date().getTime() / 1000),
        gross_amount: Number(amount),
      },
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
      },
      credit_card: {
        secure: true,
      },
    };

    const token = await snap.createTransactionToken(parameter);

    return res.status(200).json({ snapToken: token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createTransaction };
