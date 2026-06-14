-- =========================================================
-- MIGRATION 003: Tambah kolom tanggal pada tabel keuangan
-- Jalankan ini jika tabel `keuangan` sudah ada sebelumnya
-- dan belum memiliki kolom `tanggal`.
-- =========================================================

alter table keuangan add column if not exists tanggal date;

-- Isi data lama: gunakan tanggal 1 dari bulan/tahun yang sudah tercatat
update keuangan
set tanggal = make_date(tahun, bulan, 1)
where tanggal is null;

alter table keuangan alter column tanggal set not null;
alter table keuangan alter column tanggal set default current_date;
