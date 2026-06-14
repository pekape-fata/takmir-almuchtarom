'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { Modal } from '@/components/Modal'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, FileDown, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import type { Keuangan } from '@/types/database'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const TAHUN_LIST = Array.from({ length: 2030 - 2021 + 1 }, (_, i) => 2021 + i)

const pad2 = (n: number) => String(n).padStart(2, '0')

// Hindari masalah timezone: ambil tahun & bulan langsung dari string "YYYY-MM-DD"
const deriveYearMonth = (dateStr: string) => {
  const [y, m] = dateStr.split('-').map(Number)
  return { tahun: y, bulan: m }
}

const formatTanggal = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = () => {
  const t = today()
  const { tahun, bulan } = deriveYearMonth(t)
  return {
    tanggal: t,
    tahun,
    bulan,
    jenis: 'masuk' as 'masuk' | 'keluar',
    kategori: '',
    keterangan: '',
    jumlah: 0,
    bukti_url: '',
  }
}

export default function KeuanganPage() {
  const supabase = createClient()
  const { canManage, userId } = useUserRole()
  const [data, setData] = useState<Keuangan[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [bulan, setBulan] = useState<number | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Keuangan | null>(null)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('keuangan').select('*').eq('tahun', tahun)
    if (bulan !== 'all') query = query.eq('bulan', bulan)
    const { data: rows, error } = await query.order('tanggal', { ascending: true })
    if (error) toast.error('Gagal memuat data keuangan')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahun, bulan])

  const totalMasuk = useMemo(() => data.filter(d => d.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0), [data])
  const totalKeluar = useMemo(() => data.filter(d => d.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0), [data])
  const saldo = totalMasuk - totalKeluar

  const chartData = useMemo(() => {
    return BULAN.map((nama, i) => {
      const bln = i + 1
      const masuk = data.filter(d => d.bulan === bln && d.jenis === 'masuk').reduce((a, b) => a + Number(b.jumlah), 0)
      const keluar = data.filter(d => d.bulan === bln && d.jenis === 'keluar').reduce((a, b) => a + Number(b.jumlah), 0)
      return { bulan: nama.slice(0, 3), masuk, keluar }
    })
  }, [data])

  // Tentukan tanggal default saat menambah transaksi, berdasarkan filter aktif
  const getDefaultTanggal = () => {
    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth() + 1

    if (bulan === 'all') {
      return tahun === curYear ? today() : `${tahun}-01-01`
    }
    if (tahun === curYear && bulan === curMonth) return today()
    return `${tahun}-${pad2(bulan)}-01`
  }

  const openAdd = () => {
    setEditing(null)
    const tanggal = getDefaultTanggal()
    setForm({ ...emptyForm(), tanggal, ...deriveYearMonth(tanggal) })
    setModalOpen(true)
  }

  const openEdit = (k: Keuangan) => {
    setEditing(k)
    setForm({
      tanggal: k.tanggal, tahun: k.tahun, bulan: k.bulan, jenis: k.jenis, kategori: k.kategori,
      keterangan: k.keterangan ?? '', jumlah: k.jumlah, bukti_url: k.bukti_url ?? '',
    })
    setModalOpen(true)
  }

  const handleTanggalChange = (tanggal: string) => {
    setForm({ ...form, tanggal, ...deriveYearMonth(tanggal) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('keuangan').update(form).eq('id', editing.id)
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Transaksi diperbarui')
    } else {
      const { error } = await supabase.from('keuangan').insert({ ...form, created_by: userId })
      if (error) return toast.error('Gagal menyimpan: ' + error.message)
      toast.success('Transaksi ditambahkan')
    }
    setModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return
    const { error } = await supabase.from('keuangan').delete().eq('id', id)
    if (error) return toast.error('Gagal menghapus')
    toast.success('Transaksi dihapus')
    fetchData()
  }

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Laporan Keuangan - Takmir Langgar Waqaf Al Muchtarom', 14, 15)
    doc.setFontSize(10)
    doc.text(`Periode: ${bulan === 'all' ? 'Semua bulan' : BULAN[(bulan as number) - 1]} ${tahun}`, 14, 22)

    let y = 32
    doc.setFontSize(11)
    doc.text('Tanggal', 14, y)
    doc.text('Jenis', 50, y)
    doc.text('Kategori', 80, y)
    doc.text('Keterangan', 115, y)
    doc.text('Jumlah', 175, y)
    y += 4
    doc.line(14, y, 196, y)
    y += 6

    data.forEach((row) => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.text(formatTanggal(row.tanggal), 14, y)
      doc.text(row.jenis, 50, y)
      doc.text(row.kategori, 80, y)
      doc.text((row.keterangan ?? '-').slice(0, 28), 115, y)
      doc.text(`Rp ${Number(row.jumlah).toLocaleString('id-ID')}`, 175, y)
      y += 7
    })

    y += 4
    doc.line(14, y, 196, y)
    y += 8
    doc.setFontSize(11)
    doc.text(`Total Pemasukan: Rp ${totalMasuk.toLocaleString('id-ID')}`, 14, y)
    y += 7
    doc.text(`Total Pengeluaran: Rp ${totalKeluar.toLocaleString('id-ID')}`, 14, y)
    y += 7
    doc.text(`Saldo: Rp ${saldo.toLocaleString('id-ID')}`, 14, y)

    doc.save(`laporan-keuangan-${tahun}-${bulan === 'all' ? 'semua' : bulan}.pdf`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pemasukan, pengeluaran &amp; saldo kas Takmir</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
          >
            {TAHUN_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
          >
            <option value="all">Semua Bulan</option>
            {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
          </select>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FileDown size={16} /> PDF
          </button>
          {canManage && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} /> Tambah
            </motion.button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"><TrendingUp size={16} /> Pemasukan</div>
          <p className="text-xl font-bold mt-1">Rp {totalMasuk.toLocaleString('id-ID')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-red-500 text-sm font-medium"><TrendingDown size={16} /> Pengeluaran</div>
          <p className="text-xl font-bold mt-1">Rp {totalKeluar.toLocaleString('id-ID')}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium"><Wallet size={16} /> Saldo</div>
          <p className="text-xl font-bold mt-1">Rp {saldo.toLocaleString('id-ID')}</p>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 mb-6 h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="bulan" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
              <Bar dataKey="masuk" fill="#6f9472" radius={[4, 4, 0, 0]} name="Pemasukan" />
              <Bar dataKey="keluar" fill="#c08552" radius={[4, 4, 0, 0]} name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              {canManage && <th className="px-4 py-3 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Memuat data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Belum ada transaksi pada periode ini.</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3 whitespace-nowrap">{formatTanggal(row.tanggal)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${row.jenis === 'masuk' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                    {row.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td className="px-4 py-3">{row.kategori}</td>
                <td className="px-4 py-3 text-gray-500">{row.keterangan || '-'}</td>
                <td className="px-4 py-3 text-right font-medium">Rp {Number(row.jumlah).toLocaleString('id-ID')}</td>
                {canManage && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEdit(row)} className="text-gray-400 hover:text-emerald-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              required
              min={`${TAHUN_LIST[0]}-01-01`}
              max={`${TAHUN_LIST[TAHUN_LIST.length - 1]}-12-31`}
              value={form.tanggal}
              onChange={(e) => handleTanggalChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tahun &amp; bulan laporan ({form.tahun} / {BULAN[form.bulan - 1]}) otomatis diambil dari tanggal ini.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Jenis</label>
            <div className="flex gap-2">
              {(['masuk', 'keluar'] as const).map((j) => (
                <button
                  type="button"
                  key={j}
                  onClick={() => setForm({ ...form, jenis: j })}
                  className={`flex-1 py-2 rounded-xl text-sm border ${form.jenis === j ? (j === 'masuk' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500') : 'border-gray-300 dark:border-gray-700'}`}
                >
                  {j === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Kategori</label>
            <input required value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Infaq, Listrik, dll" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Jumlah (Rp)</label>
            <input required type="number" min={0} value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">URL Bukti (opsional)</label>
            <input value={form.bukti_url} onChange={(e) => setForm({ ...form, bukti_url: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors">Simpan</button>
        </form>
      </Modal>
    </div>
  )
}
