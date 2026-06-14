'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { Konsultasi } from '@/types/database'
import Link from 'next/link'

export default function VerifyKonsultasiPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { canManage, userId, loading: roleLoading } = useUserRole()
  const [item, setItem] = useState<Konsultasi | null>(null)
  const [jawaban, setJawaban] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase.from('konsultasi').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error('Data tidak ditemukan')
        router.push('/dashboard/konsultasi')
        return
      }
      setItem(data)
      setJawaban(data.jawaban_final ?? data.draft_ai ?? '')
      setLoading(false)
    }
    fetchItem()
  }, [id])

  useEffect(() => {
    if (!roleLoading && !canManage) {
      toast.error('Anda tidak memiliki akses ke halaman ini')
      router.push('/dashboard/konsultasi')
    }
  }, [roleLoading, canManage, router])

  const handleGenerateDraft = async () => {
    if (!item) return
    setGenerating(true)
    try {
      const res = await fetch('/api/konsultasi/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pertanyaan: item.pertanyaan, kategori: item.kategori }),
      })
      const json = await res.json()
      if (json.draft) {
        setJawaban(json.draft)
        await supabase.from('konsultasi').update({ draft_ai: json.draft, status: 'draft_ready' }).eq('id', item.id)
        toast.success('Draft AI berhasil dibuat')
      } else {
        toast.error('Gagal membuat draft AI')
      }
    } catch {
      toast.error('Gagal menghubungi layanan AI')
    } finally {
      setGenerating(false)
    }
  }

  const handleVerify = async () => {
    if (!item || jawaban.trim().length < 5) {
      toast.error('Jawaban final tidak boleh kosong')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('konsultasi')
      .update({ jawaban_final: jawaban, status: 'verified', verified_by: userId })
      .eq('id', item.id)

    if (error) {
      toast.error('Gagal menyimpan jawaban')
      setSaving(false)
      return
    }

    toast.success('Jawaban terverifikasi & dipublikasikan')
    router.push('/dashboard/konsultasi')
  }

  if (loading || roleLoading) return <p className="text-center py-10 text-gray-500">Memuat...</p>
  if (!item) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href="/dashboard/konsultasi" className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600">
        <ArrowLeft size={14} /> Kembali ke daftar konsultasi
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Verifikasi Jawaban</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tinjau draft AI, edit seperlunya, lalu publikasikan sebagai jawaban resmi.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 capitalize">{item.kategori}</span>
        <p className="font-medium mt-2">{item.pertanyaan}</p>
      </motion.div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Draft Jawaban (AI / Final)</label>
          <button
            onClick={handleGenerateDraft}
            disabled={generating}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors disabled:opacity-60"
          >
            <Sparkles size={12} /> {generating ? 'Membuat draft...' : 'Buat / Ulangi Draft AI'}
          </button>
        </div>
        <textarea
          value={jawaban}
          onChange={(e) => setJawaban(e.target.value)}
          rows={10}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
          placeholder="Tulis atau edit jawaban di sini sebelum dipublikasikan..."
        />
        <p className="text-xs text-gray-400 mt-1">
          Pastikan jawaban sesuai syariat dan kebijakan Takmir sebelum dipublikasikan ke publik.
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleVerify}
        disabled={saving}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
      >
        <CheckCircle2 size={16} /> {saving ? 'Menyimpan...' : 'Verifikasi & Publikasikan'}
      </motion.button>
    </div>
  )
}
