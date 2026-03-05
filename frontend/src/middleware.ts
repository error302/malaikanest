import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to protect /admin/* routes.
 * Checks for the 'access_token' HTTPOnly cookie set by the backend on login.
 * If not present, redirects to /admin/login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin/* routes, but not /admin/login itself
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const accessToken = request.cookies.get('access_token')

    if (!accessToken) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
