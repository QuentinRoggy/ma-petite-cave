import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'mpc_token'
const ROLE_COOKIE_NAME = 'mpc_role'
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/invite', '/wine']

// Routes réservées aux merchants
const MERCHANT_PATHS = ['/dashboard', '/clients', '/wines', '/shipments', '/feedback', '/reorders', '/stats', '/notifications']
// Routes réservées aux clients
const CLIENT_PATHS = ['/cave', '/boxes', '/preferences']
// Routes réservées aux admins
const ADMIN_PATHS = ['/admin']

function getDefaultRoute(role: string | undefined): string {
  if (role === 'admin') return '/admin'
  if (role === 'merchant') return '/dashboard'
  return '/boxes'
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value
  const { pathname } = request.nextUrl

  // Routes publiques
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // Rediriger vers la home si déjà connecté
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }
    return NextResponse.next()
  }

  // Non authentifié -> login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirection de la racine vers la route par défaut
  if (pathname === '/') {
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
  }

  // Vérification des accès par rôle

  // Admin routes - only accessible to admins
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }
    return NextResponse.next()
  }

  // Admin can access everything (except specific client/merchant routes which they shouldn't need)
  if (role === 'admin') {
    return NextResponse.next()
  }

  if (role === 'client') {
    // Un client ne peut pas accéder aux routes merchant-only
    if (MERCHANT_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/boxes', request.url))
    }
  }

  if (role === 'merchant') {
    // Un merchant ne peut pas accéder aux routes client-only
    if (pathname.startsWith('/cave')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
