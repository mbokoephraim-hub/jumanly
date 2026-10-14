-- AlterEnum
ALTER TYPE "MembershipStatus" ADD VALUE 'suspended';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "pausedByBillingAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "creditCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "payerId" TEXT,
ADD COLUMN     "refundReference" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundedById" TEXT;

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "paymentId" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "billedName" TEXT NOT NULL,
    "billedEmail" TEXT NOT NULL,
    "billedAddress" TEXT,
    "billedTaxId" TEXT,
    "planName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "creditCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDetails" (
    "id" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "key" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "PaymentEvent_providerRef_idx" ON "PaymentEvent"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_eventId_key" ON "PaymentEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_sequence_key" ON "Invoice"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");

-- CreateIndex
CREATE INDEX "Invoice_subjectType_subjectId_idx" ON "Invoice"("subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingDetails_subjectType_subjectId_key" ON "BillingDetails"("subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
