-- CreateTable
CREATE TABLE "Donation" (
    "DonationID" SERIAL NOT NULL,
    "DonorName" TEXT NOT NULL,
    "DonorEmail" TEXT NOT NULL,
    "Amount" DOUBLE PRECISION NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("DonationID")
);
