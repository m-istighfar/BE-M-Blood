-- CreateEnum
CREATE TYPE "EmergencyRequestStatus" AS ENUM ('pending', 'inProgress', 'fulfilled', 'expired', 'cancelled');

-- AlterTable
ALTER TABLE "EmergencyRequest" ADD COLUMN     "Status" "EmergencyRequestStatus" NOT NULL DEFAULT 'pending';
