-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "Status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled';
