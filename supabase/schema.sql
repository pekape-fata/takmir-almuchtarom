-- =========================================================
-- SCHEMA: Takmir Langgar Waqaf Al Muchtarom
-- Jalankan di Supabase SQL Editor
--
-- File ini AMAN dijalankan berulang kali (idempotent):
-- - Tabel/index/trigger/fungsi: tidak akan error jika sudah ada
-- - Policy: di-drop dulu lalu dibuat ulang (selalu konsisten)
-- - Seed data pengurus: hanya dimasukkan jika tabel masih kosong
-- =========================================================

-- ============ TABEL PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  role text not null default 'jamaah' check (role in ('admin','pengurus','jamaah')),
  force_password_change boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ TABEL PENGURUS ============
create table if not exists pengurus (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan text not null,
  foto_url text,
  periode text not null,
  urutan int not null default 0,
  kontak text,
  created_at timestamptz not null default now()
);

-- ============ TABEL KEUANGAN ============
create table if not exists keuangan (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  tahun int not null check (tahun between 2021 and 2030),
  bulan int not null check (bulan between 1 and 12),
  jenis text not null check (jenis in ('masuk','keluar')),
  kategori text not null,
  keterangan text,
  jumlah numeric(14,2) not null,
  bukti_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_keuangan_tahun_bulan on keuangan(tahun, bulan);

-- ============ TABEL KEGIATAN ============
create table if not exists kegiatan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  tanggal date not null,
  waktu time,
  lokasi text,
  poster_url text,
  status text not null default 'akan datang' check (status in ('akan datang','selesai')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_kegiatan_tanggal on kegiatan(tanggal);

-- ============ TABEL JADWAL SHOLAT CACHE (opsional) ============
create table if not exists jadwal_sholat_cache (
  id uuid primary key default gen_random_uuid(),
  kota text not null,
  tanggal date not null,
  subuh time,
  dzuhur time,
  ashar time,
  maghrib time,
  isya time,
  unique(kota, tanggal)
);

-- ============ TABEL KONSULTASI ============
create table if not exists konsultasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  kategori text not null check (kategori in ('agama','keluarga','pendidikan','ekonomi','sosial')),
  pertanyaan text not null,
  draft_ai text,
  jawaban_final text,
  status text not null default 'pending' check (status in ('pending','draft_ready','verified')),
  verified_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_konsultasi_status on konsultasi(status);

-- =========================================================
-- FUNCTION: auto-create profile saat user baru dibuat
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, role, force_password_change)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'jamaah'),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- HELPER FUNCTION: cek role user saat ini
-- =========================================================
create or replace function public.current_role_is(allowed_roles text[])
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = any(allowed_roles)
  );
$$ language sql security definer stable;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table pengurus enable row level security;
alter table keuangan enable row level security;
alter table kegiatan enable row level security;
alter table jadwal_sholat_cache enable row level security;
alter table konsultasi enable row level security;

-- ---------- PROFILES ----------
drop policy if exists "User bisa lihat profil sendiri" on profiles;
create policy "User bisa lihat profil sendiri" on profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "Admin lihat semua profil" on profiles;
create policy "Admin lihat semua profil" on profiles
  for select to authenticated using (current_role_is(array['admin']));

drop policy if exists "User update profil sendiri" on profiles;
create policy "User update profil sendiri" on profiles
  for update to authenticated using (id = auth.uid());

drop policy if exists "Admin update semua profil" on profiles;
create policy "Admin update semua profil" on profiles
  for update to authenticated
  using (current_role_is(array['admin']))
  with check (current_role_is(array['admin']));

-- ---------- PENGURUS (publik bisa baca) ----------
drop policy if exists "Publik baca pengurus" on pengurus;
create policy "Publik baca pengurus" on pengurus
  for select to anon, authenticated using (true);

drop policy if exists "Admin kelola pengurus" on pengurus;
create policy "Admin kelola pengurus" on pengurus
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- KEUANGAN (publik bisa baca, pengurus/admin CRUD) ----------
drop policy if exists "Publik baca keuangan" on keuangan;
create policy "Publik baca keuangan" on keuangan
  for select to anon, authenticated using (true);

drop policy if exists "Pengurus kelola keuangan" on keuangan;
create policy "Pengurus kelola keuangan" on keuangan
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- KEGIATAN (publik bisa baca, pengurus/admin CRUD) ----------
drop policy if exists "Publik baca kegiatan" on kegiatan;
create policy "Publik baca kegiatan" on kegiatan
  for select to anon, authenticated using (true);

drop policy if exists "Pengurus kelola kegiatan" on kegiatan;
create policy "Pengurus kelola kegiatan" on kegiatan
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- JADWAL SHOLAT CACHE (publik baca, sistem tulis) ----------
drop policy if exists "Publik baca jadwal sholat" on jadwal_sholat_cache;
create policy "Publik baca jadwal sholat" on jadwal_sholat_cache
  for select to anon, authenticated using (true);

drop policy if exists "Authenticated bisa insert jadwal cache" on jadwal_sholat_cache;
create policy "Authenticated bisa insert jadwal cache" on jadwal_sholat_cache
  for insert to authenticated with check (true);

-- ---------- KONSULTASI ----------
-- Publik (anon) bisa kirim pertanyaan (insert) tanpa login
drop policy if exists "Siapapun bisa ajukan konsultasi" on konsultasi;
create policy "Siapapun bisa ajukan konsultasi" on konsultasi
  for insert to anon, authenticated with check (true);

-- Hanya jawaban yang sudah 'verified' tampil ke publik
drop policy if exists "Publik baca konsultasi terverifikasi" on konsultasi;
create policy "Publik baca konsultasi terverifikasi" on konsultasi
  for select to anon using (status = 'verified');

-- User login bisa lihat konsultasi miliknya sendiri (semua status)
drop policy if exists "User lihat konsultasi sendiri" on konsultasi;
create policy "User lihat konsultasi sendiri" on konsultasi
  for select to authenticated using (user_id = auth.uid() or status = 'verified');

-- Admin / pengurus (sebagai ustadz/narasumber) bisa lihat & update semua
drop policy if exists "Ustadz kelola konsultasi" on konsultasi;
create policy "Ustadz kelola konsultasi" on konsultasi
  for select to authenticated using (current_role_is(array['admin','pengurus']));

drop policy if exists "Ustadz update konsultasi" on konsultasi;
create policy "Ustadz update konsultasi" on konsultasi
  for update to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- =========================================================
-- SEED DATA CONTOH (opsional)
-- Hanya dimasukkan jika tabel pengurus masih kosong, agar
-- aman dijalankan berulang kali tanpa membuat duplikat.
-- =========================================================
insert into pengurus (nama, jabatan, periode, urutan, kontak)
select * from (values
  ('H. Ahmad Muchtarom', 'Ketua Takmir', '2024-2027', 1, '0812xxxxxxx'),
  ('Drs. Slamet Riyadi', 'Sekretaris', '2024-2027', 2, '0813xxxxxxx'),
  ('Hj. Siti Aminah', 'Bendahara', '2024-2027', 3, '0814xxxxxxx')
) as seed(nama, jabatan, periode, urutan, kontak)
where not exists (select 1 from pengurus);

-- =========================================================
-- Paksa PostgREST (Supabase API) memuat ulang schema cache,
-- supaya kolom/tabel yang baru dibuat/diubah langsung dikenali API.
-- =========================================================
notify pgrst, 'reload schema';
