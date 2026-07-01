import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')

export async function middleware(request: NextRequest) {
  // Demo mode: allow all access when Supabase is not configured
  if (DEMO_MODE) {
    const { pathname } = request.nextUrl
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.redirect(new URL('/workspace/ws-1', request.url))
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')
  const isLegalPage = pathname.startsWith('/privacy') || pathname.startsWith('/terms') || pathname.startsWith('/data-deletion')
  const isWebhook = pathname.startsWith('/api/meta/webhook') || pathname.startsWith('/api/mercadopago/webhook') || pathname.startsWith('/api/jclaude/oauth/callback') || pathname.startsWith('/api/auth/register')
  // TikTok fetchea sin sesión: el proxy de video (PULL_FROM_URL) y el archivo de verificación de dominio deben ser públicos
  const isPublicApi = pathname.startsWith('/api/jclaude/tiktok/media')
  const isDomainVerification = pathname.startsWith('/tiktok') && pathname.endsWith('.txt')
  const isPublicPath = pathname === '/' || isAuthPage || isLegalPage || isWebhook || isPublicApi || isDomainVerification

  const isDevPreview = pathname.startsWith('/workspace/ws-1')
  if (!user && !isPublicPath && !isDevPreview) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/workspace', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|txt|xml|svg|ico|jpg|jpeg|webp)$).*)'],
}
