'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { Modal } from '@/components/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Phone, Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { Pengurus } from '@/types/database'

const emptyForm: Omit<Pengurus, 'id'> = {
  nama: '',
  jabatan: '',
  foto_url: '',
  periode: '',
  urutan: 0,
  kontak: '',
}

export default function PengurusPage() {
  const supabase = createClient()
  const { canManage } = useUserRole()
  const [data, setData] = useState<Pengurus[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pengurus | null>(null)
  const [form, setForm] = useState<Omit<Pengurus, 'id'>>(emptyForm)

  const fetchData = async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('pengurus')
      .select('*')
      .order('urutan', { ascending: true })
    if (error) toast.error('Gagal memuat data pengurus')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: Pengurus) => {
    setEditing(p)
    setForm({ nama: p.nama, jabatan: p.jabatan, foto_url: p.foto_url, periode: p.periode, urutan: p.urutan, kontak: p.kontak })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('pengurus').update(form).eq('id', editing.id)
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Data pengurus diperbarui')
    } else {
      const { error } = await supabase.from('pengurus').insert(form)
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Pengurus baru ditambahkan')
    }
    setModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data pengurus ini?')) return
    const { error } = await supabase.from('pengurus').delete().eq('id', id)
    if (error) return toast.error('Gagal menghapus')
    toast.success('Data dihapus')
    fetchData()
  }

  const handlePrint = () => window.print()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Susunan Pengurus Takmir</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Takmir Langgar Waqaf Al Muchtarom
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Printer size={16} /> Cetak
          </button>
          {canManage && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} /> Tambah Pengurus
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada data pengurus.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {data.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3 overflow-hidden flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  {p.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                  ) : (
                    p.nama.charAt(0)
                  )}
                </div>
                <h3 className="font-semibold">{p.nama}</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{p.jabatan}</p>
                <p className="text-xs text-gray-400 mt-1">Periode {p.periode}</p>
                {p.kontak && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <Phone size={12} /> {p.kontak}
                  </p>
                )}

                {canManage && (
                  <div className="flex gap-2 mt-4 print:hidden">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pengurus' : 'Tambah Pengurus'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Nama</label>
            <input
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Jabatan</label>
            <input
              required
              value={form.jabatan}
              onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Periode</label>
            <input
              required
              placeholder="2024-2027"
              value={form.periode}
              onChange={(e) => setForm({ ...form, periode: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Urutan Tampil</label>
            <input
              type="number"
              required
              value={form.urutan}
              onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Kontak (opsional)</label>
            <input
              value={form.kontak ?? ''}
              onChange={(e) => setForm({ ...form, kontak: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">URL Foto (opsional)</label>
            <input
              value={form.foto_url ?? ''}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors">
            Simpan
          </button>
        </form>
      </Modal>
    </div>
  )
}
