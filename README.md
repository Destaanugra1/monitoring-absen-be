# Backend DAD — Express + Prisma + Clerk + Neon (PostgreSQL)

Backend ini menyediakan API untuk mengelola peserta, hari, materi, dan keaktifan, dengan autentikasi via Clerk. Database menggunakan Neon (PostgreSQL) dan ORM Prisma.

## Stack

- Express.js
- Prisma ORM (PostgreSQL — Neon)
- Clerk (auth; role: Panitia untuk akses tulis)
- exceljs (import & export Excel)
- Multer (upload file, memory storage)

## Struktur Folder

```
server/
  index.js
  package.json
  prisma.config.ts
  prisma/
    schema.prisma
  src/
    controllers/
      peserta.controller.js
      hari.controller.js
      materi.controller.js
      keaktifan.controller.js
      upload.controller.js
    middlewares/
      auth.js
      clerkSync.js
      errors.js
      upload.js
    routes/
      peserta.routes.js
      hari.routes.js
      materi.routes.js
      keaktifan.routes.js
      export.routes.js
    services/
      excelService.js
      validationService.js
      keaktifanService.js
    utils/
      prisma.js
```

## Environment Variables

Buat file `.env` di `server/` (sudah ada contoh di repo). Set variabel berikut:

- `DATABASE_URL` — connection string Neon (PostgreSQL)
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- (opsional) `CLERK_WEBHOOK_SECRET` — jika pakai webhook user.created/user.updated
- (opsional) `PORT` — default 3000

Di Vercel, set variabel yang sama di Project Settings > Environment Variables.

## Prisma

- Schema model: `User` (mirror dari Clerk), `Peserta`, `Hari`, `Materi`, `Keaktifan`.
- Relasi:
  - Hari 1—N Materi
  - Peserta 1—N Keaktifan
  - Materi 1—N Keaktifan
- Constraint: `Keaktifan` unique per `(id_peserta, id_materi)`.
- Auto-lock: field `Materi.locked` dan `locked_at` untuk menutup input setelah jam 23:59 (lihat bagian Auto Lock di bawah).

## Menjalankan di Lokal

1) Generate Prisma Client (jika berubah schema)

```powershell
npx prisma generate --schema "server/prisma/schema.prisma"
```

2) Apply migrasi (database Neon)

```powershell
cmd /c "cd /d d:\semester 5\DAD\server && npx --yes prisma migrate dev --name init"
```

3) Jalankan server

```powershell
node "d:\semester 5\DAD\server\index.js"
```

Default listen di `http://localhost:3000` (atau PORT).

## Autentikasi (Clerk)

Semua request melewati `clerkMiddleware` dan middleware `syncClerkUser` yang otomatis menyimpan/menyinkronkan user ke tabel `User` saat request terautentikasi.

- Endpoint test: `GET /me` → mengembalikan user (mirror dari Clerk) jika token valid.
- Akses tulis dibatasi untuk role "Panitia" via `requirePanitia()`.
  - Role dibaca dari `publicMetadata.role` atau `privateMetadata.role` di Clerk.

### Login via Postman (tanpa browser)

Untuk testing API, cara termudah adalah menerbitkan JWT dari Clerk untuk user yang kamu pilih:

1) Buat JWT template di Clerk (mis. nama `postman`) dengan Allowed audiences diarahkan ke base URL API kamu (contoh: `http://localhost:3000`).
2) Terbitkan JWT via Clerk API:
   - POST `https://api.clerk.com/v1/jwts/issue`
   - Headers:
     - `Authorization: Bearer <CLERK_SECRET_KEY>`
     - `Content-Type: application/json`
   - Body (pilih salah satu tergantung versi API Clerk):

```json
{
  "template": "postman",
  "user_id": "user_XXXXXXXXXXXX"
}
```

atau

```json
{
  "template": "postman",
  "sub": "user_XXXXXXXXXXXX"
}
```

3) Panggil API kamu dengan header:

```
Authorization: Bearer <TOKEN_DARI_STEP_2>
```

Jika butuh role Panitia:
- PATCH `https://api.clerk.com/v1/users/<USER_ID>`
- Headers: `Authorization: Bearer <CLERK_SECRET_KEY>`
- Body:

```json
{
  "public_metadata": { "role": "Panitia" }
}
```

## Aturan Auto Lock 23:59

- Untuk setiap `Materi`, input keaktifan akan otomatis terkunci setelah lewat pukul 23:59 dari tanggal `Hari` terkait.
- Implementasi:
  - Sebelum upsert keaktifan, server memanggil `ensureNotLockedAndMaybeLock(id_materi)`.
  - Jika sudah lewat, server set `Materi.locked = true`, `locked_at = now`, dan mengembalikan HTTP 423 Locked.
- Admin/Panitia dapat membuka kunci manual:
  - `POST /api/materi/:id/unlock` — set `locked=false`, `locked_at=null`.

Catatan: perhitungan 23:59 memakai timezone server. Jika perlu zona waktu spesifik (mis. `Asia/Jakarta`), sesuaikan implementasi.

## Format File Excel (Upload Peserta)

- Worksheet pertama dipakai.
- Header opsional: `nama` (atau `name`/`nama_peserta`). Jika tidak ada header, sistem membaca kolom pertama.
- Duplikat di-file akan dihapus (berdasarkan normalisasi nama: trim + lowercase + collapse spaces).

## API Endpoints

Base URL: `http://localhost:3000`

- Umum
  - `GET /` → health (`API is up`)
  - `GET /me` → info user (butuh token Clerk)

- Peserta (`/api/peserta`)
  - `POST /upload` (Panitia) — multipart/form-data field `file` (.xlsx); import peserta; response ringkasan inserted/skipped.
  - `GET /` — list semua peserta
  - `GET /:id` — detail peserta
  - `DELETE /:id` (Panitia) — hapus peserta

- Hari (`/api/hari`)
  - `POST /` (Panitia) — body: `{ nama_hari, tanggal }`
  - `GET /` — list semua hari
  - `DELETE /:id` (Panitia) — hapus hari (cascade materi & keaktifan)

- Materi (`/api/materi`)
  - `POST /` (Panitia) — body: `{ id_hari, judul_materi, pemateri?, waktu_mulai, waktu_selesai }`
  - `GET /hari/:id_hari` — list materi per hari
  - `DELETE /:id` (Panitia) — hapus materi
  - `POST /:id/unlock` (Panitia) — buka kunci materi (manual)

- Keaktifan (`/api/keaktifan`)
  - `POST /` (Panitia) — body: `{ id_peserta, id_materi, status }` dgn status: `HIJAU | KUNING | MERAH` (respect auto-lock)
  - `GET /materi/:id_materi` — status semua peserta utk materi tsb (include peserta)
  - `GET /hari/:id_hari` — rekap keaktifan per materi pada hari tsb (count per warna)

- Export (`/api/export`)
  - `GET /hari/:id_hari` (Panitia) — download Excel rekap (worksheet `Rekap`): kolom `Nama` + per-materi (sel diwarnai sesuai status)

## Catatan Deploy

- Set semua ENV di Vercel (DATABASE_URL, CLERK_*).
- Gunakan Neon sebagai DB managed; migrasi Prisma bisa dijalankan dari lingkungan dev terlebih dahulu.
- Express ini berjalan sebagai server Node. Jika ingin murni serverless, pertimbangkan adaptasi ke Vercel Functions/Edge.

## Troubleshooting

- 401 Unauthorized: token Clerk tidak ada/invalid/expired.
- 403 Forbidden: role bukan Panitia.
- 423 Locked: materi sudah terkunci (auto-lock atau manual). Gunakan endpoint unlock.
- Upload error: pastikan field form-data bernama `file` dan berformat `.xlsx`.
- `@prisma/client did not initialize`: jalankan `npx prisma generate`.

## Lisensi

ISC (lihat `package.json`).

## Next fitur
- ubah ui
- menambahkan fitur unuk monitoring bph dan para kader setiap tahun
