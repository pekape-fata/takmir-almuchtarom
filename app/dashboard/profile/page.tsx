'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { UserCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus',
  jamaah: 'Jamaah',
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id)
    setSavingProfile(false)
    if (error) return toast.error('Gagal menyimpan: ' + error.message)
    toast.success('Profil berhasil diperbarui')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Password baru minimal 6 karakter')
    if (newPassword !== confirmPassword) return toast.error('Konfirmasi password tidak sama')

    setSavingPassword(true)

    // Verifikasi password lama dengan re-login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setSavingPassword(false)
      return toast.error('Sesi tidak valid, silakan login ulang')
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    })
    if (verifyError) {
      setSavingPassword(false)
      return toast.error('Password lama salah')
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) return toast.error('Gagal mengubah password: ' + error.message)

    toast.success('Password berhasil diubah')
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (loading) return <p className="text-center py-10 text-gray-500">Memuat...</p>
  if (!profile) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCircle2 size={24} className="text-emerald-600" /> Profil Saya</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Kelola informasi akun dan keamanan login Anda</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{profile.username}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Nama Lengkap</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" placeholder="Nama lengkap Anda" />
          </div>
          <button type="submit" disabled={savingProfile} className="text-sm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-60">
            {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound size={18} className="text-emerald-600" /> Ganti Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Password Saat Ini</label>
            <input required type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Password Baru</label>
            <input required type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Konfirmasi Password Baru</label>
            <input required type="password" minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={savingPassword} className="text-sm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-60">
            {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </form>
      </motion.div>

      {!profile.force_password_change && (
        <p className="text-xs text-gray-400 flex items-center gap-1"><ShieldCheck size={12} /> Akun Anda aman, password sudah diganti dari default.</p>
      )}
    </div>
  )
}
