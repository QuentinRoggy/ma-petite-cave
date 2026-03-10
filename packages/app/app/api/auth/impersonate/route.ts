import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'
const ROLE_COOKIE_NAME = 'mpc_role'

export async function POST(req: NextRequest) {
  const { token, role } = await req.json()

  if (!token || !role) {
    return NextResponse.json({ error: 'Missing token or role' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })

  // Set the new token
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  // Set the role
  response.cookies.set(ROLE_COOKIE_NAME, role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
