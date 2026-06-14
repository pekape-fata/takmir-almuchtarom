'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { motion } from 'framer-motion'
import { Menu, X, Moon } from 'lucide-react'

const navLinks = [
  { href: '/dashboard/pengurus', label: 'Ketakmiran' },
  { href: '/dashboard/keuangan', label: 'Keuangan' },
  { href: '/dashboard/kegiatan', label: 'Kegiatan' },
  { href: '/dashboard/jadwal-sholat', label: 'Jadwal Sholat' },
  { href: '/dashboard/konsultasi', label: 'Konsultasi' },
]

export function Navbar() {
  const [username, setUsername] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single()
        setUsername(profile?.username ?? null)
      }
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
          <Moon size={22} />
          <span className="hidden sm:inline">Takmir Al Muchtarom</span>
          <span className="sm:hidden">Takmir</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {username ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Hai, {username}</span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline text-sm px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Login
            </Link>
          )}

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-col gap-3"
        >
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-gray-700 dark:text-gray-200">
              {link.label}
            </Link>
          ))}
          {username ? (
            <button onClick={handleLogout} className="text-left text-red-500">Logout ({username})</button>
          ) : (
            <Link href="/login" className="text-emerald-600 font-medium">Login</Link>
          )}
        </motion.div>
      )}
    </header>
  )
}
