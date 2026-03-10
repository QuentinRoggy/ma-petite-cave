import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'
const ROLE_COOKIE_NAME = 'mpc_role'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }).catch(() => {})
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_NAME)
  response.cookies.delete(ROLE_COOKIE_NAME)
  return response
}
