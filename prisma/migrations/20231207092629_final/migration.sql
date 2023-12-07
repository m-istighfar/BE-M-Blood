/*
  Warnings:

  - You are about to drop the column `SubDistrictID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubDistrict` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ProvinceID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "District" DROP CONSTRAINT "District_ProvinceID_fkey";

-- DropForeignKey
ALTER TABLE "SubDistrict" DROP CONSTRAINT "SubDistrict_DistrictID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_SubDistrictID_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "SubDistrictID",
ADD COLUMN     "ProvinceID" INTEGER NOT NULL;

-- DropTable
DROP TABLE "District";

-- DropTable
DROP TABLE "SubDistrict";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ProvinceID_fkey" FOREIGN KEY ("ProvinceID") REFERENCES "Province"("ProvinceID") ON DELETE RESTRICT ON UPDATE CASCADE;
