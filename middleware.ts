import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_token'

// Lightweight JWT check for Edge runtime (no jsonwebtoken)
function isValidJwt(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAdminApi =
    pathname.startsWith('/api/admin') &&
    !pathname.startsWith('/api/admin/login') &&
    !pathname.startsWith('/api/admin/logout')
  const isExportApi = pathname.startsWith('/api/export')

  if (isAdminPage || isAdminApi || isExportApi) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token || !isValidJwt(token)) {
      if (isAdminPage) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/export/:path*'],
}
