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
const createTransaction = (req, res) => {
  let parameter = {
    transaction_details: {
      order_id: "order-id-" + Math.round(new Date().getTime() / 1000),
      gross_amount: Number(req.body.amount),
    },
    customer_details: {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
    },
    credit_card: {
      secure: true,
    },
  };

  snap
    .createTransaction(parameter)
    .then((transaction) => {
      let redirectUrl = transaction.redirect_url;
      res.json({ redirectUrl: redirectUrl });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    });
};

module.exports = { createTransaction };
