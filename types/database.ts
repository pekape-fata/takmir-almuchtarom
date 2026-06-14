export type Role = 'admin' | 'pengurus' | 'jamaah'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  role: Role
  force_password_change: boolean
  created_at: string
}

export interface Pengurus {
  id: string
  nama: string
  jabatan: string
  foto_url: string | null
  periode: string
  urutan: number
  kontak: string | null
}

export interface Keuangan {
  id: string
  tanggal: string
  tahun: number
  bulan: number
  jenis: 'masuk' | 'keluar'
  kategori: string
  keterangan: string | null
  jumlah: number
  bukti_url: string | null
  created_by: string | null
  created_at: string
}

export interface Kegiatan {
  id: string
  judul: string
  deskripsi: string | null
  tanggal: string
  waktu: string | null
  lokasi: string | null
  poster_url: string | null
  status: 'akan datang' | 'selesai'
}

export type KategoriKonsultasi =
  | 'agama'
  | 'keluarga'
  | 'pendidikan'
  | 'ekonomi'
  | 'sosial'

export interface Konsultasi {
  id: string
  user_id: string | null
  kategori: KategoriKonsultasi
  pertanyaan: string
  draft_ai: string | null
  jawaban_final: string | null
  status: 'pending' | 'draft_ready' | 'verified'
  verified_by: string | null
  created_at: string
}
