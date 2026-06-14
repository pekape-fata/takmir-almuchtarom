-- =========================================================
-- SCHEMA: Takmir Langgar Waqaf Al Muchtarom
-- Jalankan di Supabase SQL Editor
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
create policy "User bisa lihat profil sendiri" on profiles
  for select to authenticated using (id = auth.uid());

create policy "Admin lihat semua profil" on profiles
  for select to authenticated using (current_role_is(array['admin']));

create policy "User update profil sendiri" on profiles
  for update to authenticated using (id = auth.uid());

-- ---------- PENGURUS (publik bisa baca) ----------
create policy "Publik baca pengurus" on pengurus
  for select to anon, authenticated using (true);

create policy "Admin kelola pengurus" on pengurus
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- KEUANGAN (publik bisa baca, pengurus/admin CRUD) ----------
create policy "Publik baca keuangan" on keuangan
  for select to anon, authenticated using (true);

create policy "Pengurus kelola keuangan" on keuangan
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- KEGIATAN (publik bisa baca, pengurus/admin CRUD) ----------
create policy "Publik baca kegiatan" on kegiatan
  for select to anon, authenticated using (true);

create policy "Pengurus kelola kegiatan" on kegiatan
  for all to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- ---------- JADWAL SHOLAT CACHE (publik baca, sistem tulis) ----------
create policy "Publik baca jadwal sholat" on jadwal_sholat_cache
  for select to anon, authenticated using (true);

create policy "Authenticated bisa insert jadwal cache" on jadwal_sholat_cache
  for insert to authenticated with check (true);

-- ---------- KONSULTASI ----------
-- Publik (anon) bisa kirim pertanyaan (insert) tanpa login
create policy "Siapapun bisa ajukan konsultasi" on konsultasi
  for insert to anon, authenticated with check (true);

-- Hanya jawaban yang sudah 'verified' tampil ke publik
create policy "Publik baca konsultasi terverifikasi" on konsultasi
  for select to anon using (status = 'verified');

-- User login bisa lihat konsultasi miliknya sendiri (semua status)
create policy "User lihat konsultasi sendiri" on konsultasi
  for select to authenticated using (user_id = auth.uid() or status = 'verified');

-- Admin / pengurus (sebagai ustadz/narasumber) bisa lihat & update semua
create policy "Ustadz kelola konsultasi" on konsultasi
  for select to authenticated using (current_role_is(array['admin','pengurus']));

create policy "Ustadz update konsultasi" on konsultasi
  for update to authenticated
  using (current_role_is(array['admin','pengurus']))
  with check (current_role_is(array['admin','pengurus']));

-- =========================================================
-- SEED DATA CONTOH (opsional)
-- =========================================================
insert into pengurus (nama, jabatan, periode, urutan, kontak) values
  ('H. Ahmad Muchtarom', 'Ketua Takmir', '2024-2027', 1, '0812xxxxxxx'),
  ('Drs. Slamet Riyadi', 'Sekretaris', '2024-2027', 2, '0813xxxxxxx'),
  ('Hj. Siti Aminah', 'Bendahara', '2024-2027', 3, '0814xxxxxxx')
on conflict do nothing;
