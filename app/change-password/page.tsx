'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    if (password !== confirm) {
      toast.error('Konfirmasi password tidak sama')
      return
    }

    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Sesi tidak ditemukan, silakan login ulang')
      router.push('/login')
      return
    }

    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
      toast.error('Gagal mengubah password: ' + authError.message)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ force_password_change: false })
      .eq('id', userData.user.id)

    if (profileError) {
      toast.error('Gagal memperbarui status akun')
      setLoading(false)
      return
    }

    toast.success('Password berhasil diubah')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-bold">Ganti Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ini login pertama Anda. Demi keamanan, silakan ganti password default.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Konfirmasi Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
