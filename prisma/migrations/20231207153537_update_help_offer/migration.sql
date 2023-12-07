/*
  Warnings:

  - You are about to drop the column `Availability` on the `HelpOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HelpOffer" DROP COLUMN "Availability",
ADD COLUMN     "CanHelpInEmergency" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "IsWillingToDonate" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "Reason" DROP NOT NULL;
