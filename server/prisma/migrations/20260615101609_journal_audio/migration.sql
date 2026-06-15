-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "transcriptStatus" TEXT;

-- CreateTable
CREATE TABLE "JournalAudio" (
    "entryId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "durationSec" INTEGER,

    CONSTRAINT "JournalAudio_pkey" PRIMARY KEY ("entryId")
);

-- AddForeignKey
ALTER TABLE "JournalAudio" ADD CONSTRAINT "JournalAudio_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
