'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Role } from '@/types/database'

export function useUserRole() {
  const [role, setRole] = useState<Role | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setRole((profile?.role as Role) ?? null)
      }
      setLoading(false)
    })
  }, [supabase])

  const canManage = role === 'admin' || role === 'pengurus'
  const isAdmin = role === 'admin'

  return { role, userId, canManage, isAdmin, loading, isLoggedIn: !!userId }
}
