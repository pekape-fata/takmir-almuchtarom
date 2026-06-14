# Panduan Deploy: GitHub → Supabase → Vercel

Panduan ini melengkapi `README.md` dengan langkah konkret, urut, dan siap salin-tempel
untuk membawa aplikasi dari local ke production.

---

## Bagian 1 — Push ke GitHub

Project ini sudah diinisialisasi sebagai repo Git lokal (branch `main`, commit awal sudah dibuat).

1. Buat repository baru (kosong, **tanpa** README/license) di GitHub, misal:
   `https://github.com/<username>/takmir-al-muchtarom`

2. Hubungkan & push dari folder project:
   ```bash
   cd takmir-app
   git remote add origin https://github.com/<username>/takmir-al-muchtarom.git
   git push -u origin main
   ```

3. (Opsional) Aktifkan GitHub Actions CI yang sudah disiapkan di
   `.github/workflows/ci.yml` — otomatis menjalankan lint & build setiap push/PR.
   Jika ingin CI berhasil penuh (tidak hanya skip), tambahkan secrets di
   **Settings → Secrets and variables → Actions**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`

---

## Bagian 2 — Setup Supabase (Backend)

1. Buat project baru di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor** → New query → jalankan isi file `supabase/schema.sql` secara penuh.
   - Ini membuat semua tabel (`profiles`, `pengurus`, `keuangan`, `kegiatan`,
     `jadwal_sholat_cache`, `konsultasi`), trigger `handle_new_user`, dan semua RLS policy.
   - 💡 File ini **aman dijalankan berulang kali** (idempotent) — jika ragu apakah
     sudah pernah dijalankan atau ada bagian yang gagal, cukup jalankan ulang saja.
     Policy akan di-replace, tabel/index tidak akan error jika sudah ada, dan seed
     data pengurus tidak akan terduplikasi.
3. Buka **Settings → API**, catat 3 nilai berikut:
   | Nilai | Untuk variabel |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, jangan expose ke browser) |

### Membuat akun Admin pertama

1. **Authentication → Users → Add user**:
   - Email: `admin@takmir.local`
   - Password: password default pilihan Anda (misal `Takmir@2025`)
   - Centang **Auto Confirm User**
2. Trigger otomatis membuat baris di `profiles` dengan `username = admin`,
   `role = jamaah`, `force_password_change = true`.
3. Jadikan admin via **SQL Editor**:
   ```sql
   update profiles set role = 'admin' where username = 'admin';
   ```
4. Login pertama kali di aplikasi: username `admin`, password default →
   sistem akan memaksa ganti password → setelah itu admin dapat:
   - Membuat user pengurus/jamaah lain lewat menu **Kelola User** (`/dashboard/admin/users`)
   - Mengisi data Pengurus, Keuangan, Kegiatan, dan memverifikasi Konsultasi

---

## Bagian 3 — Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pilih repo GitHub yang baru di-push.
2. Vercel akan otomatis mendeteksi framework **Next.js** — biarkan default build settings.
3. Sebelum klik Deploy, buka **Environment Variables** dan tambahkan 4 variabel ini
   (gunakan nilai dari Bagian 2 & dari Anthropic Console):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | dari Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari Supabase Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase Settings → API |
   | `ANTHROPIC_API_KEY` | dari [console.anthropic.com](https://console.anthropic.com) |

4. Klik **Deploy**. Tunggu build selesai (±1-2 menit).
5. Setelah deploy sukses, buka domain `*.vercel.app` yang diberikan — aplikasi sudah live.
6. (Opsional) **Settings → Domains** → tambahkan custom domain (misal `takmir-almuchtarom.id`).

### Update environment variable setelah deploy

Jika nanti mengganti project Supabase atau API key:
1. **Project Settings → Environment Variables** di Vercel → edit nilainya.
2. **Deployments** → klik deployment terbaru → **Redeploy** agar variabel baru terpakai.

---

## Bagian 4 — Checklist Pasca-Deploy

- [ ] Buka domain production, pastikan homepage (mode publik) tampil tanpa error.
- [ ] Cek widget **Jadwal Sholat** — browser akan minta izin lokasi (HTTPS diperlukan; Vercel sudah HTTPS otomatis).
- [ ] Login sebagai `admin`, ganti password default.
- [ ] Tambahkan data **Pengurus** awal (susunan takmir).
- [ ] Tambahkan beberapa **Kegiatan** & transaksi **Keuangan** contoh.
- [ ] Coba kirim **Konsultasi** dari mode publik (tanpa login), pastikan draft AI muncul di antrian admin.
- [ ] Buat 1-2 akun **pengurus** via Kelola User untuk operasional harian.
- [ ] Verifikasi dark/light mode toggle berfungsi di semua halaman.

---

## Troubleshooting Singkat

| Masalah | Kemungkinan Sebab | Solusi |
|---|---|---|
| Login gagal "username atau password salah" | User belum dibuat / role belum diisi | Cek tabel `profiles` & `auth.users` di Supabase |
| Data tidak muncul di halaman publik | RLS policy `select` belum aktif | Jalankan ulang bagian RLS di `schema.sql` |
| Tombol Tambah/Edit tidak muncul | User login tapi role masih `jamaah` | Ubah role lewat **Kelola User** (admin) |
| Draft AI tidak muncul di Konsultasi | `ANTHROPIC_API_KEY` belum diset / salah | Cek Environment Variables di Vercel, redeploy |
| Jadwal sholat tidak muncul | Browser menolak izin lokasi | Izinkan lokasi di pengaturan browser, refresh |
