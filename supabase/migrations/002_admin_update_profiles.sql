-- =========================================================
-- MIGRATION 002: Tambahan policy admin untuk kelola user
-- Jalankan ini jika sebelumnya sudah menjalankan schema.sql versi awal.
-- (Jika baru setup dari nol, cukup jalankan schema.sql terbaru saja)
-- =========================================================

drop policy if exists "Admin update semua profil" on profiles;

create policy "Admin update semua profil" on profiles
  for update to authenticated
  using (current_role_is(array['admin']))
  with check (current_role_is(array['admin']));
