import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const res = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(data)
}
