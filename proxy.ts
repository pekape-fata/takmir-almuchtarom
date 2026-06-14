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

  // Halaman yang butuh login
  const protectedPaths = ['/dashboard/pengurus/edit', '/dashboard/keuangan/tambah', '/change-password']

  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  if (isProtected && !user) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Jika sudah login dan wajib ganti password, paksa ke /change-password
  if (user && path.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('force_password_change')
      .eq('id', user.id)
      .single()

    if (profile?.force_password_change && path !== '/change-password') {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/change-password'],
}
