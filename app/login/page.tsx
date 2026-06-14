'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { usernameToEmail } from '@/lib/auth-helpers'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      toast.error('Username atau password salah')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change')
      .eq('id', data.user.id)
      .single()

    toast.success(`Selamat datang, ${username}!`)

    if (profile?.force_password_change) {
      router.push('/change-password')
    } else {
      router.refresh()
    }
    router.push('/')
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <LogIn size={22} />
          </div>
          <h1 className="text-xl font-bold">Login Takmir</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Masuk untuk mengakses fitur pengelolaan
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: admin"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </motion.button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5">
          Lupa password? Hubungi admin Takmir untuk reset akun.
        </p>
      </motion.div>
    </div>
  )
}
