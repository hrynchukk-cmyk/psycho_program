-- CreateTable
CREATE TABLE "NoteAudio" (
    "noteId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "durationSec" INTEGER,

    CONSTRAINT "NoteAudio_pkey" PRIMARY KEY ("noteId")
);

-- AddForeignKey
ALTER TABLE "NoteAudio" ADD CONSTRAINT "NoteAudio_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
