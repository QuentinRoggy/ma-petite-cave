import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const apiPath = `/${path.join('/')}`
  const url = new URL(apiPath, API_URL)
  url.search = req.nextUrl.search

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }

  let body: BodyInit | null = null
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    body = await req.arrayBuffer()
    headers['Content-Type'] = contentType
  } else if (contentType.includes('application/json')) {
    body = await req.text()
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url.toString(), {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
  })

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PATCH = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
