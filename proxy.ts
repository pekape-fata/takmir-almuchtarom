import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Halaman yang wajib login
  const requiresLogin = path === '/change-password' || path.startsWith('/dashboard/profile') || path.startsWith('/dashboard/admin')

  if (requiresLogin && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, force_password_change')
      .eq('id', user.id)
      .single()

    if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, force_password_change')
    .eq('id', user.id)
    .single()

  // Halaman admin hanya untuk role admin
  if (path.startsWith('/dashboard/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

    // Halaman admin hanya untuk role admin
    if (path.startsWith('/dashboard/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/change-password'],
}
