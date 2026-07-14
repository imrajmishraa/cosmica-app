-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "status" "AssetStatus" NOT NULL DEFAULT 'PENDING';
