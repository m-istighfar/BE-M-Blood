-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "BloodType" (
    "BloodTypeID" SERIAL NOT NULL,
    "Type" TEXT NOT NULL,

    CONSTRAINT "BloodType_pkey" PRIMARY KEY ("BloodTypeID")
);

-- CreateTable
CREATE TABLE "UserAuth" (
    "UserAuthID" SERIAL NOT NULL,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Role" "UserRole" NOT NULL,
    "ResetPasswordToken" TEXT,
    "ResetPasswordExpires" TIMESTAMP(3),
    "Verified" BOOLEAN NOT NULL DEFAULT false,
    "VerificationToken" TEXT,
    "UserID" INTEGER,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAuth_pkey" PRIMARY KEY ("UserAuthID")
);

-- CreateTable
CREATE TABLE "User" (
    "UserID" SERIAL NOT NULL,
    "SubDistrictID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,
    "AdditionalInfo" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "Province" (
    "ProvinceID" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Capital" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("ProvinceID")
);

-- CreateTable
CREATE TABLE "District" (
    "DistrictID" SERIAL NOT NULL,
    "ProvinceID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("DistrictID")
);

-- CreateTable
CREATE TABLE "SubDistrict" (
    "SubDistrictID" SERIAL NOT NULL,
    "DistrictID" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubDistrict_pkey" PRIMARY KEY ("SubDistrictID")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "AppointmentID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "BloodTypeID" INTEGER NOT NULL,
    "ScheduledDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("AppointmentID")
);

-- CreateTable
CREATE TABLE "EmergencyRequest" (
    "RequestID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "BloodTypeID" INTEGER NOT NULL,
    "RequestDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyRequest_pkey" PRIMARY KEY ("RequestID")
);

-- CreateTable
CREATE TABLE "HelpOffer" (
    "OfferID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Reason" TEXT NOT NULL,
    "Availability" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpOffer_pkey" PRIMARY KEY ("OfferID")
);

-- CreateTable
CREATE TABLE "BloodDrive" (
    "DriveID" SERIAL NOT NULL,
    "UserID" INTEGER NOT NULL,
    "Institute" TEXT NOT NULL,
    "ProvinceID" INTEGER NOT NULL,
    "Designation" TEXT NOT NULL,
    "ScheduledDate" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodDrive_pkey" PRIMARY KEY ("DriveID")
);

-- CreateTable
CREATE TABLE "BloodInventory" (
    "InventoryID" SERIAL NOT NULL,
    "BloodTypeID" INTEGER NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "ExpiryDate" TIMESTAMP(3) NOT NULL,
    "ProvinceID" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodInventory_pkey" PRIMARY KEY ("InventoryID")
);

-- CreateIndex
CREATE UNIQUE INDEX "BloodType_Type_key" ON "BloodType"("Type");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_Username_key" ON "UserAuth"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_Email_key" ON "UserAuth"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_ResetPasswordToken_key" ON "UserAuth"("ResetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_VerificationToken_key" ON "UserAuth"("VerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_UserID_key" ON "UserAuth"("UserID");

-- AddForeignKey
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_SubDistrictID_fkey" FOREIGN KEY ("SubDistrictID") REFERENCES "SubDistrict"("SubDistrictID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_ProvinceID_fkey" FOREIGN KEY ("ProvinceID") REFERENCES "Province"("ProvinceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubDistrict" ADD CONSTRAINT "SubDistrict_DistrictID_fkey" FOREIGN KEY ("DistrictID") REFERENCES "District"("DistrictID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_BloodTypeID_fkey" FOREIGN KEY ("BloodTypeID") REFERENCES "BloodType"("BloodTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyRequest" ADD CONSTRAINT "EmergencyRequest_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyRequest" ADD CONSTRAINT "EmergencyRequest_BloodTypeID_fkey" FOREIGN KEY ("BloodTypeID") REFERENCES "BloodType"("BloodTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpOffer" ADD CONSTRAINT "HelpOffer_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDrive" ADD CONSTRAINT "BloodDrive_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDrive" ADD CONSTRAINT "BloodDrive_ProvinceID_fkey" FOREIGN KEY ("ProvinceID") REFERENCES "Province"("ProvinceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodInventory" ADD CONSTRAINT "BloodInventory_BloodTypeID_fkey" FOREIGN KEY ("BloodTypeID") REFERENCES "BloodType"("BloodTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodInventory" ADD CONSTRAINT "BloodInventory_ProvinceID_fkey" FOREIGN KEY ("ProvinceID") REFERENCES "Province"("ProvinceID") ON DELETE RESTRICT ON UPDATE CASCADE;
