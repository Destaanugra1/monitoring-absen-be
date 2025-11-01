-- CreateEnum
CREATE TYPE "KeaktifanStatus" AS ENUM ('HIJAU', 'KUNING', 'MERAH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "image_url" TEXT,
    "last_sign_in_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peserta" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hari" (
    "id" SERIAL NOT NULL,
    "nama_hari" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materi" (
    "id" SERIAL NOT NULL,
    "id_hari" INTEGER NOT NULL,
    "judul_materi" TEXT NOT NULL,
    "pemateri" TEXT,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),

    CONSTRAINT "Materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keaktifan" (
    "id" SERIAL NOT NULL,
    "id_peserta" INTEGER NOT NULL,
    "id_materi" INTEGER NOT NULL,
    "status" "KeaktifanStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Keaktifan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Materi_id_hari_idx" ON "Materi"("id_hari");

-- CreateIndex
CREATE INDEX "Keaktifan_id_materi_idx" ON "Keaktifan"("id_materi");

-- CreateIndex
CREATE UNIQUE INDEX "Keaktifan_id_peserta_id_materi_key" ON "Keaktifan"("id_peserta", "id_materi");

-- AddForeignKey
ALTER TABLE "Materi" ADD CONSTRAINT "Materi_id_hari_fkey" FOREIGN KEY ("id_hari") REFERENCES "Hari"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keaktifan" ADD CONSTRAINT "Keaktifan_id_peserta_fkey" FOREIGN KEY ("id_peserta") REFERENCES "Peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keaktifan" ADD CONSTRAINT "Keaktifan_id_materi_fkey" FOREIGN KEY ("id_materi") REFERENCES "Materi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
