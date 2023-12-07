/*
  Warnings:

  - Added the required column `Location` to the `EmergencyRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmergencyRequest" ADD COLUMN     "Location" TEXT NOT NULL;
