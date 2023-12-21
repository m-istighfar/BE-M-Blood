let midtransClient = require("midtrans-client");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { errorResponse, successResponse } = require("../utils/response");

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-4FQ4wrXbooI_7Wvl5YBVf2oZ",
  clientKey: "SB-Mid-client-D7Pe2FmM10sLsp6J",
});

const createTransaction = async (req, res) => {
  const { firstName, lastName, email, phone, amount } = req.body;

  try {
    const donation = await prisma.donation.create({
      data: {
        DonorName: firstName,
        DonorEmail: email,
        Amount: Number(amount),
        Status: "pending",
      },
    });
    let parameter = {
      transaction_details: {
        order_id: donation.DonationID.toString(),
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

const midtransNotification = async (req, res) => {
  try {
    const { order_id, transaction_status } = req.body;

    const numericId = parseInt(order_id);

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      await prisma.donation.updateMany({
        where: { DonationID: numericId },
        data: { Status: "success" },
      });
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      await prisma.donation.updateMany({
        where: { DonationID: numericId },
        data: { Status: "failed" },
      });
    }

    res.status(200).send("OK");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const totalDonations = async (req, res) => {
  try {
    const total = await prisma.donation.aggregate({
      _sum: {
        Amount: true,
      },
      where: {
        Status: "success",
      },
    });

    res.status(200).json({ data: { totalRecords: total._sum.Amount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const donations = await prisma.donation.findMany({
      skip: offset,
      take: limit,
    });

    const totalRecords = await prisma.donation.count();

    successResponse(res, "Donations fetched successfully", {
      totalRecords,
      donations,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
    });
  } catch (error) {
    errorResponse(res, "Error fetching donations: " + error.message, 500);
  }
};

module.exports = {
  createTransaction,
  midtransNotification,
  totalDonations,
  getAllDonations,
};
