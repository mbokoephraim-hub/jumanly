-- Refonte mobile, lot 1 : apparence de l'espace talent (Auto, Clair, Sombre). Additive.
-- CreateEnum
CREATE TYPE "UserAppearance" AS ENUM ('auto', 'light', 'dark');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "appearance" "UserAppearance" NOT NULL DEFAULT 'auto';
