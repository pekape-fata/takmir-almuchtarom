# Dashboard Takmir Langgar Waqaf Al Muchtarom

Dashboard modern, profesional, informatif, dan interaktif untuk Takmir Langgar Waqaf
Al Muchtarom. Dibangun dengan Next.js (App Router) + Supabase + Tailwind CSS,
siap deploy via GitHub → Vercel.

## ✨ Fitur

- **Login berbasis username** (bukan email) dengan password default yang wajib diganti saat login pertama.
- **Mode publik** — semua orang bisa melihat data (pengurus, keuangan, kegiatan, jadwal sholat, konsultasi terverifikasi) tanpa login.
- **Ketakmiran** — susunan pengurus harian, CRUD untuk admin/pengurus.
- **Keuangan** — laporan pemasukan/pengeluaran/saldo, filter tahun (2021–2030) & bulan, grafik, export PDF.
- **Kegiatan** — agenda kegiatan takmir, CRUD.
- **Jadwal Sholat** — realtime berdasarkan geolokasi pengguna (Aladhan API), termasuk jadwal bulanan.
- **Konsultasi** — form tanya jawab (Agama, Keluarga, Pendidikan, Ekonomi, Sosial). Draft jawaban dibuat AI (Claude), lalu diverifikasi ustadz/admin sebelum dipublikasikan.
- **Dark/Light mode**, animasi modern dengan Framer Motion.

## 🛠️ Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| Backend / DB / Auth | Supabase (Postgres + Auth + RLS) |
| Animasi | Framer Motion |
| Chart | Recharts |
| PDF | jsPDF |
| AI Draft | Anthropic Claude API |
| Hosting | Vercel |
| Version Control | GitHub |

## 🚀 Setup Lokal

```bash
git clone <repo-url>
cd takmir-app
npm install
cp .env.local.example .env.local
# isi .env.local dengan kredensial Supabase & Anthropic
npm run dev
```

## 🗄️ Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan file `supabase/schema.sql` (membuat semua tabel, trigger, dan RLS policy).
3. Salin `Project URL` dan `anon public key` ke `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Salin `service_role key` (Settings → API) ke `SUPABASE_SERVICE_ROLE_KEY` (⚠️ jangan pernah expose ke client).

### Membuat user admin pertama

Karena pendaftaran user tidak dibuka untuk publik (hanya admin yang membuat akun),
buat admin pertama secara manual:

1. Di Supabase Dashboard → **Authentication → Users → Add user**, buat user dengan:
   - Email: `admin@takmir.local`
   - Password: (password default, misal `Takmir2025!`)
   - Centang "Auto Confirm User"
2. Trigger `handle_new_user` otomatis membuat baris di tabel `profiles` dengan `username = admin`, `role = jamaah`, `force_password_change = true`.
3. Update role admin secara manual via SQL Editor:
   ```sql
   update profiles set role = 'admin' where username = 'admin';
   ```
4. Login di aplikasi dengan username `admin` dan password default → akan diarahkan ke halaman ganti password.

Setelah login sebagai admin, admin dapat membuat user pengurus/jamaah lain melalui
endpoint `/api/admin/create-user` (atau buat UI form admin tambahan).

## 🤖 Setup Anthropic API (Konsultasi AI)

1. Buat API key di [console.anthropic.com](https://console.anthropic.com).
2. Isi `ANTHROPIC_API_KEY` di `.env.local` (dan di Environment Variables Vercel).

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → Import repo GitHub.
3. Tambahkan Environment Variables (sama seperti `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy. Vercel otomatis build & hosting Next.js.
5. (Opsional) Tambahkan custom domain di Vercel → Settings → Domains.

## 📁 Struktur Folder

```
app/
  page.tsx                  # Dashboard publik (home)
  login/                     # Login username
  change-password/           # Wajib ganti password pertama
  dashboard/
    pengurus/                # Ketakmiran (CRUD)
    keuangan/                # Laporan keuangan (CRUD, filter, chart, PDF)
    kegiatan/                # Agenda kegiatan (CRUD)
    jadwal-sholat/           # Jadwal sholat realtime
    konsultasi/              # Tanya jawab + verifikasi ustadz
      [id]/verify/
  api/
    admin/create-user/       # Admin membuat akun baru
    konsultasi/draft/         # Generate draft AI (Claude)
components/                  # Navbar, ThemeToggle, Modal, dll
lib/                          # Supabase client, helper
supabase/schema.sql           # Schema database + RLS
types/database.ts             # TypeScript types
```

## 🔐 Catatan Keamanan

- RLS aktif di semua tabel: publik hanya bisa `SELECT`, sedangkan `INSERT/UPDATE/DELETE`
  dibatasi role `admin`/`pengurus` sesuai policy di `schema.sql`.
- `SUPABASE_SERVICE_ROLE_KEY` dan `ANTHROPIC_API_KEY` hanya digunakan di server (API routes),
  tidak pernah dikirim ke browser.
- Username dipetakan ke email internal (`username@takmir.local`) agar Supabase Auth
  (yang berbasis email) tetap bisa dipakai dengan login username.
