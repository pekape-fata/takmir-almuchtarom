'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { Modal } from '@/components/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, MapPin, Clock, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import type { Kegiatan } from '@/types/database'

const emptyForm = {
  judul: '', deskripsi: '', tanggal: '', waktu: '', lokasi: '', poster_url: '',
  status: 'akan datang' as 'akan datang' | 'selesai',
}

export default function KegiatanPage() {
  const supabase = createClient()
  const { canManage, userId } = useUserRole()
  const [data, setData] = useState<Kegiatan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Kegiatan | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchData = async () => {
    setLoading(true)
    const { data: rows, error } = await supabase.from('kegiatan').select('*').order('tanggal', { ascending: true })
    if (error) toast.error('Gagal memuat data kegiatan')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (k: Kegiatan) => {
    setEditing(k)
    setForm({
      judul: k.judul, deskripsi: k.deskripsi ?? '', tanggal: k.tanggal,
      waktu: k.waktu ?? '', lokasi: k.lokasi ?? '', poster_url: k.poster_url ?? '', status: k.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('kegiatan').update(form).eq('id', editing.id)
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Kegiatan diperbarui')
    } else {
      const { error } = await supabase.from('kegiatan').insert({ ...form, created_by: userId })
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Kegiatan ditambahkan')
    }
    setModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kegiatan ini?')) return
    const { error } = await supabase.from('kegiatan').delete().eq('id', id)
    if (error) return toast.error('Gagal menghapus')
    toast.success('Kegiatan dihapus')
    fetchData()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda Kegiatan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kegiatan Takmir Langgar Waqaf Al Muchtarom</p>
        </div>
        {canManage && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
            <Plus size={16} /> Tambah Kegiatan
          </motion.button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada kegiatan.</p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {data.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl w-16 h-16 flex-shrink-0">
                  <CalendarDays size={18} />
                  <span className="text-xs font-bold mt-1">{new Date(k.tanggal).getDate()}</span>
                  <span className="text-[10px]">{new Date(k.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{k.judul}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${k.status === 'akan datang' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                      {k.status}
                    </span>
                  </div>
                  {k.deskripsi && <p className="text-sm text-gray-500 dark:text-gray-400">{k.deskripsi}</p>}
                  <div className="flex gap-4 text-xs text-gray-400 mt-2">
                    {k.waktu && <span className="flex items-center gap-1"><Clock size={12} /> {k.waktu}</span>}
                    {k.lokasi && <span className="flex items-center gap-1"><MapPin size={12} /> {k.lokasi}</span>}
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-2 sm:flex-col">
                    <button onClick={() => openEdit(k)} className="text-gray-400 hover:text-emerald-600 p-2 rounded-lg border border-gray-200 dark:border-gray-800"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(k.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg border border-gray-200 dark:border-gray-800"><Trash2 size={14} /></button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Kegiatan' : 'Tambah Kegiatan'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Judul</label>
            <input required value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Tanggal</label>
              <input required type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Waktu</label>
              <input type="time" value={form.waktu} onChange={(e) => setForm({ ...form, waktu: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Lokasi</label>
            <input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'akan datang' | 'selesai' })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm">
              <option value="akan datang">Akan Datang</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">URL Poster (opsional)</label>
            <input value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors">Simpan</button>
        </form>
      </Modal>
    </div>
  )
}
