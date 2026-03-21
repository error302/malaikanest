import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const refresh = request.cookies.get('refresh_token')
  const pathname = request.nextUrl.pathname

  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin/login'

  const isUserProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/')

  if (isAdminRoute && !isAdminLogin && !refresh) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isUserProtected && !refresh) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/account/:path*', '/checkout/:path*', '/orders/:path*'],
}

