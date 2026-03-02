import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || 'http://localhost:3333'
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  if (!(options.body instanceof FormData)) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.errors?.[0]?.message || error.message || `API error: ${res.status}`)
  }

  if (res.status === 204) return {} as T
  return res.json()
}
