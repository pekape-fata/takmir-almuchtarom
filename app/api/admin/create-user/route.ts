import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { usernameToEmail } from '@/lib/auth-helpers'

export async function POST(req: Request) {
  try {
    // Pastikan pemanggil adalah admin
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Belum login' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat membuat akun' }, { status: 403 })
    }

    const { username, password, full_name, role } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'username dan password wajib diisi' }, { status: 400 })
    }

    const email = usernameToEmail(username)
    const supabaseAdmin = getSupabaseAdmin()

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name, role: role ?? 'jamaah' },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, user_id: created.user?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
