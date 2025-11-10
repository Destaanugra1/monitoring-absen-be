-- Add unlock_override column to Materi to allow admin override of deadline lock
ALTER TABLE "Materi" ADD COLUMN "unlock_override" BOOLEAN NOT NULL DEFAULT FALSE;