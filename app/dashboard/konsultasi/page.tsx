'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircleQuestion, CheckCircle2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { Konsultasi, KategoriKonsultasi } from '@/types/database'
import Link from 'next/link'

const KATEGORI: { value: KategoriKonsultasi; label: string }[] = [
  { value: 'agama', label: 'Agama' },
  { value: 'keluarga', label: 'Keluarga' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'ekonomi', label: 'Ekonomi' },
  { value: 'sosial', label: 'Sosial' },
]

export default function KonsultasiPage() {
  const supabase = createClient()
  const { canManage, userId, isLoggedIn } = useUserRole()
  const [list, setList] = useState<Konsultasi[]>([])
  const [pending, setPending] = useState<Konsultasi[]>([])
  const [loading, setLoading] = useState(true)
  const [kategori, setKategori] = useState<KategoriKonsultasi>('agama')
  const [pertanyaan, setPertanyaan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchVerified = async () => {
    const { data } = await supabase
      .from('konsultasi')
      .select('*')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(20)
    setList(data ?? [])
    setLoading(false)
  }

  const fetchPending = async () => {
    if (!canManage) return
    const { data } = await supabase
      .from('konsultasi')
      .select('*')
      .in('status', ['pending', 'draft_ready'])
      .order('created_at', { ascending: false })
    setPending(data ?? [])
  }

  useEffect(() => {
    fetchVerified()
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pertanyaan.trim().length < 10) {
      toast.error('Pertanyaan minimal 10 karakter')
      return
    }
    setSubmitting(true)

    const { data: inserted, error } = await supabase
      .from('konsultasi')
      .insert({ kategori, pertanyaan, user_id: userId ?? null, status: 'pending' })
      .select()
      .single()

    if (error || !inserted) {
      toast.error('Gagal mengirim pertanyaan')
      setSubmitting(false)
      return
    }

    // Minta draft AI
    try {
      const res = await fetch('/api/konsultasi/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pertanyaan, kategori }),
      })
      const json = await res.json()
      if (json.draft) {
        await supabase.from('konsultasi').update({ draft_ai: json.draft, status: 'draft_ready' }).eq('id', inserted.id)
      }
    } catch {
      /* draft AI gagal, tetap masuk antrian pending untuk ustadz */
    }

    toast.success('Pertanyaan terkirim! Akan dijawab oleh ustadz/narasumber.')
    setPertanyaan('')
    setSubmitting(false)
    fetchPending()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Konsultasi &amp; Dakwah</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ajukan pertanyaan seputar Agama, Keluarga, Pendidikan, Ekonomi, atau Sosial.
          Draft jawaban dibantu AI dan diverifikasi oleh ustadz/narasumber sebelum dipublikasikan.
        </p>
      </div>

      {/* Form pertanyaan */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3"
      >
        <h2 className="font-semibold flex items-center gap-2"><MessageCircleQuestion size={18} className="text-emerald-600" /> Ajukan Pertanyaan</h2>
        <div className="flex gap-2 flex-wrap">
          {KATEGORI.map((k) => (
            <button
              type="button"
              key={k.value}
              onClick={() => setKategori(k.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${kategori === k.value ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          required
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          placeholder="Tuliskan pertanyaan Anda di sini..."
          rows={4}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
        />
        {!isLoggedIn && (
          <p className="text-xs text-gray-400">Anda mengirim sebagai tamu (anonim). Login untuk melacak status pertanyaan.</p>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          <Send size={16} /> {submitting ? 'Mengirim...' : 'Kirim Pertanyaan'}
        </motion.button>
      </motion.form>

      {/* Antrian untuk ustadz */}
      {canManage && pending.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles size={18} className="text-amber-500" /> Antrian Verifikasi ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/konsultasi/${p.id}/verify`}
                className="block rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 capitalize">{p.kategori}</span>
                  <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-sm line-clamp-2">{p.pertanyaan}</p>
                <p className="text-xs text-amber-600 mt-1">{p.status === 'draft_ready' ? 'Draft AI siap direview →' : 'Belum ada draft, klik untuk proses →'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Daftar Q&A terverifikasi */}
      <div>
        <h2 className="font-semibold mb-3">Tanya Jawab</h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Memuat...</p>
        ) : list.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada konsultasi yang terjawab.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {list.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 capitalize">{q.kategori}</span>
                    <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <p className="font-medium mb-2">{q.pertanyaan}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p>{q.jawaban_final}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
