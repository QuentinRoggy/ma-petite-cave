import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'mpc_token'
const PUBLIC_PATHS = ['/login', '/register', '/api/auth']

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/wines', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
