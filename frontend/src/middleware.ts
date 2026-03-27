import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/account', '/checkout', '/orders']
const AUTH_COOKIE_NAMES = ['refresh_token']

const isProtectedPath = (pathname: string) =>
  PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))

const getPublicUrl = (request: NextRequest, pathname: string) => {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (forwardedHost) {
    return new URL(pathname, `${forwardedProto || 'https'}://${forwardedHost}`)
  }

  return new URL(pathname, request.url)
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (isProtectedPath(pathname)) {
    const hasRefreshCookie = AUTH_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value))

    if (!hasRefreshCookie) {
      const loginUrl = getPublicUrl(request, '/login')
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
