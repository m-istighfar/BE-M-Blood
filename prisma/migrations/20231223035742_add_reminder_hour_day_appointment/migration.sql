/*
  Warnings:

  - You are about to drop the column `ReminderSent` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "ReminderSent",
ADD COLUMN     "HourBeforeReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "MorningReminderSent" BOOLEAN NOT NULL DEFAULT false;
