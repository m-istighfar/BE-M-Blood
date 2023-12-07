/*
  Warnings:

  - Added the required column `Location` to the `HelpOffer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HelpOffer" ADD COLUMN     "Location" TEXT NOT NULL;
