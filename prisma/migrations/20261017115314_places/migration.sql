-- CreateEnum
CREATE TYPE "PlaceRegion" AS ENUM ('central_africa', 'west_africa', 'other_africa', 'world');

-- CreateEnum
CREATE TYPE "LocalityKind" AS ENUM ('city', 'province');

-- AlterTable
ALTER TABLE "TalentProfile" ADD COLUMN     "desiredCountries" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "PlaceRegion" NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LocalityKind" NOT NULL DEFAULT 'city',
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Locality_countryCode_rank_idx" ON "Locality"("countryCode", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_countryCode_name_key" ON "Locality"("countryCode", "name");

-- AddForeignKey
ALTER TABLE "Locality" ADD CONSTRAINT "Locality_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE CASCADE ON UPDATE CASCADE;
