-- Calls of the Chat in audio or in video, answered for real (WebRTC): who is called, how, and
-- the two connection descriptions while it rings.
-- AlterTable
ALTER TABLE "VideoCall" ADD COLUMN     "answer" TEXT,
ADD COLUMN     "answerMode" TEXT,
ADD COLUMN     "calleeId" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'video',
ADD COLUMN     "offer" TEXT;

-- CreateIndex
CREATE INDEX "VideoCall_calleeId_status_idx" ON "VideoCall"("calleeId", "status");

-- AddForeignKey
ALTER TABLE "VideoCall" ADD CONSTRAINT "VideoCall_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

