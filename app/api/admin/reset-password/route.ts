import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Belum login' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat mereset password' }, { status: 403 })
    }

    const { target_user_id, new_password } = await req.json()
    if (!target_user_id || !new_password) {
      return NextResponse.json({ error: 'target_user_id dan new_password wajib diisi' }, { status: 400 })
    }
    if (String(new_password).length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password,
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // Tandai agar user wajib ganti password lagi saat login berikutnya
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ force_password_change: true })
      .eq('id', target_user_id)

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
