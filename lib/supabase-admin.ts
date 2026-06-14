import { createClient } from '@supabase/supabase-js'

/**
 * Membuat Supabase admin client (service role) secara lazy.
 * PENTING: jangan buat instance ini di top-level module, karena Next.js
 * mengevaluasi module saat build time ("collect page data") dan akan
 * gagal jika environment variable belum tersedia pada tahap tersebut.
 * Panggil fungsi ini di DALAM request handler saja.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Konfigurasi server belum lengkap: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset.'
    )
  }

  return createClient(url, serviceRoleKey)
}
