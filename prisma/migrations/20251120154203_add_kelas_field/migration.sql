-- CreateEnum
CREATE TYPE "Kelas" AS ENUM ('A', 'B', 'C');

-- AlterTable
ALTER TABLE "Materi" ADD COLUMN     "kelas" "Kelas" NOT NULL DEFAULT 'A';

-- AlterTable
ALTER TABLE "Peserta" ADD COLUMN     "kelas" "Kelas" NOT NULL DEFAULT 'A';
