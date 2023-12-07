/*
  Warnings:

  - Added the required column `BloodTypeID` to the `HelpOffer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HelpOffer" ADD COLUMN     "BloodTypeID" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "HelpOffer" ADD CONSTRAINT "HelpOffer_BloodTypeID_fkey" FOREIGN KEY ("BloodTypeID") REFERENCES "BloodType"("BloodTypeID") ON DELETE RESTRICT ON UPDATE CASCADE;
