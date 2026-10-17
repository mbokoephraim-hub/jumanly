-- CreateEnum
CREATE TYPE "UserTheme" AS ENUM ('light', 'green');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "theme" "UserTheme" NOT NULL DEFAULT 'light';
