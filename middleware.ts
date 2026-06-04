import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

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
    if (!token || !verifyToken(token)) {
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
