'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/lib/useUserRole'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, KeyRound, Trash2, ShieldCheck, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, Role } from '@/types/database'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus',
  jamaah: 'Jamaah',
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  pengurus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  jamaah: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const router = useRouter()
  const { isAdmin, loading: roleLoading } = useUserRole()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Modal tambah user
  const [addOpen, setAddOpen] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', full_name: '', password: '', role: 'jamaah' as Role })
  const [creating, setCreating] = useState(false)

  // Modal reset password
  const [resetOpen, setResetOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    if (error) toast.error('Gagal memuat daftar user: ' + error.message)
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Halaman ini hanya untuk admin')
      router.push('/')
      return
    }
    if (isAdmin) fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, roleLoading])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newUser.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    const json = await res.json()
    setCreating(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Gagal membuat user')
      return
    }
    toast.success(`User "${newUser.username}" berhasil dibuat`)
    setAddOpen(false)
    setNewUser({ username: '', full_name: '', password: '', role: 'jamaah' })
    fetchUsers()
  }

  const handleRoleChange = async (u: Profile, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id)
    if (error) return toast.error('Gagal mengubah role: ' + error.message)
    toast.success(`Role ${u.username} diubah menjadi ${ROLE_LABEL[role]}`)
    fetchUsers()
  }

  const openReset = (u: Profile) => {
    setResetTarget(u)
    setResetPassword('')
    setResetOpen(true)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    if (resetPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setResetting(true)
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: resetTarget.id, new_password: resetPassword }),
    })
    const json = await res.json()
    setResetting(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Gagal reset password')
      return
    }
    toast.success(`Password ${resetTarget.username} berhasil direset. User wajib ganti password saat login.`)
    setResetOpen(false)
  }

  const handleDelete = async (u: Profile) => {
    if (!confirm(`Hapus akun "${u.username}"? Tindakan ini tidak dapat dibatalkan.`)) return
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: u.id }),
    })
    const json = await res.json()
    if (!res.ok) return toast.error(json.error ?? 'Gagal menghapus user')
    toast.success(`User "${u.username}" dihapus`)
    fetchUsers()
  }

  if (roleLoading) return <p className="text-center py-10 text-gray-500">Memuat...</p>
  if (!isAdmin) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UsersIcon size={22} className="text-emerald-600" /> Kelola User</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akun login pengurus &amp; jamaah</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> Tambah User
        </motion.button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-gray-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.full_name || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                        className={`text-xs rounded-full px-2 py-1 border-0 cursor-pointer ${ROLE_BADGE[u.role]}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="pengurus">Pengurus</option>
                        <option value="jamaah">Jamaah</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.force_password_change ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Belum ganti password</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center gap-1 w-fit"><ShieldCheck size={12}/> Aktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openReset(u)} title="Reset password" className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                          <KeyRound size={14} />
                        </button>
                        <button onClick={() => handleDelete(u)} title="Hapus user" className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah User */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah User Baru">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Username</label>
            <input required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="contoh: pengurus1" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Nama Lengkap</label>
            <input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Password Default</label>
            <input required type="text" minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Minimal 6 karakter" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-1">User akan diminta mengganti password ini saat login pertama.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })} className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm">
              <option value="jamaah">Jamaah</option>
              <option value="pengurus">Pengurus</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={creating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {creating ? 'Membuat...' : 'Buat User'}
          </button>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset Password: ${resetTarget?.username ?? ''}`}>
        <form onSubmit={handleReset} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Password Baru</label>
            <input required type="text" minLength={6} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400 mt-1">User wajib mengganti password ini saat login berikutnya.</p>
          </div>
          <button type="submit" disabled={resetting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {resetting ? 'Menyimpan...' : 'Reset Password'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
